namespace BMS.Api.Domain.Entities;
using BMS.Api.Domain.Enums;

public class Customer
{
    public int Id { get; set; }
    public string SerialNumber { get; set; } = null!;
    public string OwnerName { get; set; } = null!;
    public string? OwnerPhone { get; set; }
    public string? OwnerEmail { get; set; }
    public string TenantName { get; set; } = null!;
    public string? TenantPhone { get; set; }
    public string? TenantEmail { get; set; }
    public string? TokenNumber { get; set; }
    public string? InquiryFrom { get; set; } // "Self" or "Agent"
    public string? Comment { get; set; }
    public string? Address { get; set; }
    public CustomerType Type { get; set; }
    public CustomerStatus Status { get; set; }

    public DateOnly? StartDate { get; set; }
    public int? Period { get; set; } // in months
    public DateOnly? EndDate { get; set; }

    public string? CalendarStartEventId { get; set; }
    public string? CalendarEndEventId { get; set; }

    public int CreatedById { get; set; }
    public User CreatedBy { get; set; } = null!;
    public DateTime CreatedDate { get; set; }

    public bool IsDeleted { get; set; }
}
