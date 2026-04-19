namespace BMS.Api.Services;

using BMS.Api.Domain.Entities;
using Microsoft.Extensions.Logging;

public class CalendarService
{
    private readonly ILogger<CalendarService> _logger;

    public CalendarService(ILogger<CalendarService> logger)
    {
        _logger = logger;
    }

    public Task<(string StartEventId, string EndEventId)> CreateAgreementEventsAsync(Customer customer)
    {
        _logger.LogInformation($"[GOOGLE CALENDAR MOCK]: Created start/end events for {customer.SerialNumber}");
        return Task.FromResult(($"evt_start_{Guid.NewGuid().ToString()[..8]}", $"evt_end_{Guid.NewGuid().ToString()[..8]}"));
    }
}
