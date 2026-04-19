namespace BMS.Api.DTOs;

public class CreateSataraVisitRequest
{
    public string PersonName { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public DateTime ScheduledTime { get; set; }
    public string? TaskType { get; set; }
    public string? TokenNumber { get; set; }
    public string? Password { get; set; }
    public string? Remarks { get; set; }
}

public class UpdateSataraVisitRequest
{
    public string PersonName { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public DateTime ScheduledTime { get; set; }
    public string? TaskType { get; set; }
    public string? TokenNumber { get; set; }
    public string? Password { get; set; }
    public string? Remarks { get; set; }
    public string Status { get; set; } = "Pending";
}

public class SataraVisitResponse
{
    public int Id { get; set; }
    public string VisitCode { get; set; } = null!;
    public string PersonName { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public DateTime ScheduledTime { get; set; }
    public string? TaskType { get; set; }
    public string? TokenNumber { get; set; }
    public string? Password { get; set; }
    public string? Remarks { get; set; }
    public string Status { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public int CreatedById { get; set; }
    public string? CreatedByName { get; set; }
}
