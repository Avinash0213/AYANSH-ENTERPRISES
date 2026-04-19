namespace BMS.Api.Services;

using BMS.Api.Data;
using Microsoft.EntityFrameworkCore;

public class SerialNumberService
{
    private readonly AppDbContext _db;
    private static readonly SemaphoreSlim _lock = new(1, 1);

    public SerialNumberService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<string> GenerateNextAsync()
    {
        await _lock.WaitAsync();
        try
        {
            // Simple sequence generation approach (scalable for startup scale)
            var lastSerial = await _db.Customers
                .IgnoreQueryFilters()
                .OrderByDescending(c => c.Id)
                .Select(c => c.SerialNumber)
                .FirstOrDefaultAsync();

            int next = 1;
            if (lastSerial != null && lastSerial.StartsWith("AE"))
            {
                if (int.TryParse(lastSerial.Substring(2), out int parsed))
                {
                    next = parsed + 1;
                }
            }

            return $"AE{next:D5}"; // Generates AE00001 to AE99999
        }
        finally
        {
            _lock.Release();
        }
    }
    public async Task<string> GenerateNextSataraAsync()
    {
        await _lock.WaitAsync();
        try
        {
            var lastSerial = await _db.Set<Domain.Entities.SataraVisit>()
                .OrderByDescending(c => c.Id)
                .Select(c => c.VisitCode)
                .FirstOrDefaultAsync();

            int next = 1;
            if (lastSerial != null && lastSerial.StartsWith("SAT"))
            {
                if (int.TryParse(lastSerial.Substring(3), out int parsed))
                {
                    next = parsed + 1;
                }
            }

            return $"SAT{next:D5}"; // Generates SAT00001 to SAT99999
        }
        finally
        {
            _lock.Release();
        }
    }
}
