namespace BMS.Api.Controllers;

using BMS.Api.Data;
using BMS.Api.Domain.Entities;
using BMS.Api.Domain.Enums;
using BMS.Api.DTOs;
using BMS.Api.Middleware;
using BMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly CustomerService _customerService;

    public CustomersController(AppDbContext db, CustomerService customerService)
    {
        _db = db;
        _customerService = customerService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] int? type, [FromQuery] int? status, [FromQuery] string? dateFilter)
    {
        var query = _db.Customers
            .Include(c => c.CreatedBy)
            .Where(c => !c.IsDeleted)
            .AsQueryable();

        if (type.HasValue)
        {
            query = query.Where(c => c.Type == (CustomerType)type.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(c => c.Status == (CustomerStatus)status.Value);
        }

        if (!string.IsNullOrEmpty(dateFilter))
        {
            var now = DateTime.UtcNow;
            if (dateFilter == "day")
            {
                var startOfDay = now.Date;
                query = query.Where(c => c.CreatedDate >= startOfDay);
            }
            else if (dateFilter == "week")
            {
                var lastWeek = now.AddDays(-7);
                query = query.Where(c => c.CreatedDate >= lastWeek);
            }
            else if (dateFilter == "month")
            {
                var lastMonth = now.AddDays(-30);
                query = query.Where(c => c.CreatedDate >= lastMonth);
            }
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(c => 
                (c.SerialNumber != null && c.SerialNumber.ToLower().Contains(s)) ||
                (c.OwnerName != null && c.OwnerName.ToLower().Contains(s)) ||
                (c.OwnerPhone != null && c.OwnerPhone.ToLower().Contains(s)) ||
                (c.OwnerEmail != null && c.OwnerEmail.ToLower().Contains(s)) ||
                (c.TenantName != null && c.TenantName.ToLower().Contains(s)) ||
                (c.TenantPhone != null && c.TenantPhone.ToLower().Contains(s)) ||
                (c.TenantEmail != null && c.TenantEmail.ToLower().Contains(s)) ||
                (c.TokenNumber != null && c.TokenNumber.ToLower().Contains(s)) ||
                (c.InquiryFrom != null && c.InquiryFrom.ToLower().Contains(s)) ||
                (c.Comment != null && c.Comment.ToLower().Contains(s))
            );
        }

        var customers = await query
            .OrderByDescending(c => c.CreatedDate)
            .Select(c => new CustomerResponse
            {
                Id = c.Id,
                SerialNumber = c.SerialNumber,
                OwnerName = c.OwnerName,
                OwnerPhone = c.OwnerPhone,
                OwnerEmail = c.OwnerEmail,
                TenantName = c.TenantName,
                TenantPhone = c.TenantPhone,
                TenantEmail = c.TenantEmail,
                TokenNumber = c.TokenNumber,
                InquiryFrom = c.InquiryFrom,
                Comment = c.Comment,
                Address = c.Address,
                Type = (int)c.Type,
                TypeName = c.Type.ToString(),
                Status = (int)c.Status,
                StatusName = c.Status.ToString(),
                StartDate = c.StartDate,
                Period = c.Period,
                EndDate = c.EndDate,
                CreatedDate = c.CreatedDate,
                CreatedByName = c.CreatedBy != null ? c.CreatedBy.Name : "System"
            })
            .ToListAsync();
        return Ok(customers);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var c = await _db.Customers
            .Include(c => c.CreatedBy)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (c == null) return NotFound();

        return Ok(new CustomerResponse
        {
            Id = c.Id,
            SerialNumber = c.SerialNumber,
            OwnerName = c.OwnerName,
            OwnerPhone = c.OwnerPhone,
            OwnerEmail = c.OwnerEmail,
            TenantName = c.TenantName,
            TenantPhone = c.TenantPhone,
            TenantEmail = c.TenantEmail,
            TokenNumber = c.TokenNumber,
            InquiryFrom = c.InquiryFrom,
            Comment = c.Comment,
            Address = c.Address,
            Type = (int)c.Type,
            TypeName = c.Type.ToString(),
            Status = (int)c.Status,
            StatusName = c.Status.ToString(),
            StartDate = c.StartDate,
            Period = c.Period,
            EndDate = c.EndDate,
            CreatedDate = c.CreatedDate,
            CreatedByName = c.CreatedBy?.Name ?? "System"
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCustomerRequest req)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "1");

        var customer = new Customer
        {
            OwnerName = req.OwnerName,
            OwnerPhone = req.OwnerPhone,
            OwnerEmail = req.OwnerEmail,
            TenantName = req.TenantName,
            TenantPhone = req.TenantPhone,
            TenantEmail = req.TenantEmail,
            TokenNumber = req.TokenNumber,
            InquiryFrom = req.InquiryFrom,
            Comment = req.Comment,
            Address = req.Address,
            Type = req.Type,
            Status = req.Status,
            StartDate = req.StartDate,
            Period = req.Period
        };

        var created = await _customerService.CreateAsync(customer, userId);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, new CustomerResponse
        {
            Id = created.Id,
            SerialNumber = created.SerialNumber,
            OwnerName = created.OwnerName,
            OwnerPhone = created.OwnerPhone,
            OwnerEmail = created.OwnerEmail,
            TenantName = created.TenantName,
            TenantPhone = created.TenantPhone,
            TenantEmail = created.TenantEmail,
            TokenNumber = created.TokenNumber,
            InquiryFrom = created.InquiryFrom,
            Comment = created.Comment,
            Address = created.Address,
            Type = (int)created.Type,
            TypeName = created.Type.ToString(),
            Status = (int)created.Status,
            StatusName = created.Status.ToString(),
            StartDate = created.StartDate,
            Period = created.Period,
            EndDate = created.EndDate,
            CreatedDate = created.CreatedDate
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCustomerRequest req)
    {
        var customer = await _db.Customers.FindAsync(id);
        if (customer == null) return NotFound();

        customer.OwnerName = req.OwnerName;
        customer.OwnerPhone = req.OwnerPhone;
        customer.OwnerEmail = req.OwnerEmail;
        customer.TenantName = req.TenantName;
        customer.TenantPhone = req.TenantPhone;
        customer.TenantEmail = req.TenantEmail;
        customer.TokenNumber = req.TokenNumber;
        customer.InquiryFrom = req.InquiryFrom;
        customer.Comment = req.Comment;
        customer.Address = req.Address;
        customer.Type = req.Type;
        customer.Status = req.Status;
        customer.StartDate = req.StartDate;
        customer.Period = req.Period;
        
        if (req.Period.HasValue && req.StartDate.HasValue)
        {
            customer.EndDate = req.StartDate.Value.AddMonths(req.Period.Value);
        }
        else
        {
            customer.EndDate = null;
        }

        await _db.SaveChangesAsync();
        return Ok(new CustomerResponse
        {
            Id = customer.Id,
            SerialNumber = customer.SerialNumber,
            OwnerName = customer.OwnerName,
            OwnerPhone = customer.OwnerPhone,
            OwnerEmail = customer.OwnerEmail,
            TenantName = customer.TenantName,
            TenantPhone = customer.TenantPhone,
            TenantEmail = customer.TenantEmail,
            TokenNumber = customer.TokenNumber,
            InquiryFrom = customer.InquiryFrom,
            Comment = customer.Comment,
            Address = customer.Address,
            Type = (int)customer.Type,
            TypeName = customer.Type.ToString(),
            Status = (int)customer.Status,
            StatusName = customer.Status.ToString(),
            StartDate = customer.StartDate,
            Period = customer.Period,
            EndDate = customer.EndDate,
            CreatedDate = customer.CreatedDate
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var customer = await _db.Customers.FindAsync(id);
        if (customer == null) return NotFound();

        customer.IsDeleted = true;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
