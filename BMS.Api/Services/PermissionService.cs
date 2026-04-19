namespace BMS.Api.Services;

using BMS.Api.Data;
using BMS.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

public class PermissionService : IPermissionService
{
    private readonly AppDbContext _db;

    public PermissionService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<bool> HasPermissionAsync(int userId, string permissionName)
    {
        var userOverride = await _db.UserPermissions
            .Include(up => up.Permission)
            .FirstOrDefaultAsync(up => up.UserId == userId && up.Permission.Name == permissionName);

        if (userOverride != null)
            return userOverride.IsGranted;

        var user = await _db.Users
            .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(u => u.Id == userId);

        return user?.Role?.RolePermissions.Any(rp => rp.Permission.Name == permissionName) ?? false;
    }
}
