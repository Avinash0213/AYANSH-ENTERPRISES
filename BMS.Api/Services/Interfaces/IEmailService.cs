namespace BMS.Api.Services.Interfaces;

public interface IEmailService
{
    Task<(bool success, string? error)> SendEmailAsync(string to, string subject, string body);
}
