using System.Data;
using CanteenManagement.API.Data;
using CanteenManagement.API.Models.Orders;
using CanteenManagement.API.Models.Outlets;
using CanteenManagement.API.Repositories.Interfaces.Orders;
using Dapper;
using Microsoft.EntityFrameworkCore;

namespace CanteenManagement.API.Repositories.Implementations.Orders
{
    public class OrderRepository : IOrderRepository
    {
        private readonly AppDbContext _dbContext;
        private readonly IDbConnectionFactory _connectionFactory;

        public OrderRepository(AppDbContext dbContext, IDbConnectionFactory connectionFactory)
        {
            _dbContext = dbContext;
            _connectionFactory = connectionFactory;
        }

        public async Task<IEnumerable<Order>> GetAllAsync(int institutionId, int? outletId = null, string? status = null, string? searchTerm = null)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                using var multi = await connection.QueryMultipleAsync(
                    "sp_GetAllOrders",
                    new
                    {
                        p_InstitutionId = institutionId,
                        p_OutletId = outletId ?? 0,
                        p_Status = status,
                        p_SearchTerm = searchTerm
                    },
                    commandType: CommandType.StoredProcedure);

                var orders = multi.Read<Order, CanteenOutlet, Order>(
                    (order, outlet) =>
                    {
                        order.Outlet = outlet;
                        return order;
                    },
                    splitOn: "OutletId").ToList();

                var items = (await multi.ReadAsync<OrderItem>()).ToList();
                var itemsByOrder = items.GroupBy(i => i.OrderId).ToDictionary(g => g.Key, g => g.ToList());

                foreach (var o in orders)
                {
                    if (itemsByOrder.TryGetValue(o.OrderId, out var orderItems))
                    {
                        o.Items = orderItems;
                    }
                }

                return orders;
            }
            catch
            {
                var query = _dbContext.Orders
                    .Include(o => o.Outlet)
                    .Include(o => o.Items)
                    .Include(o => o.Timeline)
                    .Include(o => o.Payments)
                    .Where(o => o.InstitutionId == institutionId);

                if (outletId.HasValue && outletId.Value > 0)
                {
                    query = query.Where(o => o.OutletId == outletId.Value);
                }

                if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
                {
                    query = query.Where(o => o.Status == status);
                }

                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    var term = searchTerm.Trim().ToLower();
                    query = query.Where(o => o.OrderId.ToLower().Contains(term) ||
                                             o.Token.ToLower().Contains(term) ||
                                             o.CustomerName.ToLower().Contains(term));
                }

                return await query.OrderByDescending(o => o.OrderDate).AsNoTracking().ToListAsync();
            }
        }

        public async Task<Order?> GetByIdAsync(string id, int institutionId)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                using var multi = await connection.QueryMultipleAsync(
                    "sp_GetOrderById",
                    new { p_OrderId = id, p_InstitutionId = institutionId },
                    commandType: CommandType.StoredProcedure);

                var order = await multi.ReadFirstOrDefaultAsync<Order>();
                if (order != null)
                {
                    order.Items = (await multi.ReadAsync<OrderItem>()).ToList();
                    order.Timeline = (await multi.ReadAsync<OrderTimeline>()).ToList();
                    order.Payments = (await multi.ReadAsync<PaymentTransaction>()).ToList();

                    var outlet = await _dbContext.CanteenOutlets.FindAsync(order.OutletId);
                    order.Outlet = outlet;
                    
                }

                return order;
            }
            catch
            {
                return await _dbContext.Orders
                    .Include(o => o.Outlet)
                                        .Include(o => o.Items)
                    .Include(o => o.Timeline)
                    .Include(o => o.Payments)
                    .FirstOrDefaultAsync(o => o.OrderId == id && o.InstitutionId == institutionId);
            }
        }

        public async Task<string> GenerateNextDailyTokenAsync(int outletId, DateTime date)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                var token = await connection.ExecuteScalarAsync<string>(
                    "sp_GenerateNextDailyToken",
                    new { p_OutletId = outletId, p_OrderDate = date.Date },
                    commandType: CommandType.StoredProcedure);

                return token ?? "T-101";
            }
            catch
            {
                return "T-101";
            }
        }

        public async Task<Order> CreateAsync(Order order)
        {
            await _dbContext.Orders.AddAsync(order);
            await _dbContext.SaveChangesAsync();
            return order;
        }

        public async Task<Order> UpdateAsync(Order order)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                await connection.ExecuteAsync(
                    "sp_UpdateOrderStatus",
                    new
                    {
                        p_OrderId = order.OrderId,
                        p_Status = order.Status,
                        p_CancellationReason = order.CancellationReason
                    },
                    commandType: CommandType.StoredProcedure);

                order.UpdatedAt = DateTime.UtcNow;
                return order;
            }
            catch
            {
                order.UpdatedAt = DateTime.UtcNow;
                _dbContext.Orders.Update(order);
                await _dbContext.SaveChangesAsync();
                return order;
            }
        }
    }
}
