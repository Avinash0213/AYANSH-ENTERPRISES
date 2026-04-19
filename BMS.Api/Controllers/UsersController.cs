namespace BMS.Api.Controllers;

using BMS.Api.DTOs;
using BMS.Api.Middleware;
using BMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly UserService _userService;

    public UsersController(UserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    [RequirePermission("USER_VIEW")]
    public async Task<IActionResult> GetAll()
    {
        var users = await _userService.GetAllAsync();
        return Ok(users);
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        try
        {
            var requestingUserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            var user = await _userService.GetMeAsync(requestingUserId);
            return Ok(user);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "User not found" });
        }
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileRequest req)
    {
        try
        {
            var requestingUserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            var user = await _userService.UpdateMeAsync(requestingUserId, req);
            return Ok(user);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "User not found" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost]
    [RequirePermission("USER_CREATE")]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest req)
    {
        try
        {
            var requestingUserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            var user = await _userService.CreateAsync(req, requestingUserId);
            return CreatedAtAction(nameof(GetAll), new { id = user.Id }, user);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [RequirePermission("USER_UPDATE")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest req)
    {
        try
        {
            var requestingUserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            var user = await _userService.UpdateAsync(id, req, requestingUserId);
            return Ok(user);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "User not found" });
        }
    }

    [HttpDelete("{id}")]
    [RequirePermission("USER_DELETE")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var requestingUserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            await _userService.DeleteAsync(id, requestingUserId);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "User not found" });
        }
    }
}
