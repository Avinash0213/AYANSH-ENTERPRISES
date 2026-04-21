namespace BMS.Api.Data;

using BMS.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<UserPermission> UserPermissions => Set<UserPermission>();
    public DbSet<NotificationLog> NotificationLogs => Set<NotificationLog>();
    public DbSet<SataraVisit> SataraVisits => Set<SataraVisit>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Customer>().HasQueryFilter(c => !c.IsDeleted);
        builder.Entity<Customer>().Property(c => c.Type).HasConversion<int>();
        builder.Entity<Customer>().HasIndex(c => c.SerialNumber).IsUnique();
        builder.Entity<Customer>().HasIndex(c => c.OwnerPhone);
        builder.Entity<Customer>().HasIndex(c => c.TenantPhone);
        builder.Entity<Customer>().HasIndex(c => c.CreatedDate);
        builder.Entity<Customer>().HasIndex(c => c.Status);

        builder.Entity<Customer>().Property(c => c.Rent).HasPrecision(18, 2);
        builder.Entity<Customer>().Property(c => c.Deposit).HasPrecision(18, 2);
        builder.Entity<Customer>().Property(c => c.QuotedAmount).HasPrecision(18, 2);

        builder.Entity<User>().HasQueryFilter(u => !u.IsDeleted);

        // Sequence for AE00001
        builder.HasSequence<int>("ae_seq").StartsAt(1).IncrementsBy(1);

        builder.Entity<RolePermission>()
            .HasKey(rp => new { rp.RoleId, rp.PermissionId });

        builder.Entity<UserPermission>()
            .HasKey(up => new { up.UserId, up.PermissionId });

        builder.Entity<Payment>()
            .Property(p => p.ReceivedAmount).HasPrecision(18, 2);
        builder.Entity<Payment>()
            .Property(p => p.GovernmentCharges).HasPrecision(18, 2);
        builder.Entity<Payment>()
            .Property(p => p.EmployeeCommission).HasPrecision(18, 2);
        builder.Entity<Payment>()
            .Property(p => p.Profit).HasPrecision(18, 2);
    }
}
