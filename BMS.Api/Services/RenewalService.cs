namespace BMS.Api.Services;

using BMS.Api.Data;
using BMS.Api.Domain.Entities;
using BMS.Api.DTOs;
using Microsoft.EntityFrameworkCore;

public class RenewalService
{
    private readonly AppDbContext _db;

    public RenewalService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<CustomerResponse>> GetDueRenewalsAsync()
    {
        var targetDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30));

        var dueCustomers = await _db.Customers
            .Include(c => c.CreatedBy)
            .Where(c => !c.IsDeleted && 
                        c.Type != Domain.Enums.CustomerType.Cancel && 
                        c.EndDate <= targetDate)
            .ToListAsync();

        bool changed = false;
        foreach (var c in dueCustomers)
        {
            if (c.Type == Domain.Enums.CustomerType.New)
            {
                c.Type = Domain.Enums.CustomerType.Renewal;
                changed = true;
            }
        }

        if (changed)
        {
            await _db.SaveChangesAsync();
        }

        return dueCustomers
            .OrderBy(c => c.EndDate)
            .Select(c => new CustomerResponse
            {
                Id = c.Id,
                SerialNumber = c.SerialNumber,
                OwnerName = c.OwnerName,
                OwnerPhone = c.OwnerPhone,
                OwnerEmail = c.OwnerEmail,
                TenantName = c.TenantName,
                TenantPhone = c.TenantPhone,
                TenantEmail = c.TenantEmail,
                TokenNumber = c.TokenNumber,
                InquiryFrom = c.InquiryFrom,
                Comment = c.Comment,
                Address = c.Address,
                Type = (int)c.Type,
                TypeName = c.Type.ToString(),
                Status = (int)c.Status,
                StatusName = c.Status.ToString(),
                StartDate = c.StartDate,
                Period = c.Period,
                EndDate = c.EndDate,
                CreatedDate = c.CreatedDate,
                CreatedByName = c.CreatedBy != null ? c.CreatedBy.Name : "System"
            })
            .ToList();
    }
}
