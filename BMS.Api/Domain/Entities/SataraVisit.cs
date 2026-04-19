namespace BMS.Api.Domain.Entities;

public class SataraVisit
{
    public int Id { get; set; }
    public string VisitCode { get; set; } = null!; // e.g. SAT00001
    public string PersonName { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public DateTime ScheduledTime { get; set; }
    public string? TaskType { get; set; }
    public string? TokenNumber { get; set; }
    public string? Password { get; set; }
    public string? Remarks { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Completed, Cancelled
    public DateTime CreatedAt { get; set; }
    public int CreatedById { get; set; }
    public User CreatedBy { get; set; } = null!;
}
