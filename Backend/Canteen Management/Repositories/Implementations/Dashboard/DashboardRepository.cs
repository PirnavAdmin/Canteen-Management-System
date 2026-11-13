using System.Data;
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
            var parameters = new
            {
                p_InstitutionId = institutionId,
                p_OutletId = outletId ?? 0
            };

            var summary = await connection.QueryFirstOrDefaultAsync<dynamic>(
                "sp_GetDashboardSummary",
                parameters,
                commandType: CommandType.StoredProcedure);

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
            var parameters = new
            {
                p_InstitutionId = institutionId,
                p_OutletId = outletId ?? 0
            };

            return await connection.QueryAsync<HourlySalesDto>(
                "sp_GetHourlySales",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<LiveOrderDto>> GetLiveOrdersAsync(int institutionId, int? outletId = null)
        {
            using var connection = _connectionFactory.CreateConnection();
            var parameters = new
            {
                p_InstitutionId = institutionId,
                p_OutletId = outletId ?? 0
            };

            var orders = (await connection.QueryAsync<LiveOrderDto>(
                "sp_GetLiveOrders",
                parameters,
                commandType: CommandType.StoredProcedure)).ToList();

            if (orders.Count > 0)
            {
                var orderIds = orders.Select(o => o.OrderId).ToList();
                var itemsParameters = new
                {
                    p_OrderIds = string.Join(",", orderIds)
                };

                var items = await connection.QueryAsync<dynamic>(
                    "sp_GetLiveOrderItems",
                    itemsParameters,
                    commandType: CommandType.StoredProcedure);

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
            var parameters = new
            {
                p_InstitutionId = institutionId,
                p_OutletId = outletId ?? 0
            };

            return await connection.QueryAsync<TopSellingItemDto>(
                "sp_GetTopSellingItems",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<StockAlertDto>> GetStockAlertsAsync(int institutionId)
        {
            using var connection = _connectionFactory.CreateConnection();
            var parameters = new
            {
                p_InstitutionId = institutionId
            };

            return await connection.QueryAsync<StockAlertDto>(
                "sp_GetStockAlerts",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<OutletSalesDto>> GetOutletSalesAsync(int institutionId)
        {
            using var connection = _connectionFactory.CreateConnection();
            var parameters = new
            {
                p_InstitutionId = institutionId
            };

            return await connection.QueryAsync<OutletSalesDto>(
                "sp_GetOutletSales",
                parameters,
                commandType: CommandType.StoredProcedure);
        }
    }
}
