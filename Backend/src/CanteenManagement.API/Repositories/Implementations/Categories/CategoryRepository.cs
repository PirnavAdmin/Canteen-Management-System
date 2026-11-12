using CanteenManagement.API.Data;
using CanteenManagement.API.Models.Categories;
using CanteenManagement.API.Repositories.Interfaces.Categories;
using Dapper;
using Microsoft.EntityFrameworkCore;

namespace CanteenManagement.API.Repositories.Implementations.Categories
{
    public class CategoryRepository : ICategoryRepository
    {
        private readonly AppDbContext _dbContext;
        private readonly IDbConnectionFactory _connectionFactory;

        public CategoryRepository(AppDbContext dbContext, IDbConnectionFactory connectionFactory)
        {
            _dbContext = dbContext;
            _connectionFactory = connectionFactory;
        }

        public async Task<IEnumerable<Category>> GetAllAsync(int institutionId)
        {
            return await _dbContext.Categories
                .Where(c => c.InstitutionId == institutionId)
                .OrderBy(c => c.DisplayOrder)
                .ThenBy(c => c.Name)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Category?> GetByIdAsync(int id, int institutionId)
        {
            return await _dbContext.Categories
                .FirstOrDefaultAsync(c => c.CategoryId == id && c.InstitutionId == institutionId);
        }

        public async Task<bool> ExistsByNameAsync(string name, int institutionId, int? excludeId = null)
        {
            var query = _dbContext.Categories
                .Where(c => c.InstitutionId == institutionId && c.Name.ToLower() == name.Trim().ToLower());

            if (excludeId.HasValue)
            {
                query = query.Where(c => c.CategoryId != excludeId.Value);
            }

            return await query.AnyAsync();
        }

        public async Task<Category> CreateAsync(Category category)
        {
            await _dbContext.Categories.AddAsync(category);
            await _dbContext.SaveChangesAsync();
            return category;
        }

        public async Task<Category> UpdateAsync(Category category)
        {
            category.UpdatedAt = DateTime.UtcNow;
            _dbContext.Categories.Update(category);
            await _dbContext.SaveChangesAsync();
            return category;
        }

        public async Task<bool> DeleteAsync(int id, int institutionId)
        {
            var category = await GetByIdAsync(id, institutionId);
            if (category == null) return false;

            _dbContext.Categories.Remove(category);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<(int linkedItemCount, int historicalOrderCount)> GetDependencyCountsAsync(int categoryId)
        {
            using var connection = _connectionFactory.CreateConnection();
            const string sql = @"
                SELECT 
                    (SELECT COUNT(1) FROM MenuItems WHERE CategoryId = @CategoryId) AS LinkedItemCount,
                    (SELECT COUNT(1) FROM OrderItems oi 
                     INNER JOIN MenuItems mi ON oi.MenuItemId = mi.MenuItemId 
                     WHERE mi.CategoryId = @CategoryId) AS HistoricalOrderCount;";

            var counts = await connection.QueryFirstOrDefaultAsync<dynamic>(sql, new { CategoryId = categoryId });
            int linkedItems = (int)(counts?.LinkedItemCount ?? 0);
            int orders = (int)(counts?.HistoricalOrderCount ?? 0);
            return (linkedItems, orders);
        }
    }
}

