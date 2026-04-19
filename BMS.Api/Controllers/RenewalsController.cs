namespace BMS.Api.Controllers;

using BMS.Api.Services;
using BMS.Api.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RenewalsController : ControllerBase
{
    private readonly RenewalService _renewalService;

    public RenewalsController(RenewalService renewalService)
    {
        _renewalService = renewalService;
    }

    [HttpGet]
    [RequirePermission("RENEWAL_VIEW")]
    public async Task<IActionResult> GetDue()
    {
        var renewals = await _renewalService.GetDueRenewalsAsync();
        return Ok(renewals);
    }
}
