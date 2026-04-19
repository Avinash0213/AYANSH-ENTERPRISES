namespace BMS.Api.Controllers;

using BMS.Api.Data;
using BMS.Api.Domain.Entities;
using BMS.Api.DTOs;
using BMS.Api.Middleware;
using BMS.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PermissionsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IPermissionService _permService;

    public PermissionsController(AppDbContext db, IPermissionService permService)
    {
        _db = db;
        _permService = permService;
    }

    /// <summary>
    /// Get all available permissions
    /// </summary>
    [HttpGet]
    [RequirePermission("ACCESS_MANAGE")]
    public async Task<IActionResult> GetAllPermissions()
    {
        var permissions = await _db.Permissions
            .OrderBy(p => p.Id)
            .Select(p => new PermissionResponse { Id = p.Id, Name = p.Name })
            .ToListAsync();
        return Ok(permissions);
    }

    /// <summary>
    /// Get current user's effective permissions
    /// </summary>
    [HttpGet("my")]
    public async Task<IActionResult> GetMyPermissions()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var allPerms = await _db.Permissions.ToListAsync();
        var result = new List<string>();

        foreach (var perm in allPerms)
        {
            if (await _permService.HasPermissionAsync(userId, perm.Name))
                result.Add(perm.Name);
        }

        return Ok(result);
    }

    /// <summary>
    /// Get permissions for a specific user (effective + source)
    /// </summary>
    [HttpGet("user/{userId}")]
    [RequirePermission("ACCESS_MANAGE")]
    public async Task<IActionResult> GetUserPermissions(int userId)
    {
        var allPerms = await _db.Permissions.ToListAsync();
        var user = await _db.Users
            .IgnoreQueryFilters()
            .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null) return NotFound();

        var userOverrides = await _db.UserPermissions
            .Where(up => up.UserId == userId)
            .Include(up => up.Permission)
            .ToListAsync();

        var result = new List<UserPermissionResponse>();
        foreach (var perm in allPerms)
        {
            var userOverride = userOverrides.FirstOrDefault(uo => uo.PermissionId == perm.Id);
            bool isGranted;
            string source;

            if (userOverride != null)
            {
                isGranted = userOverride.IsGranted;
                source = "UserOverride";
            }
            else
            {
                isGranted = user.Role?.RolePermissions.Any(rp => rp.PermissionId == perm.Id) ?? false;
                source = "Role";
            }

            result.Add(new UserPermissionResponse
            {
                PermissionId = perm.Id,
                PermissionName = perm.Name,
                IsGranted = isGranted,
                Source = source
            });
        }

        return Ok(result);
    }

    [HttpPost("grant")]
    [RequirePermission("ACCESS_MANAGE")]
    public async Task<IActionResult> GrantPermission([FromBody] GrantRevokeRequest req)
    {
        var existing = await _db.UserPermissions
            .FirstOrDefaultAsync(up => up.UserId == req.UserId && up.PermissionId == req.PermissionId);

        if (existing != null)
            existing.IsGranted = true;
        else
            _db.UserPermissions.Add(new UserPermission
                { UserId = req.UserId, PermissionId = req.PermissionId, IsGranted = true });

        await _db.SaveChangesAsync();
        return Ok(new { message = "Permission granted" });
    }

    [HttpPost("revoke")]
    [RequirePermission("ACCESS_MANAGE")]
    public async Task<IActionResult> RevokePermission([FromBody] GrantRevokeRequest req)
    {
        var existing = await _db.UserPermissions
            .FirstOrDefaultAsync(up => up.UserId == req.UserId && up.PermissionId == req.PermissionId);

        if (existing != null)
            existing.IsGranted = false;
        else
            _db.UserPermissions.Add(new UserPermission
                { UserId = req.UserId, PermissionId = req.PermissionId, IsGranted = false });

        await _db.SaveChangesAsync();
        return Ok(new { message = "Permission revoked" });
    }
}
