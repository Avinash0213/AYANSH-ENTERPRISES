using BMS.Api.DTOs;
using BMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BMS.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AgentsController : ControllerBase
{
    private readonly IAgentService _agentService;

    public AgentsController(IAgentService agentService)
    {
        _agentService = agentService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AgentDto>>> GetAll()
    {
        var agents = await _agentService.GetAllAsync();
        return Ok(agents);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AgentDto>> GetById(int id)
    {
        var agent = await _agentService.GetByIdAsync(id);
        if (agent == null) return NotFound();
        return Ok(agent);
    }

    [HttpPost]
    public async Task<ActionResult<AgentDto>> Create(CreateAgentRequest request)
    {
        var agent = await _agentService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = agent.Id }, agent);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateAgentRequest request)
    {
        var success = await _agentService.UpdateAsync(id, request);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _agentService.DeleteAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}
