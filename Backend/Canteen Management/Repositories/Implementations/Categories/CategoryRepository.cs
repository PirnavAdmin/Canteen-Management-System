using System.Data;
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
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                var counts = await connection.QueryFirstOrDefaultAsync<dynamic>(
                    "sp_GetCategoryDependencyCounts",
                    new { p_CategoryId = categoryId },
                    commandType: CommandType.StoredProcedure);

                int linkedItems = (int)(counts?.LinkedItemCount ?? 0);
                int orders = (int)(counts?.HistoricalOrderCount ?? 0);
                return (linkedItems, orders);
            }
            catch
            {
                return (0, 0);
            }
        }

        public async Task<Dictionary<int, (int linkedItemCount, int historicalOrderCount)>> GetBatchDependencyCountsAsync(int institutionId)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                var rows = await connection.QueryAsync<dynamic>(
                    "sp_GetBatchCategoryDependencyCounts",
                    new { p_InstitutionId = institutionId },
                    commandType: CommandType.StoredProcedure);

                var result = new Dictionary<int, (int, int)>();
                foreach (var row in rows)
                {
                    int catId = (int)row.CategoryId;
                    int linked = (int)(row.LinkedItemCount ?? 0);
                    int orders = (int)(row.HistoricalOrderCount ?? 0);
                    result[catId] = (linked, orders);
                }
                return result;
            }
            catch
            {
                return new Dictionary<int, (int, int)>();
            }
        }
    }
}

