namespace BMS.Api.Controllers;

using BMS.Api.DTOs;
using BMS.Api.Middleware;
using BMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly PaymentService _paymentService;

    public PaymentsController(PaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [HttpGet]
    [RequirePermission("PAYMENT_VIEW")]
    public async Task<IActionResult> GetAll([FromQuery] DateOnly? from, [FromQuery] DateOnly? to)
    {
        var payments = await _paymentService.GetAllAsync(from, to);
        return Ok(payments);
    }

    [HttpGet("customer/{customerId}")]
    [RequirePermission("PAYMENT_VIEW")]
    public async Task<IActionResult> GetByCustomer(int customerId)
    {
        var payments = await _paymentService.GetByCustomerAsync(customerId);
        return Ok(payments);
    }

    [HttpGet("visit/{visitCode}")]
    [RequirePermission("PAYMENT_VIEW")]
    public async Task<IActionResult> GetByVisitCode(string visitCode)
    {
        var payments = await _paymentService.GetByVisitCodeAsync(visitCode);
        return Ok(payments);
    }

    [HttpGet("summary")]
    [RequirePermission("PAYMENT_VIEW")]
    public async Task<IActionResult> GetSummary([FromQuery] DateOnly? from, [FromQuery] DateOnly? to)
    {
        var summary = await _paymentService.GetSummaryAsync(from, to);
        return Ok(summary);
    }

    [HttpPost]
    [RequirePermission("PAYMENT_VIEW")]
    public async Task<IActionResult> Create([FromBody] CreatePaymentRequest req)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "1");
        var payment = await _paymentService.CreateAsync(req, userId);
        return CreatedAtAction(nameof(GetAll), new { id = payment.Id }, payment);
    }

    [HttpPut("{id}")]
    [RequirePermission("PAYMENT_VIEW")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePaymentRequest req)
    {
        var result = await _paymentService.UpdateAsync(id, req);
        if (result == null) return NotFound();
        return Ok(result);
    }
}
