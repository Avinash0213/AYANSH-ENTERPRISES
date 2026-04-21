namespace BMS.Api.Controllers;

using BMS.Api.Services;
using BMS.Api.Data;
using BMS.Api.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly NotificationService _notificationService;
    private readonly AppDbContext _db;

    public NotificationsController(NotificationService notificationService, AppDbContext db)
    {
        _notificationService = notificationService;
        _db = db;
    }

    [HttpPost("email/{customerId}")]
    public async Task<IActionResult> SendEmail(int customerId, [FromBody] EmailRequest request)
    {
        var customer = await _db.Customers.FindAsync(customerId);
        if (customer == null) return NotFound();

        await _notificationService.SendEmailAsync(customer, request.Subject, request.Body, request.TargetEmail);
        return Ok(new { message = "Email sent successfully" });
    }

    [HttpPost("sms/{customerId}")]
    public async Task<IActionResult> SendSms(int customerId, [FromBody] SmsRequest request)
    {
        var customer = await _db.Customers.FindAsync(customerId);
        if (customer == null) return NotFound();

        await _notificationService.SendSmsAsync(customer, request.Message, request.TargetPhone);
        return Ok(new { message = "SMS sent successfully" });
    }

    [HttpPost("renewal/{customerId}")]
    public async Task<IActionResult> SendRenewal(int customerId, [FromBody] RenewalNotificationRequest request)
    {
        var customer = await _db.Customers.FindAsync(customerId);
        if (customer == null) return NotFound();

        await _notificationService.SendRenewalNotificationAsync(customer, request.TargetEmail, request.TargetPhone);
        return Ok(new { message = "Renewal notification sent successfully" });
    }
}

public class RenewalNotificationRequest
{
    public string? TargetEmail { get; set; }
    public string? TargetPhone { get; set; }
}

public class EmailRequest
{
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? TargetEmail { get; set; }
}

public class SmsRequest
{
    public string Message { get; set; } = string.Empty;
    public string? TargetPhone { get; set; }
}
