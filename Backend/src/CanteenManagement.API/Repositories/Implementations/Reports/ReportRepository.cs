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
            string outletFilter = filter.OutletId.HasValue && filter.OutletId.Value > 0 ? "AND o.OutletId = @OutletId" : "";
            var reportType = filter.ReportType.ToLower();

            if (reportType == "item_wise")
            {
                string sql = $@"
                    SELECT 
                        mi.Code AS itemCode,
                        mi.Name AS name,
                        cat.Name AS category,
                        mi.Price AS unitPrice,
                        COALESCE(SUM(oi.Quantity), 0) AS qtySold,
                        COALESCE(SUM(oi.TotalPrice), 0) AS totalRevenue
                    FROM OrderItems oi
                    INNER JOIN Orders o ON oi.OrderId = o.OrderId
                    INNER JOIN MenuItems mi ON oi.MenuItemId = mi.MenuItemId
                    INNER JOIN Categories cat ON mi.CategoryId = cat.CategoryId
                    WHERE o.InstitutionId = @InstitutionId AND o.Status != 'Cancelled' {outletFilter}
                    GROUP BY mi.Code, mi.Name, cat.Name, mi.Price
                    ORDER BY qtySold DESC;";

                var items = (await connection.QueryAsync(sql, new { InstitutionId = institutionId, OutletId = filter.OutletId })).ToList();
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

            // Default: Sales Summary Report
            string salesSql = $@"
                SELECT 
                    DATE_FORMAT(o.OrderDate, '%Y-%m-%d') AS date,
                    co.Name AS outlet,
                    COUNT(o.OrderId) AS orders,
                    COALESCE(SUM(o.Subtotal), 0) AS grossSales,
                    COALESCE(SUM(o.TaxAmount), 0) AS tax,
                    COALESCE(SUM(o.TotalAmount), 0) AS netSales
                FROM Orders o
                INNER JOIN CanteenOutlets co ON o.OutletId = co.OutletId
                WHERE o.InstitutionId = @InstitutionId AND o.Status != 'Cancelled' {outletFilter}
                GROUP BY DATE_FORMAT(o.OrderDate, '%Y-%m-%d'), co.Name
                ORDER BY date DESC, grossSales DESC;";

            var sales = (await connection.QueryAsync(salesSql, new { InstitutionId = institutionId, OutletId = filter.OutletId })).ToList();
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
            int sumOrders = sales.Sum(s => (int)s.orders);

            return new ReportResultDto
            {
                ReportType = "sales_summary",
                SummaryMetrics = new Dictionary<string, object>
                {
                    ["totalRevenue"] = sumNet,
                    ["totalOrders"] = sumOrders,
                    ["averageOrderValue"] = sumOrders > 0 ? Math.Round(sumNet / sumOrders, 2) : 0,
                    ["completedOrders"] = sumOrders,
                    ["cancelledOrders"] = 0
                },
                Columns = new List<ReportColumnDto>
                {
                    new() { Key = "date", Header = "Date" },
                    new() { Key = "outlet", Header = "Outlet" },
                    new() { Key = "orders", Header = "Orders Count" },
                    new() { Key = "grossSales", Header = "Gross Sales (₹)" },
                    new() { Key = "tax", Header = "GST (5%)" },
                    new() { Key = "netSales", Header = "Net Settled (₹)" }
                },
                Rows = salesRows
            };
        }
    }
}
