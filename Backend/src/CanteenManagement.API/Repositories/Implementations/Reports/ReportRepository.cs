using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using CanteenManagement.API.Data;
using CanteenManagement.API.DTOs.Reports;
using CanteenManagement.API.Helpers;
using CanteenManagement.API.Repositories.Interfaces.Reports;
using Dapper;

namespace CanteenManagement.API.Repositories.Implementations.Reports
{
    public class ReportRepository : IReportRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public ReportRepository(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<ReportResultDto> GetReportDataAsync(int campusId, ReportFilterDto filter)
        {
            using var connection = _connectionFactory.CreateConnection();
            var reportType = (filter.ReportType ?? "sales_summary").ToLower();
            var (startDate, endDate) = ResolveDateRange(filter.DateRange, filter.StartDate, filter.EndDate);

            var parameters = new
            {
                p_CampusId = campusId,
                p_OutletId = filter.OutletId ?? 0,
                p_StartDate = startDate,
                p_EndDate = endDate,
                p_PaymentMethod = string.IsNullOrWhiteSpace(filter.Payment) ? "ALL" : filter.Payment
            };

            if (reportType == "item_wise" || reportType == "items")
            {
                var items = (await connection.QueryAsync<ItemWiseReportRow>(
                    "sp_GetReportItemWise",
                    parameters,
                    commandType: CommandType.StoredProcedure)).ToList();

                var rows = items.Select(r => new Dictionary<string, object>
                {
                    ["itemCode"] = r.ItemCode ?? string.Empty,
                    ["name"] = r.Name ?? string.Empty,
                    ["category"] = r.Category ?? string.Empty,
                    ["unitPrice"] = r.UnitPrice,
                    ["qtySold"] = (int)r.QtySold,
                    ["totalRevenue"] = r.TotalRevenue
                }).ToList();

                decimal totalRev = items.Sum(i => i.TotalRevenue);
                int totalSold = (int)items.Sum(i => i.QtySold);

                return new ReportResultDto
                {
                    ReportType = "item_wise",
                    SummaryMetrics = new Dictionary<string, object>
                    {
                        ["totalItemsSold"] = totalSold,
                        ["totalRevenue"] = totalRev,
                        ["uniqueDishes"] = items.Count
                    },
                    Columns = new List<ReportColumnDto>
                    {
                        new() { Key = "itemCode", Header = "Item Code" },
                        new() { Key = "name", Header = "Item Name" },
                        new() { Key = "category", Header = "Category" },
                        new() { Key = "unitPrice", Header = "Unit Price (₹)" },
                        new() { Key = "qtySold", Header = "Quantity Sold" },
                        new() { Key = "totalRevenue", Header = "Total Revenue (₹)" }
                    },
                    Rows = rows
                };
            }

            // Default: Sales Summary Report via Stored Procedure
            var sales = (await connection.QueryAsync<SalesSummaryReportRow>(
                "sp_GetReportSalesSummary",
                parameters,
                commandType: CommandType.StoredProcedure)).ToList();

            var salesRows = sales.Select(s => new Dictionary<string, object>
            {
                ["date"] = s.Date ?? string.Empty,
                ["outlet"] = s.Outlet ?? string.Empty,
                ["orders"] = s.Orders,
                ["grossSales"] = s.GrossSales,
                ["tax"] = s.Tax,
                ["netSales"] = s.NetSales
            }).ToList();

            decimal sumGross = sales.Sum(s => s.GrossSales);
            decimal sumNet = sales.Sum(s => s.NetSales);
            decimal sumTax = sales.Sum(s => s.Tax);
            int sumOrders = sales.Sum(s => s.Orders);

            return new ReportResultDto
            {
                ReportType = "sales_summary",
                SummaryMetrics = new Dictionary<string, object>
                {
                    ["totalOrders"] = sumOrders,
                    ["grossSales"] = sumGross,
                    ["taxCollected"] = sumTax,
                    ["netSales"] = sumNet
                },
                Columns = new List<ReportColumnDto>
                {
                    new() { Key = "date", Header = "Date" },
                    new() { Key = "outlet", Header = "Canteen Outlet" },
                    new() { Key = "orders", Header = "Total Orders" },
                    new() { Key = "grossSales", Header = "Gross Sales (₹)" },
                    new() { Key = "tax", Header = "Taxes (₹)" },
                    new() { Key = "netSales", Header = "Net Revenue (₹)" }
                },
                Rows = salesRows
            };
        }

        private static (DateTime? StartDate, DateTime? EndDate) ResolveDateRange(string? dateRange, DateTime? customStart, DateTime? customEnd)
        {
            if (customStart.HasValue && customEnd.HasValue)
            {
                var startIst = customStart.Value.Date;
                var endIst = customEnd.Value.Date.AddDays(1).AddTicks(-1);
                return (IndianTime.ToUtc(startIst), IndianTime.ToUtc(endIst));
            }

            if (string.IsNullOrWhiteSpace(dateRange))
            {
                return (null, null);
            }

            var todayIst = IndianTime.Today;

            switch (dateRange.Trim().ToLower())
            {
                case "today":
                    return (IndianTime.ToUtc(todayIst), IndianTime.ToUtc(todayIst.AddDays(1).AddTicks(-1)));
                case "yesterday":
                    return (IndianTime.ToUtc(todayIst.AddDays(-1)), IndianTime.ToUtc(todayIst.AddTicks(-1)));
                case "last_7_days":
                case "7days":
                    return (IndianTime.ToUtc(todayIst.AddDays(-6)), IndianTime.ToUtc(todayIst.AddDays(1).AddTicks(-1)));
                case "month_to_date":
                case "mtd":
                case "this_month":
                    var startOfMonth = new DateTime(todayIst.Year, todayIst.Month, 1);
                    return (IndianTime.ToUtc(startOfMonth), IndianTime.ToUtc(todayIst.AddDays(1).AddTicks(-1)));
                case "quarter_to_date":
                case "qtd":
                case "this_quarter":
                    return (IndianTime.ToUtc(todayIst.AddDays(-90)), IndianTime.ToUtc(todayIst.AddDays(1).AddTicks(-1)));
                case "all":
                case "any":
                    return (null, null);
                default:
                    if (DateTime.TryParse(dateRange, out var parsedDate))
                    {
                        var parsedIst = parsedDate.Date;
                        return (IndianTime.ToUtc(parsedIst), IndianTime.ToUtc(parsedIst.AddDays(1).AddTicks(-1)));
                    }
                    return (null, null);
            }
        }
    }

    public class ItemWiseReportRow
    {
        public string? ItemCode { get; set; }
        public string? Name { get; set; }
        public string? Category { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal QtySold { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    public class SalesSummaryReportRow
    {
        public string? Date { get; set; }
        public string? Outlet { get; set; }
        public int Orders { get; set; }
        public decimal GrossSales { get; set; }
        public decimal Tax { get; set; }
        public decimal NetSales { get; set; }
    }
}
