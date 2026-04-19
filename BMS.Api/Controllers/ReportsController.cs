namespace BMS.Api.Controllers;

using BMS.Api.Middleware;
using BMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly ReportService _reportService;

    public ReportsController(ReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("customers")]
    [RequirePermission("REPORT_VIEW")]
    public async Task<IActionResult> GetCustomerReport(
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] int? type)
    {
        var data = await _reportService.GetCustomerReportAsync(from, to, type);
        return Ok(data);
    }

    [HttpGet("export/excel")]
    [RequirePermission("REPORT_VIEW")]
    public async Task<IActionResult> ExportExcel(
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] int? type)
    {
        var bytes = await _reportService.ExportCustomersToExcelAsync(from, to, type);
        return File(bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"bms-report-{DateTime.Now:yyyyMMdd-HHmmss}.xlsx");
    }

    [HttpGet("export/ledger")]
    [RequirePermission("REPORT_VIEW")]
    public async Task<IActionResult> ExportLedger([FromQuery] DateOnly? from, [FromQuery] DateOnly? to)
    {
        var bytes = await _reportService.ExportRevenueExpenseLedgerAsync(from, to);
        return File(bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"bms-payment-ledger-{DateTime.Now:yyyyMMdd-HHmmss}.xlsx");
    }
}
