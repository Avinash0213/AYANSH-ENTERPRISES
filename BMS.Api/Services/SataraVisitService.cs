namespace BMS.Api.Services;

using BMS.Api.Data;
using BMS.Api.Domain.Entities;
using BMS.Api.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;

public class SataraVisitService
{
    private readonly AppDbContext _db;
    private readonly SerialNumberService _serialNumberService;

    public SataraVisitService(AppDbContext db, SerialNumberService serialNumberService)
    {
        _db = db;
        _serialNumberService = serialNumberService;
    }

    public async Task<SataraVisitResponse> CreateAsync(CreateSataraVisitRequest req, int userId)
    {
        var visitCode = await _serialNumberService.GenerateNextSataraAsync();

        var visit = new SataraVisit
        {
            VisitCode = visitCode,
            PersonName = req.PersonName,
            PhoneNumber = req.PhoneNumber,
            Address = req.Address,
            ScheduledTime = req.ScheduledTime,
            TaskType = req.TaskType,
            TokenNumber = req.TokenNumber,
            Password = req.Password,
            Remarks = req.Remarks,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow,
            CreatedById = userId
        };

        await _db.SataraVisits.AddAsync(visit);
        await _db.SaveChangesAsync();

        await _db.Entry(visit).Reference(v => v.CreatedBy).LoadAsync();
        return MapToResponse(visit);
    }

    public async Task<List<SataraVisitResponse>> GetAllAsync()
    {
        var visits = await _db.SataraVisits
            .Include(v => v.CreatedBy)
            .OrderByDescending(v => v.ScheduledTime)
            .ToListAsync();

        return visits.Select(MapToResponse).ToList();
    }

    public async Task<SataraVisitResponse?> GetByIdAsync(int id)
    {
        var visit = await _db.SataraVisits
            .Include(v => v.CreatedBy)
            .FirstOrDefaultAsync(v => v.Id == id);

        return visit != null ? MapToResponse(visit) : null;
    }

    public async Task<SataraVisitResponse?> UpdateAsync(int id, UpdateSataraVisitRequest req)
    {
        var visit = await _db.SataraVisits
            .Include(v => v.CreatedBy)
            .FirstOrDefaultAsync(v => v.Id == id);
            
        if (visit == null) return null;

        visit.PersonName = req.PersonName;
        visit.PhoneNumber = req.PhoneNumber;
        visit.Address = req.Address;
        visit.ScheduledTime = req.ScheduledTime;
        visit.TaskType = req.TaskType;
        visit.TokenNumber = req.TokenNumber;
        visit.Password = req.Password;
        visit.Remarks = req.Remarks;
        visit.Status = req.Status;

        await _db.SaveChangesAsync();
        return MapToResponse(visit);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var visit = await _db.SataraVisits.FindAsync(id);
        if (visit == null) return false;

        _db.SataraVisits.Remove(visit);
        await _db.SaveChangesAsync();
        return true;
    }

    private static SataraVisitResponse MapToResponse(SataraVisit v) => new()
    {
        Id = v.Id,
        VisitCode = v.VisitCode,
        PersonName = v.PersonName,
        PhoneNumber = v.PhoneNumber,
        Address = v.Address,
        ScheduledTime = v.ScheduledTime,
        TaskType = v.TaskType,
        TokenNumber = v.TokenNumber,
        Password = v.Password,
        Remarks = v.Remarks,
        Status = v.Status,
        CreatedAt = v.CreatedAt,
        CreatedById = v.CreatedById,
        CreatedByName = v.CreatedBy?.Name
    };
}
