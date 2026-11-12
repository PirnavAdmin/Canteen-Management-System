using CanteenManagement.API.Data;
using CanteenManagement.API.Models.Orders;
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
            var query = _dbContext.Orders
                .Include(o => o.Outlet)
                .Include(o => o.Slot)
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

        public async Task<Order?> GetByIdAsync(string id, int institutionId)
        {
            return await _dbContext.Orders
                .Include(o => o.Outlet)
                .Include(o => o.Slot)
                .Include(o => o.Items)
                .Include(o => o.Timeline)
                .Include(o => o.Payments)
                .FirstOrDefaultAsync(o => o.OrderId == id && o.InstitutionId == institutionId);
        }

        public async Task<string> GenerateNextDailyTokenAsync(int outletId, DateTime date)
        {
            using var connection = _connectionFactory.CreateConnection();
            const string sql = @"
                SELECT COUNT(1) + 1 
                FROM Orders 
                WHERE OutletId = @OutletId AND DATE(OrderDate) = @OrderDate;";

            var count = await connection.ExecuteScalarAsync<int>(sql, new { OutletId = outletId, OrderDate = date.Date });
            return $"T-{100 + count}";
        }

        public async Task<Order> CreateAsync(Order order)
        {
            await _dbContext.Orders.AddAsync(order);
            await _dbContext.SaveChangesAsync();
            return order;
        }

        public async Task<Order> UpdateAsync(Order order)
        {
            order.UpdatedAt = DateTime.UtcNow;
            _dbContext.Orders.Update(order);
            await _dbContext.SaveChangesAsync();
            return order;
        }
    }
}

