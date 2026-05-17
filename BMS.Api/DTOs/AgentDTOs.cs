namespace BMS.Api.DTOs;

public record AgentDto(
    int Id,
    string Name,
    string? Phone,
    string? Email,
    bool IsActive
);

public record CreateAgentRequest(
    string Name,
    string? Phone,
    string? Email
);

public record UpdateAgentRequest(
    string Name,
    string? Phone,
    string? Email,
    bool IsActive
);
