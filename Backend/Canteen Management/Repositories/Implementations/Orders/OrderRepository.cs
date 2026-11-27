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

        public async Task<IEnumerable<Order>> GetAllAsync(int campusId, int? outletId = null, string? status = null, string? searchTerm = null)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                using var multi = await connection.QueryMultipleAsync(
                    "sp_GetAllOrders",
                    new
                    {
                        p_CampusId = campusId,
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
                    .AsNoTracking()
                    .AsSplitQuery()
                    .Include(o => o.Outlet)
                    .Include(o => o.Items)
                    .Include(o => o.Timeline)
                    .Include(o => o.Payments)
                    .Where(o => o.CampusId == campusId);

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

        public async Task<Order?> GetByIdAsync(string id, int campusId)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                using var multi = await connection.QueryMultipleAsync(
                    "sp_GetOrderById",
                    new { p_OrderId = id, p_CampusId = campusId },
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
                    .AsNoTracking()
                    .AsSplitQuery()
                    .Include(o => o.Outlet)
                    .Include(o => o.Items)
                    .Include(o => o.Timeline)
                    .Include(o => o.Payments)
                    .FirstOrDefaultAsync(o => o.OrderId == id && o.CampusId == campusId);
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

        public async Task<bool> UpdatePaymentTransactionAsync(PaymentTransaction payment)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                var rows = await connection.ExecuteAsync(
                    @"UPDATE PaymentTransactions 
                      SET Status = @Status, PaidAt = @PaidAt, TransactionId = @TransactionId, Method = @Method
                      WHERE OrderId = @OrderId;",
                    new
                    {
                        payment.Status,
                        payment.PaidAt,
                        payment.TransactionId,
                        payment.Method,
                        payment.OrderId
                    });
                return rows > 0;
            }
            catch
            {
                var existing = await _dbContext.PaymentTransactions.FirstOrDefaultAsync(p => p.OrderId == payment.OrderId);
                if (existing != null)
                {
                    existing.Status = payment.Status;
                    existing.PaidAt = payment.PaidAt;
                    existing.TransactionId = payment.TransactionId;
                    existing.Method = payment.Method;
                    await _dbContext.SaveChangesAsync();
                    return true;
                }
                return false;
            }
        }

        public async Task<bool> DeleteAsync(string id, int campusId)
        {
            try
            {
                var order = await _dbContext.Orders
                    .Include(o => o.Items)
                    .Include(o => o.Timeline)
                    .Include(o => o.Payments)
                    .FirstOrDefaultAsync(o => o.OrderId == id && (campusId <= 0 || o.CampusId == campusId));

                if (order == null) return false;

                _dbContext.Orders.Remove(order);
                await _dbContext.SaveChangesAsync();
                return true;
            }
            catch
            {
                using var connection = _connectionFactory.CreateConnection();
                var rows = await connection.ExecuteAsync(
                    "DELETE FROM Orders WHERE OrderId = @Id AND (@CampusId <= 0 OR CampusId = @CampusId);",
                    new { Id = id, CampusId = campusId });
                return rows > 0;
            }
        }
    }
}
