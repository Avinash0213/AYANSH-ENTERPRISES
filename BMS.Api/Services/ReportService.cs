namespace BMS.Api.Services;

using BMS.Api.Data;
using BMS.Api.Domain.Entities;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;

public class ReportService
{
    private readonly AppDbContext _db;

    public ReportService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<object> GetCustomerReportAsync(DateOnly? from, DateOnly? to, int? type)
    {
        var query = _db.Customers.Include(c => c.CreatedBy).AsQueryable();

        if (from.HasValue)
            query = query.Where(c => DateOnly.FromDateTime(c.CreatedDate) >= from.Value);
        if (to.HasValue)
            query = query.Where(c => DateOnly.FromDateTime(c.CreatedDate) <= to.Value);
        if (type.HasValue)
            query = query.Where(c => (int)c.Type == type.Value);

        var customers = await query.OrderByDescending(c => c.CreatedDate).ToListAsync();

        return customers.Select(c => new
        {
            c.Id,
            c.SerialNumber,
            c.OwnerName,
            c.TenantName,
            Type = c.Type.ToString(),
            c.StartDate,
            c.EndDate,
            c.Period,
            CreatedBy = c.CreatedBy?.Name ?? "System"
        });
    }

    public async Task<byte[]> ExportCustomersToExcelAsync(DateOnly? from, DateOnly? to, int? type)
    {
        var query = _db.Customers.Include(c => c.CreatedBy).AsQueryable();

        if (from.HasValue)
            query = query.Where(c => DateOnly.FromDateTime(c.CreatedDate) >= from.Value);
        if (to.HasValue)
            query = query.Where(c => DateOnly.FromDateTime(c.CreatedDate) <= to.Value);
        if (type.HasValue)
            query = query.Where(c => (int)c.Type == type.Value);

        var customers = await query.OrderByDescending(c => c.CreatedDate).ToListAsync();

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Customer Database");

        // Professional Color Palette
        var headerBgColor = XLColor.FromHtml("#1e293b"); // Slate 800
        var headerFontColor = XLColor.White;
        var altRowColor = XLColor.FromHtml("#f8fafc"); // Slate 50
        var borderColor = XLColor.FromHtml("#e2e8f0"); // Slate 200

        // Header Definition
        var headers = new[] { 
            "Serial No", "Agreement Type", "Status", 
            "Owner Name", "Owner Phone", "Owner Email",
            "Tenant Name", "Tenant Phone", "Tenant Email",
            "Property Address", "Token No", "Inquiry Source", 
            "Start Date", "End Date", "Latest Renewal", "Period (Mo)", 
            "User Comments", "Created By", "System Created Date" 
        };

        // Style header row
        for (int i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cell(1, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontSize = 11;
            cell.Style.Font.FontColor = headerFontColor;
            cell.Style.Fill.BackgroundColor = headerBgColor;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            cell.Style.Border.OutsideBorderColor = XLColor.Black;
        }
        ws.Row(1).Height = 25;

        int row = 2;
        foreach (var c in customers)
        {
            ws.Cell(row, 1).SetValue(c.SerialNumber);
            ws.Cell(row, 2).SetValue(c.Type.ToString());
            ws.Cell(row, 3).SetValue(c.Status.ToString());
            ws.Cell(row, 4).SetValue(c.OwnerName);
            ws.Cell(row, 5).SetValue(c.OwnerPhone ?? "N/A");
            ws.Cell(row, 6).SetValue(c.OwnerEmail ?? "N/A");
            ws.Cell(row, 7).SetValue(c.TenantName);
            ws.Cell(row, 8).SetValue(c.TenantPhone ?? "N/A");
            ws.Cell(row, 9).SetValue(c.TenantEmail ?? "N/A");
            ws.Cell(row, 10).SetValue(c.Address ?? "N/A");
            ws.Cell(row, 11).SetValue(c.TokenNumber ?? "N/A");
            ws.Cell(row, 12).SetValue(c.InquiryFrom ?? "N/A");

            // Date Handling
            if (c.StartDate.HasValue) {
                var cell = ws.Cell(row, 13);
                cell.SetValue(c.StartDate.Value.ToDateTime(TimeOnly.MinValue));
                cell.Style.DateFormat.Format = "dd/MM/yyyy";
            } else ws.Cell(row, 13).Value = "—";

            if (c.EndDate.HasValue) {
                var cell = ws.Cell(row, 14);
                cell.SetValue(c.EndDate.Value.ToDateTime(TimeOnly.MinValue));
                cell.Style.DateFormat.Format = "dd/MM/yyyy";
            } else ws.Cell(row, 14).Value = "—";

            ws.Cell(row, 15).Value = "—";

            ws.Cell(row, 16).SetValue(c.Period?.ToString() ?? "—");
            ws.Cell(row, 17).SetValue(c.Comment ?? "No comment.");
            ws.Cell(row, 18).SetValue(c.CreatedBy?.Name ?? "System");
            
            var createdDateCell = ws.Cell(row, 19);
            createdDateCell.SetValue(c.CreatedDate);
            createdDateCell.Style.DateFormat.Format = "yyyy-MM-dd HH:mm";

            // Row Styling (Borders & Alternating colors)
            var currentRow = ws.Range(row, 1, row, headers.Length);
            currentRow.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            currentRow.Style.Border.OutsideBorderColor = borderColor;
            currentRow.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
            currentRow.Style.Border.InsideBorderColor = borderColor;
            currentRow.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;

            if (row % 2 == 0)
            {
                currentRow.Style.Fill.BackgroundColor = altRowColor;
            }

            row++;
        }

        // Final Polish
        ws.Columns().AdjustToContents();
        ws.SheetView.FreezeRows(1);
        
        // Add a bit of extra width to long text columns
        ws.Column(10).Width = 40; // Address
        ws.Column(17).Width = 50; // Comment
        ws.Columns().Style.Alignment.WrapText = true;

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        ms.Seek(0, SeekOrigin.Begin);
        return ms.ToArray();
    }

    public async Task<byte[]> ExportRevenueExpenseLedgerAsync(DateOnly? from, DateOnly? to, string? source = null)
    {
        var query = _db.Payments
            .Include(p => p.Customer)
            .Include(p => p.CreatedBy)
            .AsQueryable();

        if (from.HasValue)
            query = query.Where(p => p.PaymentDate >= from.Value);
        if (to.HasValue)
            query = query.Where(p => p.PaymentDate <= to.Value);

        if (!string.IsNullOrEmpty(source))
        {
            if (source.Equals("customer", StringComparison.OrdinalIgnoreCase))
                query = query.Where(p => p.CustomerId != null);
            else if (source.Equals("visit", StringComparison.OrdinalIgnoreCase))
                query = query.Where(p => p.SataraVisitCode != null);
        }

        var payments = await query.OrderByDescending(p => p.PaymentDate).ToListAsync();

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Payment Ledger");

        // Accounting Color Palette
        var headerBgColor = XLColor.FromHtml("#0f172a"); // Slate 900
        var headerFontColor = XLColor.White;
        var borderColor = XLColor.FromHtml("#cbd5e1"); // Slate 300

        var headers = new[] { 
            "Trans Date", "Reference/Serial No", "Entity/Owner Name", 
            "Gross Received (A)", "Govt Charges (B)", "Visit Charges (C)", 
            "Net Taxable Profit (A-B-C)", "Payment Method", "Remarks" 
        };

        for (int i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cell(1, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = headerBgColor;
            cell.Style.Font.FontColor = headerFontColor;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        }

        int row = 2;
        foreach (var p in payments)
        {
            var dateCell = ws.Cell(row, 1);
            dateCell.SetValue(p.PaymentDate.ToDateTime(TimeOnly.MinValue));
            dateCell.Style.DateFormat.Format = "dd/MM/yyyy";

            ws.Cell(row, 2).SetValue(p.Customer?.SerialNumber ?? p.SataraVisitCode ?? "N/A");
            ws.Cell(row, 3).SetValue(p.Customer?.OwnerName ?? "Client Visit");
            
            var grossCell = ws.Cell(row, 4);
            grossCell.SetValue(p.ReceivedAmount);
            grossCell.Style.NumberFormat.Format = "#,##0.00";

            var govtCell = ws.Cell(row, 5);
            govtCell.SetValue(p.GovernmentCharges);
            govtCell.Style.NumberFormat.Format = "#,##0.00";
            govtCell.Style.Font.FontColor = XLColor.Red;

            var commCell = ws.Cell(row, 6);
            commCell.SetValue(p.EmployeeCommission);
            commCell.Style.NumberFormat.Format = "#,##0.00";

            var profitCell = ws.Cell(row, 7);
            profitCell.SetValue(p.Profit);
            profitCell.Style.NumberFormat.Format = "#,##0.00";
            profitCell.Style.Font.Bold = true;
            profitCell.Style.Fill.BackgroundColor = XLColor.FromHtml("#f1f5f9");

            ws.Cell(row, 8).SetValue("Bank/Cash"); // Placeholder for future enhancement
            ws.Cell(row, 9).SetValue(p.Comment ?? "—");

            // Row Borders
            ws.Range(row, 1, row, headers.Length).Style.Border.InsideBorder = XLBorderStyleValues.Thin;
            ws.Range(row, 1, row, headers.Length).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            ws.Range(row, 1, row, headers.Length).Style.Border.InsideBorderColor = borderColor;

            row++;
        }

        // Add Summary Row
        if (payments.Any())
        {
            var totalRow = row + 1;
            ws.Cell(totalRow, 3).Value = "TOTALS:";
            ws.Cell(totalRow, 3).Style.Font.Bold = true;
            
            ws.Cell(totalRow, 4).FormulaA1 = $"SUM(D2:D{row - 1})";
            ws.Cell(totalRow, 5).FormulaA1 = $"SUM(E2:E{row - 1})";
            ws.Cell(totalRow, 6).FormulaA1 = $"SUM(F2:F{row - 1})";
            ws.Cell(totalRow, 7).FormulaA1 = $"SUM(G2:G{row - 1})";
            
            var summaryRange = ws.Range(totalRow, 4, totalRow, 7);
            summaryRange.Style.Font.Bold = true;
            summaryRange.Style.Border.TopBorder = XLBorderStyleValues.Double;
            summaryRange.Style.NumberFormat.Format = "#,##0.00";
        }

        ws.Columns().AdjustToContents();
        ws.SheetView.FreezeRows(1);

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        ms.Seek(0, SeekOrigin.Begin);
        return ms.ToArray();
    }
}
