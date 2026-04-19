namespace BMS.Api.Services;

using BMS.Api.Services.Interfaces;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

public class ResendEmailService : IEmailService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly ILogger<ResendEmailService> _logger;

    public ResendEmailService(HttpClient httpClient, IConfiguration config, ILogger<ResendEmailService> logger)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;
    }

    public async Task<bool> SendEmailAsync(string to, string subject, string body)
    {
        var apiKey = _config["Resend:ApiKey"];
        var fromEmail = _config["Resend:FromEmail"] ?? "onboarding@resend.dev";
        var fromName = _config["Resend:FromName"] ?? "Ayansh Enterprises";

        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogError("Resend ApiKey is missing in configuration.");
            return false;
        }

        try
        {
            var emailRequest = new
            {
                from = $"{fromName} <{fromEmail}>",
                to = new[] { to },
                subject = subject,
                html = body
            };

            var json = JsonSerializer.Serialize(emailRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            
            var response = await _httpClient.PostAsync("https://api.resend.com/emails", content);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation($"Email sent successfully via Resend to {to}");
                return true;
            }

            var error = await response.Content.ReadAsStringAsync();
            _logger.LogError($"Resend API error sending email to {to}. Status: {response.StatusCode}, Response: {error}");
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Exception occurred while sending email to {to} via Resend");
            return false;
        }
    }
}
