namespace BMS.Api.Services;

using BMS.Api.Data;
using BMS.Api.Domain.Entities;
using BMS.Api.DTOs;
using Microsoft.EntityFrameworkCore;

public class UserService
{
    private readonly AppDbContext _db;

    public UserService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<UserResponse>> GetAllAsync()
    {
        return await _db.Users
            .Include(u => u.Role)
            .OrderBy(u => u.Id)
            .Select(u => new UserResponse
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Email,
                RoleId = u.RoleId,
                RoleName = u.Role.Name,
                IsDeleted = u.IsDeleted
            })
            .ToListAsync();
    }

    public async Task<UserResponse> GetMeAsync(int requestingUserId)
    {
        var user = await _db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == requestingUserId);
        if (user == null)
            throw new KeyNotFoundException("User not found");

        return new UserResponse
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            RoleId = user.RoleId,
            RoleName = user.Role.Name,
            IsDeleted = user.IsDeleted
        };
    }

    public async Task<UserResponse> UpdateMeAsync(int requestingUserId, UpdateProfileRequest req)
    {
        var user = await _db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == requestingUserId);
        if (user == null)
            throw new KeyNotFoundException("User not found");

        user.Name = req.Name;

        if (req.Email != user.Email) 
        {
            var exists = await _db.Users.AnyAsync(u => u.Email == req.Email);
            if (exists) throw new InvalidOperationException("A user with this email already exists.");
            user.Email = req.Email;
        }

        if (!string.IsNullOrEmpty(req.Password))
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password);

        await _db.SaveChangesAsync();

        return new UserResponse
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            RoleId = user.RoleId,
            RoleName = user.Role.Name
        };
    }

    public async Task<UserResponse> CreateAsync(CreateUserRequest req, int requestingUserId)
    {
        var requestingUser = await _db.Users.FindAsync(requestingUserId);
        if (requestingUser != null && req.RoleId < requestingUser.RoleId)
            throw new UnauthorizedAccessException("Cannot assign a higher-ranked role than your own.");

        var exists = await _db.Users.AnyAsync(u => u.Email == req.Email);
        if (exists)
            throw new InvalidOperationException("A user with this email already exists.");

        var user = new User
        {
            Name = req.Name,
            Email = req.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            RoleId = req.RoleId
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        await _db.Entry(user).Reference(u => u.Role).LoadAsync();

        return new UserResponse
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            RoleId = user.RoleId,
            RoleName = user.Role.Name
        };
    }

    public async Task<UserResponse> UpdateAsync(int id, UpdateUserRequest req, int requestingUserId)
    {
        var user = await _db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == id);
        if (user == null)
            throw new KeyNotFoundException("User not found");

        var requestingUser = await _db.Users.FindAsync(requestingUserId);
        if (requestingUser != null)
        {
            if (user.RoleId < requestingUser.RoleId || req.RoleId < requestingUser.RoleId)
                throw new UnauthorizedAccessException("You cannot perform an action on a higher-ranked role.");
        }

        user.Name = req.Name;
        user.Email = req.Email;
        user.RoleId = req.RoleId;

        if (!string.IsNullOrEmpty(req.Password))
        {
            if (requestingUser != null && requestingUser.RoleId != 1 && requestingUserId != id)
                throw new UnauthorizedAccessException("Only an Admin or the user themselves can change the password.");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password);
        }

        await _db.SaveChangesAsync();
        await _db.Entry(user).Reference(u => u.Role).LoadAsync();

        return new UserResponse
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            RoleId = user.RoleId,
            RoleName = user.Role.Name
        };
    }

    public async Task DeleteAsync(int id, int requestingUserId)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null)
            throw new KeyNotFoundException("User not found");

        if (id == 1)
            throw new UnauthorizedAccessException("The primary admin account cannot be deleted.");

        if (id == requestingUserId)
            throw new UnauthorizedAccessException("You cannot delete your own account.");

        var requestingUser = await _db.Users.FindAsync(requestingUserId);
        if (requestingUser != null && user.RoleId < requestingUser.RoleId)
            throw new UnauthorizedAccessException("You cannot delete a higher-ranked user.");

        user.IsDeleted = true;
        await _db.SaveChangesAsync();
    }
}
