namespace BMS.Api.Services;

using BMS.Api.Data;
using BMS.Api.Domain.Entities;
using BMS.Api.Domain.Enums;
using BMS.Api.Services.Interfaces;
using Microsoft.Extensions.Logging;

public class NotificationService
{
    private readonly AppDbContext _db;
    private readonly IEmailService _emailService;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(AppDbContext db, IEmailService emailService, ILogger<NotificationService> logger)
    {
        _db = db;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task SendEmailAsync(Customer customer, string subject, string body)
    {
        // 1. Check cooldown (dont send if sent in last 24h)
        var lastSent = _db.NotificationLogs
            .Where(n => n.CustomerId == customer.Id && n.Type == "Email")
            .OrderByDescending(n => n.SentAt)
            .FirstOrDefault();
            
        if (lastSent != null && (DateTime.UtcNow - lastSent.SentAt).TotalHours < 24)
        {
            _logger.LogInformation($"Skipped sending email to {customer.SerialNumber} (Cooldown active)");
            return;
        }

        // 2. Send Emails
        bool ownerSent = false;
        bool tenantSent = false;

        if (!string.IsNullOrEmpty(customer.OwnerEmail))
        {
            ownerSent = await _emailService.SendEmailAsync(customer.OwnerEmail, subject, body);
        }

        if (!string.IsNullOrEmpty(customer.TenantEmail))
        {
            tenantSent = await _emailService.SendEmailAsync(customer.TenantEmail, subject, body);
        }

        if (!ownerSent && !tenantSent)
        {
            _logger.LogWarning($"Failed to send emails for {customer.SerialNumber} (No valid emails or service error)");
            return;
        }
        
        // 3. Log it
        _db.NotificationLogs.Add(new NotificationLog {
            CustomerId = customer.Id,
            Type = "Email",
            Recipient = $"{(ownerSent ? "Owner" : "")} {(tenantSent ? "& Tenant" : "")}".Trim(),
            Status = NotificationStatus.Sent,
            SentAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
    }
}
