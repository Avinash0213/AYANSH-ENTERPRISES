namespace BMS.Api.DTOs;

using BMS.Api.Domain.Enums;

public class CreateCustomerRequest
{
    public string OwnerName { get; set; } = null!;
    public string? OwnerPhone { get; set; }
    public string? OwnerEmail { get; set; }
    public string TenantName { get; set; } = null!;
    public string? TenantPhone { get; set; }
    public string? TenantEmail { get; set; }
    public string? TokenNumber { get; set; }
    public string? InquiryFrom { get; set; }
    public string? Comment { get; set; }
    public string? Address { get; set; }
    public CustomerType Type { get; set; }
    public CustomerStatus Status { get; set; }
    public DateOnly? StartDate { get; set; }
    public int? Period { get; set; }
    public decimal Rent { get; set; }
    public decimal Deposit { get; set; }
    public decimal QuotedAmount { get; set; }

}

public class UpdateCustomerRequest
{
    public string OwnerName { get; set; } = null!;
    public string? OwnerPhone { get; set; }
    public string? OwnerEmail { get; set; }
    public string TenantName { get; set; } = null!;
    public string? TenantPhone { get; set; }
    public string? TenantEmail { get; set; }
    public string? TokenNumber { get; set; }
    public string? InquiryFrom { get; set; }
    public string? Comment { get; set; }
    public string? Address { get; set; }
    public CustomerType Type { get; set; }
    public CustomerStatus Status { get; set; }
    public DateOnly? StartDate { get; set; }
    public int? Period { get; set; }
    public decimal Rent { get; set; }
    public decimal Deposit { get; set; }
    public decimal QuotedAmount { get; set; }

}

public class CustomerResponse
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
    public string? InquiryFrom { get; set; }
    public string? Comment { get; set; }
    public string? Address { get; set; }
    public int Type { get; set; }
    public string TypeName { get; set; } = null!;
    public int Status { get; set; }
    public string StatusName { get; set; } = null!;
    public DateOnly? StartDate { get; set; }
    public int? Period { get; set; }
    public decimal Rent { get; set; }
    public decimal Deposit { get; set; }
    public decimal QuotedAmount { get; set; }
    public decimal RemainingAmount { get; set; }

    public DateOnly? EndDate { get; set; }
    public DateTime CreatedDate { get; set; }
    public string? CreatedByName { get; set; }
}
