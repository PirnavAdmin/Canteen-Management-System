using System.Data;
using CanteenManagement.API.Data;
using CanteenManagement.API.DTOs.Reports;
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

        public async Task<ReportResultDto> GetReportDataAsync(int institutionId, ReportFilterDto filter)
        {
            using var connection = _connectionFactory.CreateConnection();
            var reportType = filter.ReportType.ToLower();
            var parameters = new
            {
                p_InstitutionId = institutionId,
                p_OutletId = filter.OutletId ?? 0
            };

            if (reportType == "item_wise")
            {
                var items = (await connection.QueryAsync(
                    "sp_GetReportItemWise",
                    parameters,
                    commandType: CommandType.StoredProcedure)).ToList();

                var rows = items.Select(r => new Dictionary<string, object>
                {
                    ["itemCode"] = r.itemCode,
                    ["name"] = r.name,
                    ["category"] = r.category,
                    ["unitPrice"] = r.unitPrice,
                    ["qtySold"] = r.qtySold,
                    ["totalRevenue"] = r.totalRevenue
                }).ToList();

                decimal totalRev = items.Sum(i => (decimal)i.totalRevenue);
                int totalSold = items.Sum(i => (int)i.qtySold);

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
            var sales = (await connection.QueryAsync(
                "sp_GetReportSalesSummary",
                parameters,
                commandType: CommandType.StoredProcedure)).ToList();

            var salesRows = sales.Select(s => new Dictionary<string, object>
            {
                ["date"] = s.date,
                ["outlet"] = s.outlet,
                ["orders"] = s.orders,
                ["grossSales"] = s.grossSales,
                ["tax"] = s.tax,
                ["netSales"] = s.netSales
            }).ToList();

            decimal sumGross = sales.Sum(s => (decimal)s.grossSales);
            decimal sumNet = sales.Sum(s => (decimal)s.netSales);
            decimal sumTax = sales.Sum(s => (decimal)s.tax);
            int sumOrders = sales.Sum(s => (int)s.orders);

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
    }
}
