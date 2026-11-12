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
                    COUNT(1) AS TotalOrders,
                    COALESCE(SUM(CASE WHEN DATE(OrderDate) = CURRENT_DATE AND Status != 'Cancelled' THEN TotalAmount ELSE 0 END), 0) AS TodayRevenue,
                    COALESCE(SUM(CASE WHEN Status != 'Cancelled' THEN TotalAmount ELSE 0 END), 0) AS TotalSales,
                    COALESCE(SUM(CASE WHEN Status IN ('Placed', 'Accepted', 'Preparing', 'Ready for Pickup') THEN 1 ELSE 0 END), 0) AS ActiveOrders,
                    COALESCE(SUM(CASE WHEN Status = 'Placed' THEN 1 ELSE 0 END), 0) AS PendingOrders,
                    COALESCE(SUM(CASE WHEN Status = 'Accepted' THEN 1 ELSE 0 END), 0) AS AcceptedOrders,
                    COALESCE(SUM(CASE WHEN Status = 'Preparing' THEN 1 ELSE 0 END), 0) AS PreparingOrders,
                    COALESCE(SUM(CASE WHEN Status = 'Ready for Pickup' THEN 1 ELSE 0 END), 0) AS ReadyForPickup,
                    COALESCE(SUM(CASE WHEN Status = 'Completed' THEN 1 ELSE 0 END), 0) AS CompletedOrders,
                    COALESCE(SUM(CASE WHEN Status = 'Cancelled' THEN 1 ELSE 0 END), 0) AS CancelledOrders,
                    (SELECT COUNT(1) FROM CanteenOutlets WHERE InstitutionId = @InstitutionId AND Status = 'Active') AS ActiveOutlets
                FROM Orders 
                WHERE InstitutionId = @InstitutionId {outletFilter};";

            var summary = await connection.QueryFirstOrDefaultAsync<dynamic>(sql, new { InstitutionId = institutionId, OutletId = outletId });

            return new DashboardSummaryDto
            {
                TodayRevenue = (decimal)(summary?.TodayRevenue ?? 0m),
                TotalSales = (decimal)(summary?.TotalSales ?? 0m),
                TotalOrders = (int)(summary?.TotalOrders ?? 0),
                ActiveOrders = (int)(summary?.ActiveOrders ?? 0),
                PendingOrders = (int)(summary?.PendingOrders ?? 0),
                AcceptedOrders = (int)(summary?.AcceptedOrders ?? 0),
                PreparingOrders = (int)(summary?.PreparingOrders ?? 0),
                ReadyForPickup = (int)(summary?.ReadyForPickup ?? 0),
                CompletedOrders = (int)(summary?.CompletedOrders ?? 0),
                CancelledOrders = (int)(summary?.CancelledOrders ?? 0),
                ActiveOutlets = (int)(summary?.ActiveOutlets ?? 1),
                AvgPrepTime = "14 mins",
                AveragePreparationTime = "14 mins",
                RevenueGrowthPercent = 12.4m,
                HourlyPeakTime = "12:30 PM - 01:45 PM"
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
                    o.OrderId AS Id,
                    o.Token,
                    o.CustomerName,
                    o.CustomerName AS Customer,
                    o.CustomerRole,
                    co.Name AS OutletName,
                    co.Code AS OutletCode,
                    (SELECT COUNT(1) FROM OrderItems oi WHERE oi.OrderId = o.OrderId) AS ItemCount,
                    o.TotalAmount,
                    o.TotalAmount AS Total,
                    o.Status,
                    CONCAT(TIMESTAMPDIFF(MINUTE, o.OrderDate, NOW()), 'm') AS ElapsedTime,
                    CONCAT(TIMESTAMPDIFF(MINUTE, o.OrderDate, NOW()), 'm') AS Slot,
                    DATE_FORMAT(o.OrderDate, '%h:%i %p') AS OrderTime
                FROM Orders o
                INNER JOIN CanteenOutlets co ON o.OutletId = co.OutletId
                WHERE o.InstitutionId = @InstitutionId 
                  AND o.Status IN ('Placed', 'Accepted', 'Preparing', 'Ready for Pickup')
                  {outletFilter}
                ORDER BY o.OrderDate ASC
                LIMIT 20;";

            var orders = (await connection.QueryAsync<LiveOrderDto>(sql, new { InstitutionId = institutionId, OutletId = outletId })).ToList();

            if (orders.Count > 0)
            {
                var orderIds = orders.Select(o => o.OrderId).ToList();
                const string itemsSql = @"
                    SELECT 
                        OrderId,
                        ItemName AS Name,
                        Quantity AS Qty,
                        UnitPrice AS Price
                    FROM OrderItems
                    WHERE OrderId IN @OrderIds;";

                var items = await connection.QueryAsync<dynamic>(itemsSql, new { OrderIds = orderIds });
                var itemsByOrder = items.GroupBy(i => (string)i.OrderId);

                foreach (var grp in itemsByOrder)
                {
                    var targetOrder = orders.FirstOrDefault(o => o.OrderId == grp.Key);
                    if (targetOrder != null)
                    {
                        targetOrder.Items = grp.Select(i => new LiveOrderItemDto
                        {
                            Name = (string)i.Name,
                            Qty = (int)i.Qty,
                            Price = (decimal)i.Price
                        }).ToList();
                    }
                }
            }

            return orders;
        }

        public async Task<IEnumerable<TopSellingItemDto>> GetTopSellingItemsAsync(int institutionId, int? outletId = null)
        {
            using var connection = _connectionFactory.CreateConnection();
            string outletFilter = outletId.HasValue && outletId.Value > 0 ? "AND o.OutletId = @OutletId" : "";

            string sql = $@"
                SELECT 
                    mi.MenuItemId AS Id,
                    mi.Code,
                    mi.Name,
                    cat.Name AS Category,
                    mi.FoodType,
                    COALESCE(SUM(oi.Quantity), 0) AS Count,
                    COALESCE(SUM(oi.Quantity), 0) AS QtySold,
                    COALESCE(SUM(oi.TotalPrice), 0) AS Revenue
                FROM OrderItems oi
                INNER JOIN Orders o ON oi.OrderId = o.OrderId
                INNER JOIN MenuItems mi ON oi.MenuItemId = mi.MenuItemId
                INNER JOIN Categories cat ON mi.CategoryId = cat.CategoryId
                WHERE o.InstitutionId = @InstitutionId AND o.Status != 'Cancelled' {outletFilter}
                GROUP BY mi.MenuItemId, mi.Code, mi.Name, cat.Name, mi.FoodType
                ORDER BY QtySold DESC
                LIMIT 5;";

            return await connection.QueryAsync<TopSellingItemDto>(sql, new { InstitutionId = institutionId, OutletId = outletId });
        }

        public async Task<IEnumerable<StockAlertDto>> GetStockAlertsAsync(int institutionId)
        {
            using var connection = _connectionFactory.CreateConnection();
            const string sql = @"
                SELECT 
                    ItemId AS Id,
                    ItemId,
                    IngredientName AS Ingredient,
                    IngredientName,
                    'Main Canteen' AS Outlet,
                    AvailableQuantity,
                    CONCAT(AvailableQuantity, ' ', Unit) AS Available,
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
                    co.Name,
                    co.Name AS OutletName,
                    COUNT(o.OrderId) AS Orders,
                    COALESCE(SUM(o.TotalAmount), 0) AS Revenue,
                    COALESCE(SUM(o.Subtotal), 0) AS GrossSales,
                    COALESCE(SUM(o.TotalAmount), 0) AS NetSales,
                    100 AS Percentage
                FROM CanteenOutlets co
                LEFT JOIN Orders o ON co.OutletId = o.OutletId AND DATE(o.OrderDate) = CURRENT_DATE AND o.Status != 'Cancelled'
                WHERE co.InstitutionId = @InstitutionId
                GROUP BY co.OutletId, co.Name
                ORDER BY NetSales DESC;";

            return await connection.QueryAsync<OutletSalesDto>(sql, new { InstitutionId = institutionId });
        }
    }
}
