using BMS.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BMS.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        // 1. Roles
        if (!await context.Roles.AnyAsync())
        {
            var adminRole = new Role { Name = "Admin" };
            var employeeRole = new Role { Name = "Employee" };
            context.Roles.AddRange(adminRole, employeeRole);
            await context.SaveChangesAsync();
        }

        var adminRoleId = (await context.Roles.FirstAsync(r => r.Name == "Admin")).Id;

        // 2. Permissions
        var permissions = new[]
        {
            "USER_VIEW", "USER_CREATE", "USER_UPDATE", "USER_DELETE",
            "CUSTOMER_VIEW", "CUSTOMER_CREATE", "CUSTOMER_UPDATE", "CUSTOMER_DELETE",
            "PAYMENT_VIEW", "RENEWAL_VIEW", "REPORT_VIEW", "SATARA_VIEW"
        };

        foreach (var pName in permissions)
        {
            if (!await context.Permissions.AnyAsync(p => p.Name == pName))
            {
                context.Permissions.Add(new Permission { Name = pName });
            }
        }
        await context.SaveChangesAsync();

        // 3. Admin Permissions Mapping
        var allPerms = await context.Permissions.ToListAsync();
        var existingRolePerms = await context.RolePermissions.Where(rp => rp.RoleId == adminRoleId).ToListAsync();

        foreach (var perm in allPerms)
        {
            if (!existingRolePerms.Any(rp => rp.PermissionId == perm.Id))
            {
                context.RolePermissions.Add(new RolePermission { RoleId = adminRoleId, PermissionId = perm.Id });
            }
        }
        await context.SaveChangesAsync();

        // 4. Default Admin User
        if (!await context.Users.AnyAsync(u => u.Email == "admin@bms.com"))
        {
            context.Users.Add(new User
            {
                Name = "Administrator",
                Email = "admin@bms.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                RoleId = adminRoleId
            });
            await context.SaveChangesAsync();
        }
    }
}
