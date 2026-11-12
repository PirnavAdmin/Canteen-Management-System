using CanteenManagement.API.Data;
using CanteenManagement.API.DTOs.Menu;
using CanteenManagement.API.Models.Menu;
using CanteenManagement.API.Repositories.Interfaces.Menu;
using Dapper;
using Microsoft.EntityFrameworkCore;

namespace CanteenManagement.API.Repositories.Implementations.Menu
{
    public class MenuRepository : IMenuRepository
    {
        private readonly AppDbContext _dbContext;
        private readonly IDbConnectionFactory _connectionFactory;

        public MenuRepository(AppDbContext dbContext, IDbConnectionFactory connectionFactory)
        {
            _dbContext = dbContext;
            _connectionFactory = connectionFactory;
        }

        public async Task<IEnumerable<MenuItem>> GetAllAsync(int institutionId, MenuItemFilterDto? filter = null)
        {
            var query = _dbContext.MenuItems
                .Include(m => m.Category)
                .Include(m => m.Outlet)
                .Include(m => m.Variants)
                .Include(m => m.AddOns)
                .Where(m => m.InstitutionId == institutionId);

            if (filter != null)
            {
                if (filter.OutletId.HasValue && filter.OutletId.Value > 0)
                {
                    query = query.Where(m => m.OutletId == filter.OutletId.Value);
                }
                if (filter.CategoryId.HasValue && filter.CategoryId.Value > 0)
                {
                    query = query.Where(m => m.CategoryId == filter.CategoryId.Value);
                }
                if (!string.IsNullOrWhiteSpace(filter.FoodType) && filter.FoodType != "ALL")
                {
                    query = query.Where(m => m.FoodType == filter.FoodType);
                }
                if (!string.IsNullOrWhiteSpace(filter.Status) && filter.Status != "ALL")
                {
                    query = query.Where(m => m.Status == filter.Status);
                }
                if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
                {
                    var term = filter.SearchTerm.Trim().ToLower();
                    query = query.Where(m => m.Name.ToLower().Contains(term) || m.Code.ToLower().Contains(term));
                }
            }

            return await query.OrderBy(m => m.Code).AsNoTracking().ToListAsync();
        }

        public async Task<MenuItem?> GetByIdAsync(int id, int institutionId)
        {
            return await _dbContext.MenuItems
                .Include(m => m.Category)
                .Include(m => m.Outlet)
                .Include(m => m.Variants)
                .Include(m => m.AddOns)
                .FirstOrDefaultAsync(m => m.MenuItemId == id && m.InstitutionId == institutionId);
        }

        public async Task<bool> ExistsByCodeAsync(string code, int institutionId, int? excludeId = null)
        {
            var query = _dbContext.MenuItems
                .Where(m => m.InstitutionId == institutionId && m.Code.ToLower() == code.Trim().ToLower());

            if (excludeId.HasValue)
            {
                query = query.Where(m => m.MenuItemId != excludeId.Value);
            }

            return await query.AnyAsync();
        }

        public async Task<MenuItem> CreateAsync(MenuItem item)
        {
            await _dbContext.MenuItems.AddAsync(item);
            await _dbContext.SaveChangesAsync();
            return item;
        }

        public async Task<MenuItem> UpdateAsync(MenuItem item)
        {
            item.UpdatedAt = DateTime.UtcNow;
            _dbContext.MenuItems.Update(item);
            await _dbContext.SaveChangesAsync();
            return item;
        }

        public async Task<bool> DeleteAsync(int id, int institutionId)
        {
            var item = await GetByIdAsync(id, institutionId);
            if (item == null) return false;

            _dbContext.MenuItems.Remove(item);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<int> GetHistoricalOrderCountAsync(int menuItemId)
        {
            using var connection = _connectionFactory.CreateConnection();
            const string sql = "SELECT COUNT(1) FROM OrderItems WHERE MenuItemId = @MenuItemId;";
            return await connection.ExecuteScalarAsync<int>(sql, new { MenuItemId = menuItemId });
        }
    }
}
