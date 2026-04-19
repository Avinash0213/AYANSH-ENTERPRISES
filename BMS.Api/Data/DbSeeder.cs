namespace BMS.Api.Data;

using BMS.Api.Domain.Entities;
using BMS.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        // 1. Roles
        if (!await db.Roles.AnyAsync())
        {
            db.Roles.AddRange(
                new Role { Id = 1, Name = "Admin" },
                new Role { Id = 2, Name = "Employee" }
            );
            await db.SaveChangesAsync();
        }

        // 2. Permissions
        if (!await db.Permissions.AnyAsync())
        {
            var permissions = new[]
            {
                "USER_CREATE", "USER_UPDATE", "USER_DELETE", "USER_VIEW",
                "REPORT_VIEW", "PAYMENT_VIEW", "RENEWAL_VIEW", "ACCESS_MANAGE",
                "SATARA_VIEW"
            };
            foreach (var p in permissions)
                db.Permissions.Add(new Permission { Name = p });
            await db.SaveChangesAsync();
        }

        // 3. RolePermissions
        if (!await db.RolePermissions.AnyAsync())
        {
            var allPerms = await db.Permissions.ToListAsync();
            foreach (var p in allPerms)
                db.RolePermissions.Add(new RolePermission { RoleId = 1, PermissionId = p.Id });

            var empPerms = new[] { "RENEWAL_VIEW" };
            foreach (var p in allPerms.Where(x => empPerms.Contains(x.Name)))
                db.RolePermissions.Add(new RolePermission { RoleId = 2, PermissionId = p.Id });

            await db.SaveChangesAsync();
        }

        // Ensure SATARA_VIEW exists
        var sataraPerm = await db.Permissions.FirstOrDefaultAsync(p => p.Name == "SATARA_VIEW");
        if (sataraPerm == null)
        {
            sataraPerm = new Permission { Name = "SATARA_VIEW" };
            db.Permissions.Add(sataraPerm);
            await db.SaveChangesAsync();
        }

        // 3.5 Global Admin Permission Sync: Ensure RoleId 1 has ALL current permissions
        var allCurrentPerms = await db.Permissions.ToListAsync();
        var adminPermIds = await db.RolePermissions
            .Where(rp => rp.RoleId == 1)
            .Select(rp => rp.PermissionId)
            .ToListAsync();

        foreach (var p in allCurrentPerms)
        {
            if (!adminPermIds.Contains(p.Id))
            {
                db.RolePermissions.Add(new RolePermission { RoleId = 1, PermissionId = p.Id });
            }
        }
        await db.SaveChangesAsync();

        // Active Revocation hook for existing test databases
        var revokable = await db.RolePermissions
            .Include(rp => rp.Permission)
            .Where(rp => rp.RoleId == 2 && (rp.Permission.Name == "USER_VIEW" || rp.Permission.Name == "USER_UPDATE"))
            .ToListAsync();
        
        if (revokable.Any())
        {
            db.RolePermissions.RemoveRange(revokable);
            await db.SaveChangesAsync();
        }

        // 4. Users — ensure at least 3 exist with names
        var existingUsers = await db.Users.IgnoreQueryFilters().ToListAsync();
        if (existingUsers.Count < 3)
        {
            // Fix existing users that might have null Name
            foreach (var u in existingUsers.Where(x => string.IsNullOrEmpty(x.Name)))
            {
                u.Name = u.Email.Split('@')[0].Replace(".", " ");
                u.Name = char.ToUpper(u.Name[0]) + u.Name[1..];
            }

            if (!existingUsers.Any(u => u.Email == "admin@bms.com"))
            {
                db.Users.Add(new User
                {
                    Name = "Admin User",
                    Email = "admin@bms.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                    RoleId = 1
                });
            }
            if (!existingUsers.Any(u => u.Email == "sarah@bms.com"))
            {
                db.Users.Add(new User
                {
                    Name = "Sarah Johnson",
                    Email = "sarah@bms.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Employee@123"),
                    RoleId = 2
                });
            }
            if (!existingUsers.Any(u => u.Email == "mike@bms.com"))
            {
                db.Users.Add(new User
                {
                    Name = "Mike Chen",
                    Email = "mike@bms.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Employee@123"),
                    RoleId = 2
                });
            }
            await db.SaveChangesAsync();
        }
        else
        {
            // Patch names on existing users if null
            bool changed = false;
            foreach (var u in existingUsers.Where(x => string.IsNullOrEmpty(x.Name)))
            {
                u.Name = u.Email == "admin@bms.com" ? "Admin User"
                       : u.Email == "sarah@bms.com" ? "Sarah Johnson"
                       : u.Email == "mike@bms.com"  ? "Mike Chen"
                       : u.Email.Split('@')[0];
                changed = true;
            }
            if (changed) await db.SaveChangesAsync();
        }

        var allExistingCustomers = await db.Customers.IgnoreQueryFilters().ToListAsync();
        if (allExistingCustomers.Any() && allExistingCustomers.All(c => c.Status == CustomerStatus.Completed))
        {
            var rngStatus = new Random();
            foreach (var c in allExistingCustomers)
            {
                c.Status = (CustomerStatus)rngStatus.Next(0, 4);
            }
            await db.SaveChangesAsync();
        }

        var customerCount = await db.Customers.IgnoreQueryFilters().CountAsync();
        var hasOldData = await db.Customers.IgnoreQueryFilters().AnyAsync(c => c.SerialNumber.StartsWith("IN"));
        
        if (customerCount < 250 || hasOldData)
        {
            // Remove old data first
            var oldPayments = await db.Payments.ToListAsync();
            db.Payments.RemoveRange(oldPayments);

            var oldCustomers = await db.Customers.IgnoreQueryFilters().ToListAsync();
            db.Customers.RemoveRange(oldCustomers);
            await db.SaveChangesAsync();

            var admin = await db.Users.IgnoreQueryFilters().FirstAsync(u => u.RoleId == 1);
            var employees = await db.Users.IgnoreQueryFilters().Where(u => u.RoleId == 2).ToListAsync();
            var allUsers = new List<User> { admin };
            allUsers.AddRange(employees);
            
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var rng = new Random(88);

            var firstNames = new[] { 
                "Rajesh", "Amit", "Vikram", "Sanjay", "Rohan", "Arjun", "Nishant", "Aditya", "Rahul", "Sandeep", 
                "Vijay", "Pooja", "Anjali", "Sneha", "Kiran", "Deepak", "Sunita", "Aavash", "Manish", "Preeti",
                "Kunal", "Snehal", "Omkar", "Pratik", "Sagar", "Tushar", "Suraj", "Akash", "Aman", "Rishi"
            };
            var lastNames = new[] { 
                "Sharma", "Verma", "Gupta", "Malhotra", "Kapoor", "Khanna", "Joshi", "Patel", "Reddy", "Iyer",
                "Dubey", "Pandey", "Tiwari", "Shukla", "Dwivedi", "Chaturvedi", "Shrivastava", "Bhatt", "Mehta", "Shah",
                "Deshmukh", "Patil", "Kulkarni", "Deshpande", "Gaikwad", "Pawar", "Jadhav", "More", "Shinde"
            };
            var cities = new[] { "Mumbai", "Delhi", "Bangalore", "Pune", "Ahmedabad", "Hyderabad", "Chennai", "Kolkata", "Noida", "Gurugram", "Indore", "Jaipur", "Lucknow" };

            var customers = new List<Customer>();
            for (int i = 1; i <= 250; i++)
            {
                var ownerFirst = firstNames[rng.Next(firstNames.Length)];
                var ownerLast = lastNames[rng.Next(lastNames.Length)];
                var ownerName = $"{ownerFirst} {ownerLast}";
                var ownerEmail = $"{ownerFirst.ToLower()}.{ownerLast.ToLower()}{i}@ayansh.com";
                var ownerPhone = $"+919{rng.Next(100000000, 999999999)}";

                var tenantFirst = firstNames[rng.Next(firstNames.Length)];
                var tenantLast = lastNames[rng.Next(lastNames.Length)];
                var tenantName = $"{tenantFirst} {tenantLast}";
                var tenantEmail = $"{tenantFirst.ToLower()}.{tenantLast.ToLower()}{i}@tenantmail.in";
                var tenantPhone = $"+918{rng.Next(100000000, 999999999)}";

                var city = cities[rng.Next(cities.Length)];
                var address = $"Apt {rng.Next(101, 2500)}, {rng.Next(1, 15)}th Floor, Wing {char.ConvertFromUtf32(65 + rng.Next(10))}, Emerald Heights, {city}, India";
                
                var periods = new[] { 11, 12, 18, 24, 36 };
                var period = periods[rng.Next(periods.Length)];
                var type = (CustomerType)(i % 3);
                
                DateOnly startDate;
                DateOnly endDate;

                if (i % 10 < 4) // 40% are "due soon" or "just expired"
                {
                    var targetEndOffset = rng.Next(-5, 45); 
                    endDate = today.AddDays(targetEndOffset);
                    startDate = endDate.AddMonths(-period);
                }
                else
                {
                    startDate = today.AddMonths(-rng.Next(1, 24)).AddDays(-rng.Next(0, 28));
                    endDate = startDate.AddMonths(period);
                }

                var creator = allUsers[rng.Next(allUsers.Count)];

                customers.Add(new Customer
                {
                    SerialNumber = $"AE{i:D5}",
                    OwnerName = ownerName,
                    OwnerEmail = ownerEmail,
                    OwnerPhone = ownerPhone,
                    TenantName = tenantName,
                    TenantEmail = tenantEmail,
                    TenantPhone = tenantPhone,
                    TokenNumber = $"TKN-{2025}-{i:D4}",
                    Type = type,
                    Status = (CustomerStatus)rng.Next(0, 4),
                    StartDate = startDate,
                    Period = period,
                    EndDate = endDate,
                    Address = address,
                    InquiryFrom = rng.Next(0, 2) == 0 ? "Self" : "Agent",
                    Comment = $"Fully verified status. {(type == CustomerType.Renewal ? "Legacy client" : "New acquisition")}. All checks passed.",
                    CreatedById = creator.Id,
                    CreatedDate = DateTime.UtcNow.AddDays(-rng.Next(1, 300))
                });
            }

            db.Customers.AddRange(customers);
            await db.SaveChangesAsync();

            // 6. Payments — rich payment data
            var allCustomers = await db.Customers.Where(c => c.Type != CustomerType.Cancel).ToListAsync();
            var payments = new List<Payment>();

            foreach (var customer in allCustomers)
            {
                // First payment for every active customer
                var received1 = (decimal)rng.Next(3000, 18000);
                var govt1 = Math.Round(received1 * (decimal)(0.03 + rng.NextDouble() * 0.04), 2);
                var comm1 = Math.Round(received1 * (decimal)(0.05 + rng.NextDouble() * 0.08), 2);

                payments.Add(new Payment
                {
                    CustomerId = customer.Id,
                    ReceivedAmount = received1,
                    GovernmentCharges = govt1,
                    EmployeeCommission = comm1,
                    Profit = received1 - govt1 - comm1,
                    PaymentDate = today.AddDays(-rng.Next(5, 90)),
                    CreatedById = admin.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-rng.Next(5, 90))
                });

                // ~50% of customers have a second payment
                if (rng.Next(0, 2) == 1)
                {
                    var received2 = (decimal)rng.Next(2000, 10000);
                    var govt2 = Math.Round(received2 * (decimal)(0.03 + rng.NextDouble() * 0.04), 2);
                    var comm2 = Math.Round(received2 * (decimal)(0.06 + rng.NextDouble() * 0.06), 2);

                    payments.Add(new Payment
                    {
                        CustomerId = customer.Id,
                        ReceivedAmount = received2,
                        GovernmentCharges = govt2,
                        EmployeeCommission = comm2,
                        Profit = received2 - govt2 - comm2,
                        PaymentDate = today.AddDays(-rng.Next(1, 30)),
                        CreatedById = employees.FirstOrDefault()?.Id ?? admin.Id,
                        CreatedAt = DateTime.UtcNow.AddDays(-rng.Next(1, 30))
                    });
                }

                // ~25% of customers have a third payment
                if (rng.Next(0, 4) == 0)
                {
                    var received3 = (decimal)rng.Next(1000, 6000);
                    var govt3 = Math.Round(received3 * 0.05m, 2);
                    var comm3 = Math.Round(received3 * 0.10m, 2);

                    payments.Add(new Payment
                    {
                        CustomerId = customer.Id,
                        ReceivedAmount = received3,
                        GovernmentCharges = govt3,
                        EmployeeCommission = comm3,
                        Profit = received3 - govt3 - comm3,
                        PaymentDate = today.AddDays(-rng.Next(1, 15)),
                        CreatedById = employees.LastOrDefault()?.Id ?? admin.Id,
                        CreatedAt = DateTime.UtcNow.AddDays(-rng.Next(1, 15))
                    });
                }
            }

            db.Payments.AddRange(payments);
            await db.SaveChangesAsync();
        }

        // 7. Satara Visits — initial seeding
        if (!await db.SataraVisits.AnyAsync())
        {
            var admin = await db.Users.IgnoreQueryFilters().FirstAsync(u => u.RoleId == 1);
            var rng = new Random(42);
            var today = DateTime.UtcNow;

            var visits = new List<SataraVisit>();
            var visitPayments = new List<Payment>();

            var people = new[] { "Aditi Patel", "Sameer Deshpande", "Priyanka Shinde", "Karan Gaikwad", "Sneha Pawar", "Rahul More", "Anjali Patil", "Vikram Kulkarni", "Swati Jadhav", "Manoj Shinde" };
            var taskTypes = new[] { "Full KYC", "Tenant Verification", "Agreement Pick-up", "Document Submission", "Owner Signature" };

            for (int i = 1; i <= 20; i++)
            {
                var personName = people[rng.Next(people.Length)];
                var visitCode = $"SAT{i:D5}";
                var scheduledDate = today.AddDays(rng.Next(-10, 10));
                var status = scheduledDate < today ? (rng.Next(0, 5) > 0 ? "Completed" : "Cancelled") : "Pending";

                var visit = new SataraVisit
                {
                    VisitCode = visitCode,
                    PersonName = personName,
                    PhoneNumber = $"+91 7{rng.Next(10000, 99999)} {rng.Next(10000, 99999)}",
                    Address = $"{rng.Next(101, 500)}, Satara Main Road, Near {rng.Next(1, 10)}th Circle, Satara",
                    ScheduledTime = scheduledDate,
                    TaskType = taskTypes[rng.Next(taskTypes.Length)],
                    TokenNumber = $"SAT-TKN-{rng.Next(100000, 999999)}",
                    Password = "Pass@" + rng.Next(100, 999),
                    Remarks = i % 5 == 0 ? "Urgent processing requested." : "Standard verification process.",
                    Status = status,
                    CreatedAt = today.AddDays(-15),
                    CreatedById = admin.Id
                };
                visits.Add(visit);

                // Add payments for completed visits
                if (status == "Completed")
                {
                    var received = (decimal)rng.Next(500, 2000);
                    var commission = (decimal)rng.Next(200, 500);

                    visitPayments.Add(new Payment
                    {
                        SataraVisitCode = visitCode,
                        ReceivedAmount = received,
                        GovernmentCharges = 0,
                        EmployeeCommission = commission,
                        Profit = received - commission,
                        PaymentDate = DateOnly.FromDateTime(scheduledDate),
                        Comment = $"Commission for Satara Visit {visitCode}",
                        CollectorName = "Satara Agent",
                        CreatedById = admin.Id,
                        CreatedAt = scheduledDate.AddHours(2)
                    });
                }
            }

            db.SataraVisits.AddRange(visits);
            db.Payments.AddRange(visitPayments);
            await db.SaveChangesAsync();
        }
    }
}
