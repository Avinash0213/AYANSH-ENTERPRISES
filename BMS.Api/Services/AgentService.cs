using BMS.Api.Data;
using BMS.Api.Domain.Entities;
using BMS.Api.DTOs;
using Microsoft.EntityFrameworkCore;

namespace BMS.Api.Services;

public interface IAgentService
{
    Task<IEnumerable<AgentDto>> GetAllAsync();
    Task<AgentDto?> GetByIdAsync(int id);
    Task<AgentDto> CreateAsync(CreateAgentRequest request);
    Task<bool> UpdateAsync(int id, UpdateAgentRequest request);
    Task<bool> DeleteAsync(int id);
}

public class AgentService : IAgentService
{
    private readonly AppDbContext _context;

    public AgentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<AgentDto>> GetAllAsync()
    {
        return await _context.Agents
            .Select(a => new AgentDto(a.Id, a.Name, a.Phone, a.Email, a.IsActive))
            .ToListAsync();
    }

    public async Task<AgentDto?> GetByIdAsync(int id)
    {
        var agent = await _context.Agents.FindAsync(id);
        if (agent == null) return null;

        return new AgentDto(agent.Id, agent.Name, agent.Phone, agent.Email, agent.IsActive);
    }

    public async Task<AgentDto> CreateAsync(CreateAgentRequest request)
    {
        var agent = new Agent
        {
            Name = request.Name,
            Phone = request.Phone,
            Email = request.Email,
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        };

        _context.Agents.Add(agent);
        await _context.SaveChangesAsync();

        return new AgentDto(agent.Id, agent.Name, agent.Phone, agent.Email, agent.IsActive);
    }

    public async Task<bool> UpdateAsync(int id, UpdateAgentRequest request)
    {
        var agent = await _context.Agents.FindAsync(id);
        if (agent == null) return false;

        agent.Name = request.Name;
        agent.Phone = request.Phone;
        agent.Email = request.Email;
        agent.IsActive = request.IsActive;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var agent = await _context.Agents.FindAsync(id);
        if (agent == null) return false;

        agent.IsActive = false;
        await _context.SaveChangesAsync();
        return true;
    }
}
