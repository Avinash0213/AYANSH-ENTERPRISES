namespace BMS.Api.DTOs;

public class CreatePaymentRequest
{
    public int? CustomerId { get; set; }
    public string? SataraVisitCode { get; set; }
    public decimal ReceivedAmount { get; set; }
    public decimal GovernmentCharges { get; set; }
    public decimal EmployeeCommission { get; set; }
    public DateOnly PaymentDate { get; set; }
    public string? Comment { get; set; }
    public string? CollectorName { get; set; }
}

public class PaymentResponse
{
    public int Id { get; set; }
    public int? CustomerId { get; set; }
    public string? SataraVisitCode { get; set; }
    public string? CustomerSerial { get; set; }
    public string? CustomerOwner { get; set; }
    public decimal ReceivedAmount { get; set; }
    public decimal GovernmentCharges { get; set; }
    public decimal EmployeeCommission { get; set; }
    public decimal Profit { get; set; }
    public DateOnly PaymentDate { get; set; }
    public string? CreatedByName { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? Comment { get; set; }
    public string? CollectorName { get; set; }
}

public class PaymentSummary
{
    public decimal TotalReceived { get; set; }
    public decimal TotalGovernmentCharges { get; set; }
    public decimal TotalCommission { get; set; }
    public decimal TotalProfit { get; set; }
    public int TotalPayments { get; set; }
}

public class UpdatePaymentRequest
{
    public decimal ReceivedAmount { get; set; }
    public decimal GovernmentCharges { get; set; }
    public decimal EmployeeCommission { get; set; }
    public DateOnly PaymentDate { get; set; }
    public string? Comment { get; set; }
    public string? CollectorName { get; set; }
}
