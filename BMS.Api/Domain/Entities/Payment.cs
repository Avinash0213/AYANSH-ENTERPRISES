namespace BMS.Api.Domain.Entities;

public class Payment
{
    public int Id { get; set; }
    public int? CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public string? SataraVisitCode { get; set; }
    public decimal ReceivedAmount { get; set; }
    public decimal GovernmentCharges { get; set; }
    public decimal EmployeeCommission { get; set; }
    public decimal Profit { get; set; }
    public DateOnly PaymentDate { get; set; }
    public int CreatedById { get; set; }
    public User CreatedBy { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public string? Comment { get; set; }
    public string? CollectorName { get; set; }
}
