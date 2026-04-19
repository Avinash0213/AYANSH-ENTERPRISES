namespace BMS.Api.Services;

using BMS.Api.Data;
using BMS.Api.Domain.Entities;

public class CustomerService
{
    private readonly AppDbContext _db;
    private readonly SerialNumberService _serialService;
    private readonly CalendarService _calendar;
    private readonly NotificationService _notifier;

    public CustomerService(AppDbContext db, SerialNumberService serialService, CalendarService calendar, NotificationService notifier)
    {
        _db = db;
        _serialService = serialService;
        _calendar = calendar;
        _notifier = notifier;
    }

    public async Task<Customer> CreateAsync(Customer req, int createdById)
    {
        req.SerialNumber = await _serialService.GenerateNextAsync();
        
        if (req.Period.HasValue && req.StartDate.HasValue)
        {
            req.EndDate = req.StartDate.Value.AddMonths(req.Period.Value);
        }
        else
        {
            req.EndDate = null;
        }
        req.CreatedById = createdById;
        req.CreatedDate = DateTime.UtcNow;

        // One-way Calendar Sync
        var (startId, endId) = await _calendar.CreateAgreementEventsAsync(req);
        req.CalendarStartEventId = startId;
        req.CalendarEndEventId = endId;

        await _db.Customers.AddAsync(req);
        await _db.SaveChangesAsync();

        // Welcome Notification Mock
        await _notifier.SendEmailAsync(req, "Agreement Started", "Your new rental agreement has been initiated.");

        await _db.Entry(req).Reference(c => c.CreatedBy).LoadAsync();

        return req;
    }
}
