namespace BMS.Api.Controllers;

using BMS.Api.DTOs;
using BMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;

using BMS.Api.Middleware;

[ApiController]
[Route("api/satara-visits")]
[Authorize]
[RequirePermission("SATARA_VIEW")]
public class SataraVisitsController : ControllerBase
{
    private readonly SataraVisitService _sataraVisitService;

    public SataraVisitsController(SataraVisitService sataraVisitService)
    {
        _sataraVisitService = sataraVisitService;
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateSataraVisitRequest req)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var visit = await _sataraVisitService.CreateAsync(req, userId);
        return Ok(visit);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var visits = await _sataraVisitService.GetAllAsync();
        return Ok(visits);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var visit = await _sataraVisitService.GetByIdAsync(id);
        if (visit == null) return NotFound();
        return Ok(visit);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateSataraVisitRequest req)
    {
        var visit = await _sataraVisitService.UpdateAsync(id, req);
        if (visit == null) return NotFound();
        return Ok(visit);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _sataraVisitService.DeleteAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }
}
