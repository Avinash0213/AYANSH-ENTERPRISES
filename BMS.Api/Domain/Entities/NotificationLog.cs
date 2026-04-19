namespace BMS.Api.Domain.Entities;
using BMS.Api.Domain.Enums;

public class NotificationLog
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;
    public string Type { get; set; } = null!; // "Email", "WhatsApp"
    public string Recipient { get; set; } = null!; // "Owner", "Tenant"
    public NotificationStatus Status { get; set; }
    public DateTime SentAt { get; set; }
    public string? ErrorMessage { get; set; }
}
