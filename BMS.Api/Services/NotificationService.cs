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
    private readonly ISmsService _smsService;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(AppDbContext db, IEmailService emailService, ISmsService smsService, ILogger<NotificationService> logger)
    {
        _db = db;
        _emailService = emailService;
        _smsService = smsService;
        _logger = logger;
    }

    public async Task SendEmailAsync(Customer customer, string subject, string body, string? targetEmail = null)
    {
        // 1. Check cooldown (dont send if sent in last 24h)
        var lastSent = _db.NotificationLogs
            .Where(n => n.CustomerId == customer.Id && n.Type == "Email")
            .OrderByDescending(n => n.SentAt)
            .FirstOrDefault();
            
        if (lastSent != null && (DateTime.UtcNow - lastSent.SentAt).TotalHours < 24)
        {
            _logger.LogInformation($"Skipped sending email to {customer.SerialNumber} (Cooldown active)");
            // return; // Keeping it commented for now as per user's testing phase, but added target check
        }

        // 2. Send Emails
        bool ownerSent = false;
        bool tenantSent = false;

        // If targetEmail is provided, send ONLY to that target
        if (!string.IsNullOrEmpty(targetEmail))
        {
            string personalizedName = targetEmail == customer.OwnerEmail ? customer.OwnerName ?? "Customer" : customer.TenantName ?? "Customer";
            string personalizedBody = FormatEmailBody(body.Replace("{{Name}}", personalizedName));
            await _emailService.SendEmailAsync(targetEmail, subject, personalizedBody);
            ownerSent = targetEmail == customer.OwnerEmail;
            tenantSent = targetEmail == customer.TenantEmail;
        }
        else
        {
            // Default behavior: Send to both if different
            if (!string.IsNullOrEmpty(customer.OwnerEmail))
            {
                string ownerName = customer.OwnerName ?? "Customer";
                string ownerBody = FormatEmailBody(body.Replace("{{Name}}", ownerName));
                ownerSent = await _emailService.SendEmailAsync(customer.OwnerEmail, subject, ownerBody);
            }

            if (!string.IsNullOrEmpty(customer.TenantEmail) && 
                !customer.TenantEmail.Trim().Equals(customer.OwnerEmail?.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                string tenantName = customer.TenantName ?? "Customer";
                string tenantBody = FormatEmailBody(body.Replace("{{Name}}", tenantName));
                tenantSent = await _emailService.SendEmailAsync(customer.TenantEmail, subject, tenantBody);
            }
        }

        if (!ownerSent && !tenantSent && string.IsNullOrEmpty(targetEmail))
        {
            _logger.LogWarning($"Failed to send emails for {customer.SerialNumber} (No valid emails or service error)");
            return;
        }
        
        // 3. Log it
        _db.NotificationLogs.Add(new NotificationLog {
            CustomerId = customer.Id,
            Type = "Email",
            Recipient = !string.IsNullOrEmpty(targetEmail) ? targetEmail : $"{(ownerSent ? "Owner" : "")} {(tenantSent ? "& Tenant" : "")}".Trim(),
            Status = NotificationStatus.Sent,
            SentAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
    }

    public async Task SendSmsAsync(Customer customer, string message, string? targetPhone = null)
    {
        // 1. Check cooldown (24h)
        var lastSent = _db.NotificationLogs
            .Where(n => n.CustomerId == customer.Id && n.Type == "SMS")
            .OrderByDescending(n => n.SentAt)
            .FirstOrDefault();
            
        if (lastSent != null && (DateTime.UtcNow - lastSent.SentAt).TotalHours < 24)
        {
            _logger.LogInformation($"Skipped sending SMS to {customer.SerialNumber} (Cooldown active)");
            // return; 
        }

        // 2. Send SMS
        bool ownerSent = false;
        bool tenantSent = false;

        if (!string.IsNullOrEmpty(targetPhone))
        {
            string personalizedMsg = message.Replace("{{Name}}", targetPhone == customer.OwnerPhone ? customer.OwnerName ?? "Customer" : customer.TenantName ?? "Customer");
            await _smsService.SendSmsAsync(targetPhone, personalizedMsg);
            ownerSent = targetPhone == customer.OwnerPhone;
            tenantSent = targetPhone == customer.TenantPhone;
        }
        else
        {
            if (!string.IsNullOrEmpty(customer.OwnerPhone))
            {
                string ownerMsg = message.Replace("{{Name}}", customer.OwnerName ?? "Customer");
                ownerSent = await _smsService.SendSmsAsync(customer.OwnerPhone, ownerMsg);
            }

            if (!string.IsNullOrEmpty(customer.TenantPhone) && 
                customer.TenantPhone.Trim() != customer.OwnerPhone?.Trim())
            {
                string tenantMsg = message.Replace("{{Name}}", customer.TenantName ?? "Customer");
                tenantSent = await _smsService.SendSmsAsync(customer.TenantPhone, tenantMsg);
            }
        }

        if (!ownerSent && !tenantSent && string.IsNullOrEmpty(targetPhone))
        {
            _logger.LogWarning($"Failed to send SMS for {customer.SerialNumber} (No valid phone numbers or service error)");
            return;
        }

        // 3. Log it
        _db.NotificationLogs.Add(new NotificationLog {
            CustomerId = customer.Id,
            Type = "SMS",
            Recipient = !string.IsNullOrEmpty(targetPhone) ? targetPhone : $"{(ownerSent ? "Owner" : "")} {(tenantSent ? "& Tenant" : "")}".Trim(),
            Status = NotificationStatus.Sent,
            SentAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
    }

    public async Task SendCompletionNotificationAsync(Customer customer)
    {
        string subject = "Your Property Agreement is Now Complete";
        string emailBody = @"Dear {{Name}},

We are pleased to inform you that your property agreement process has been successfully completed. 

For your convenience, all system-generated and finalized documents related to your agreement have been shared with you directly via WhatsApp/Email. Please check your messages to access them.

If you have any questions or require any further assistance, please feel free to reach out to us. 

Warm regards,

The Ayansh Enterprises Team

---
Office Address:
Ayansh Enterprises
Samarth Complex, Shop No. 2,
Vidhate Wasti Road,
Aundh-Baner, Pune 411045

Contact: 7030993233 / 8806688500";

        await SendEmailAsync(customer, subject, emailBody);

        string smsMessage = "Your property agreement process is now successfully completed. All finalized documents have been shared with you via WhatsApp/Email.\n\nAyansh Enterprises\nSamarth Complex, Shop No 2, Vidhate Wasti Road, Aundh-Baner Pune 411045\n7030993233 / 8806688500";
        await SendSmsAsync(customer, smsMessage);
    }

    public async Task SendRenewalNotificationAsync(Customer customer, string? targetEmail = null, string? targetPhone = null)
    {
        string subject = "Upcoming Renewal of Your Rental Agreement";
        string endDateStr = customer.EndDate?.ToString("dd/MM/yyyy") ?? "[Date]";
        
        string emailBody = $@"Dear {{{{Name}}}},

We hope this email finds you well.

This is a friendly reminder that your rental agreement is scheduled for renewal on {endDateStr}. To ensure there is no interruption in your agreement status and to maintain continued service, we kindly request you to initiate the renewal process soon.

Please get in touch with the Ayansh Enterprises team at your earliest convenience to discuss the next steps and complete the necessary formalities.

Thank you for your cooperation and your continued trust in us.

Warm regards,

The Ayansh Enterprises Team

---
Office Address:
Ayansh Enterprises
Samarth Complex, Shop No. 2,
Vidhate Wasti Road,
Aundh-Baner, Pune 411045

Contact: 7030993233 / 8806688500";

        string smsMessage = $"Your rental agreement is due for renewal on {endDateStr}. Please contact Ayansh Enterprises at your earliest convenience to initiate the process.\n\nAyansh Enterprises\nSamarth Complex, Shop No 2, Vidhate Wasti Road, Aundh-Baner Pune 411045\n7030993233 / 8806688500";

        // If both are null, it's a "Notify All" request
        if (string.IsNullOrEmpty(targetEmail) && string.IsNullOrEmpty(targetPhone))
        {
            await SendEmailAsync(customer, subject, emailBody);
            await SendSmsAsync(customer, smsMessage);
        }
        else
        {
            // Targeted send: only send the medium if a target was provided
            if (!string.IsNullOrEmpty(targetEmail))
            {
                await SendEmailAsync(customer, subject, emailBody, targetEmail);
            }
            
            if (!string.IsNullOrEmpty(targetPhone))
            {
                await SendSmsAsync(customer, smsMessage, targetPhone);
            }
        }
    }

    private string FormatEmailBody(string body)
    {
        // Replace newlines with <br/> for HTML support
        string formattedBody = body.Replace("\r\n", "<br/>").Replace("\n", "<br/>");
        
        return $@"
        <div style=""font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;"">
            <div style=""text-align: center; margin-bottom: 20px;"">
                <h2 style=""color: #d32f2f; margin: 0;"">Ayansh Enterprises</h2>
                <hr style=""border: 0; border-top: 1px solid #eee; margin: 20px 0;"" />
            </div>
            <div style=""padding: 10px 0;"">
                {formattedBody}
            </div>
            <div style=""margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 0.85em; color: #555; text-align: center;"">
                <p style=""margin: 0 0 6px 0; font-weight: 600; color: #d32f2f;"">Ayansh Enterprises</p>
                <p style=""margin: 0 0 4px 0;"">Samarth Complex, Shop No. 2, Vidhate Wasti Road,<br/>Aundh-Baner, Pune 411045</p>
                <p style=""margin: 0 0 12px 0;"">&#128222; 7030993233 / 8806688500</p>
                <hr style=""border: 0; border-top: 1px solid #eee; margin: 10px 0;"" />
                <p style=""font-size: 0.8em; color: #999; margin: 0;"">This is an automated message from the Business Management System.<br/>
                Please do not reply directly to this email.</p>
            </div>
        </div>";
    }
}
