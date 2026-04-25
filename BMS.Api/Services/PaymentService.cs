namespace BMS.Api.Services;

using BMS.Api.Data;
using BMS.Api.Domain.Entities;
using BMS.Api.DTOs;
using Microsoft.EntityFrameworkCore;

public class PaymentService
{
    private readonly AppDbContext _db;
 
    public PaymentService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<PaymentResponse> CreateAsync(CreatePaymentRequest req, int userId)
    {
        var profit = req.ReceivedAmount - req.GovernmentCharges - req.EmployeeCommission;

        var payment = new Payment
        {
            CustomerId = req.CustomerId,
            SataraVisitCode = req.SataraVisitCode,
            ReceivedAmount = req.ReceivedAmount,
            GovernmentCharges = req.GovernmentCharges,
            EmployeeCommission = req.EmployeeCommission,
            Profit = profit,
            PaymentDate = req.PaymentDate,
            Comment = req.Comment,
            CollectorName = req.CollectorName,
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow
        };

        await _db.Payments.AddAsync(payment);
        await _db.SaveChangesAsync();

        // Load navigation properties
        await _db.Entry(payment).Reference(p => p.Customer).LoadAsync();
        await _db.Entry(payment).Reference(p => p.CreatedBy).LoadAsync();

        return MapToResponse(payment);
    }

    public async Task<PagedResponse<PaymentResponse>> GetAllPagedAsync(DateOnly? from = null, DateOnly? to = null, int page = 1, int pageSize = 10, string? source = null, string? search = null)
    {
        var query = _db.Payments
            .AsNoTracking()
            .Include(p => p.Customer)
            .Include(p => p.CreatedBy)
            .AsQueryable();

        if (from.HasValue)
            query = query.Where(p => p.PaymentDate >= from.Value);
        if (to.HasValue)
            query = query.Where(p => p.PaymentDate <= to.Value);

        if (source == "customer")
            query = query.Where(p => p.CustomerId != null);
        else if (source == "visit")
            query = query.Where(p => p.SataraVisitCode != null);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(p => 
                (p.Customer != null && p.Customer.OwnerName.ToLower().Contains(s)) ||
                (p.Customer != null && p.Customer.SerialNumber.ToLower().Contains(s)) ||
                (p.SataraVisitCode != null && p.SataraVisitCode.ToLower().Contains(s)) ||
                (p.CollectorName != null && p.CollectorName.ToLower().Contains(s))
            );
        }

        var totalCount = await query.CountAsync();
        
        var payments = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResponse<PaymentResponse>
        {
            Items = payments.Select(MapToResponse).ToList(),
            TotalCount = totalCount,
            PageNumber = page,
            PageSize = pageSize
        };
    }

    public async Task<List<PaymentResponse>> GetAllAsync(DateOnly? from = null, DateOnly? to = null, string? source = null)
    {
        // Keep for internal use if needed, but optimized
        var query = _db.Payments
            .AsNoTracking()
            .Include(p => p.Customer)
            .Include(p => p.CreatedBy)
            .AsQueryable();

        if (from.HasValue)
            query = query.Where(p => p.PaymentDate >= from.Value);
        if (to.HasValue)
            query = query.Where(p => p.PaymentDate <= to.Value);

        if (source == "customer")
            query = query.Where(p => p.CustomerId != null);
        else if (source == "visit")
            query = query.Where(p => p.SataraVisitCode != null);

        var payments = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();

        return payments.Select(MapToResponse).ToList();
    }

    public async Task<PaymentResponse?> UpdateAsync(int id, UpdatePaymentRequest req)
    {
        var payment = await _db.Payments
            .Include(p => p.Customer)
            .Include(p => p.CreatedBy)
            .FirstOrDefaultAsync(p => p.Id == id);
            
        if (payment == null) return null;

        payment.ReceivedAmount = req.ReceivedAmount;
        payment.GovernmentCharges = req.GovernmentCharges;
        payment.EmployeeCommission = req.EmployeeCommission;
        payment.Profit = req.ReceivedAmount - req.GovernmentCharges - req.EmployeeCommission;
        payment.PaymentDate = req.PaymentDate;
        payment.Comment = req.Comment;
        payment.CollectorName = req.CollectorName;

        await _db.SaveChangesAsync();
        return MapToResponse(payment);
    }

    public async Task<List<PaymentResponse>> GetByCustomerAsync(int customerId)
    {
        var payments = await _db.Payments
            .AsNoTracking()
            .Where(p => p.CustomerId == customerId)
            .Include(p => p.Customer)
            .Include(p => p.CreatedBy)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return payments.Select(MapToResponse).ToList();
    }

    public async Task<List<PaymentResponse>> GetByVisitCodeAsync(string visitCode)
    {
        var payments = await _db.Payments
            .AsNoTracking()
            .Where(p => p.SataraVisitCode == visitCode)
            .Include(p => p.CreatedBy)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return payments.Select(MapToResponse).ToList();
    }

    public async Task<PaymentSummary> GetSummaryAsync(DateOnly? from, DateOnly? to, string? source = null, string? search = null)
    {
        var query = _db.Payments.AsQueryable();

        if (from.HasValue)
            query = query.Where(p => p.PaymentDate >= from.Value);
        if (to.HasValue)
            query = query.Where(p => p.PaymentDate <= to.Value);

        if (source == "customer")
            query = query.Where(p => p.CustomerId != null);
        else if (source == "visit")
            query = query.Where(p => p.SataraVisitCode != null);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(p => 
                (p.Customer != null && p.Customer.OwnerName.ToLower().Contains(s)) ||
                (p.Customer != null && p.Customer.SerialNumber.ToLower().Contains(s)) ||
                (p.SataraVisitCode != null && p.SataraVisitCode.ToLower().Contains(s)) ||
                (p.CollectorName != null && p.CollectorName.ToLower().Contains(s))
            );
        }

        var stats = await query
            .AsNoTracking()
            .GroupBy(p => 1)
            .Select(g => new
            {
                TotalReceived = g.Sum(p => p.ReceivedAmount),
                TotalGov = g.Sum(p => p.GovernmentCharges),
                TotalComm = g.Sum(p => p.EmployeeCommission),
                TotalProfit = g.Sum(p => p.Profit),
                Count = g.Count()
            })
            .FirstOrDefaultAsync();

        if (stats == null) return new PaymentSummary();

        return new PaymentSummary
        {
            TotalReceived = stats.TotalReceived,
            TotalGovernmentCharges = stats.TotalGov,
            TotalCommission = stats.TotalComm,
            TotalProfit = stats.TotalProfit,
            TotalPayments = stats.Count
        };
    }

    private static PaymentResponse MapToResponse(Payment p) => new()
    {
        Id = p.Id,
        CustomerId = p.CustomerId,
        SataraVisitCode = p.SataraVisitCode,
        CustomerSerial = p.Customer?.SerialNumber,
        CustomerOwner = p.Customer?.OwnerName,
        ReceivedAmount = p.ReceivedAmount,
        GovernmentCharges = p.GovernmentCharges,
        EmployeeCommission = p.EmployeeCommission,
        Profit = p.Profit,
        PaymentDate = p.PaymentDate,
        Comment = p.Comment,
        CollectorName = p.CollectorName,
        CreatedByName = p.CreatedBy?.Name,
        CreatedAt = p.CreatedAt
    };
}
