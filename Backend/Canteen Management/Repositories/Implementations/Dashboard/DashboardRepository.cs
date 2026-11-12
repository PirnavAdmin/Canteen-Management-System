using CanteenManagement.API.Data;
using CanteenManagement.API.DTOs.Dashboard;
using CanteenManagement.API.Repositories.Interfaces.Dashboard;
using Dapper;

namespace CanteenManagement.API.Repositories.Implementations.Dashboard
{
    public class DashboardRepository : IDashboardRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public DashboardRepository(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<DashboardSummaryDto> GetSummaryAsync(int institutionId, int? outletId = null)
        {
            using var connection = _connectionFactory.CreateConnection();
            string outletFilter = outletId.HasValue && outletId.Value > 0 ? "AND OutletId = @OutletId" : "";

            string sql = $@"
                SELECT 
                    COALESCE(SUM(CASE WHEN DATE(OrderDate) = CURRENT_DATE AND Status != 'Cancelled' THEN TotalAmount ELSE 0 END), 0) AS TodayRevenue,
                    COALESCE(SUM(CASE WHEN Status IN ('Placed', 'Accepted', 'Preparing', 'Ready for Pickup') THEN 1 ELSE 0 END), 0) AS ActiveOrders,
                    (SELECT COUNT(1) FROM CanteenOutlets WHERE InstitutionId = @InstitutionId AND Status = 'Active') AS ActiveOutlets
                FROM Orders 
                WHERE InstitutionId = @InstitutionId {outletFilter};";

            var summary = await connection.QueryFirstOrDefaultAsync<dynamic>(sql, new { InstitutionId = institutionId, OutletId = outletId });

            return new DashboardSummaryDto
            {
                TodayRevenue = (decimal)(summary?.TodayRevenue ?? 0m),
                ActiveOrders = (int)(summary?.ActiveOrders ?? 0),
                ActiveOutlets = (int)(summary?.ActiveOutlets ?? 1),
                AvgPrepTime = "14 mins",
                RevenueGrowthPercent = 12.4m
            };
        }

        public async Task<IEnumerable<HourlySalesDto>> GetHourlySalesAsync(int institutionId, int? outletId = null)
        {
            using var connection = _connectionFactory.CreateConnection();
            string outletFilter = outletId.HasValue && outletId.Value > 0 ? "AND OutletId = @OutletId" : "";

            string sql = $@"
                SELECT 
                    DATE_FORMAT(OrderDate, '%H:00') AS Hour,
                    COALESCE(SUM(TotalAmount), 0) AS Sales,
                    COUNT(1) AS Orders
                FROM Orders
                WHERE InstitutionId = @InstitutionId 
                  AND DATE(OrderDate) = CURRENT_DATE 
                  AND Status != 'Cancelled'
                  {outletFilter}
                GROUP BY DATE_FORMAT(OrderDate, '%H:00')
                ORDER BY Hour ASC;";

            var rows = await connection.QueryAsync<HourlySalesDto>(sql, new { InstitutionId = institutionId, OutletId = outletId });
            return rows;
        }

        public async Task<IEnumerable<LiveOrderDto>> GetLiveOrdersAsync(int institutionId, int? outletId = null)
        {
            using var connection = _connectionFactory.CreateConnection();
            string outletFilter = outletId.HasValue && outletId.Value > 0 ? "AND o.OutletId = @OutletId" : "";

            string sql = $@"
                SELECT 
                    o.OrderId,
                    o.Token,
                    o.CustomerName,
                    co.Name AS OutletName,
                    (SELECT COUNT(1) FROM OrderItems oi WHERE oi.OrderId = o.OrderId) AS ItemCount,
                    o.TotalAmount,
                    o.Status,
                    CONCAT(TIMESTAMPDIFF(MINUTE, o.OrderDate, NOW()), 'm') AS ElapsedTime
                FROM Orders o
                INNER JOIN CanteenOutlets co ON o.OutletId = co.OutletId
                WHERE o.InstitutionId = @InstitutionId 
                  AND o.Status IN ('Placed', 'Accepted', 'Preparing', 'Ready for Pickup')
                  {outletFilter}
                ORDER BY o.OrderDate ASC
                LIMIT 20;";

            return await connection.QueryAsync<LiveOrderDto>(sql, new { InstitutionId = institutionId, OutletId = outletId });
        }

        public async Task<IEnumerable<TopSellingItemDto>> GetTopSellingItemsAsync(int institutionId, int? outletId = null)
        {
            using var connection = _connectionFactory.CreateConnection();
            string outletFilter = outletId.HasValue && outletId.Value > 0 ? "AND o.OutletId = @OutletId" : "";

            string sql = $@"
                SELECT 
                    mi.Code,
                    mi.Name,
                    cat.Name AS Category,
                    COALESCE(SUM(oi.Quantity), 0) AS QtySold,
                    COALESCE(SUM(oi.TotalPrice), 0) AS Revenue
                FROM OrderItems oi
                INNER JOIN Orders o ON oi.OrderId = o.OrderId
                INNER JOIN MenuItems mi ON oi.MenuItemId = mi.MenuItemId
                INNER JOIN Categories cat ON mi.CategoryId = cat.CategoryId
                WHERE o.InstitutionId = @InstitutionId AND o.Status != 'Cancelled' {outletFilter}
                GROUP BY mi.Code, mi.Name, cat.Name
                ORDER BY QtySold DESC
                LIMIT 5;";

            return await connection.QueryAsync<TopSellingItemDto>(sql, new { InstitutionId = institutionId, OutletId = outletId });
        }

        public async Task<IEnumerable<StockAlertDto>> GetStockAlertsAsync(int institutionId)
        {
            using var connection = _connectionFactory.CreateConnection();
            const string sql = @"
                SELECT 
                    ItemId,
                    IngredientName,
                    AvailableQuantity,
                    Unit,
                    ReorderLevel,
                    Status
                FROM InventoryItems
                WHERE InstitutionId = @InstitutionId AND AvailableQuantity <= ReorderLevel
                ORDER BY AvailableQuantity ASC
                LIMIT 10;";

            return await connection.QueryAsync<StockAlertDto>(sql, new { InstitutionId = institutionId });
        }

        public async Task<IEnumerable<OutletSalesDto>> GetOutletSalesAsync(int institutionId)
        {
            using var connection = _connectionFactory.CreateConnection();
            const string sql = @"
                SELECT 
                    co.OutletId,
                    co.Name AS OutletName,
                    COUNT(o.OrderId) AS Orders,
                    COALESCE(SUM(o.Subtotal), 0) AS GrossSales,
                    COALESCE(SUM(o.TotalAmount), 0) AS NetSales
                FROM CanteenOutlets co
                LEFT JOIN Orders o ON co.OutletId = o.OutletId AND DATE(o.OrderDate) = CURRENT_DATE AND o.Status != 'Cancelled'
                WHERE co.InstitutionId = @InstitutionId
                GROUP BY co.OutletId, co.Name
                ORDER BY NetSales DESC;";

            return await connection.QueryAsync<OutletSalesDto>(sql, new { InstitutionId = institutionId });
        }
    }
}

