using CanteenManagement.API.Models.Categories;

namespace CanteenManagement.API.Repositories.Interfaces.Categories
{
    public interface ICategoryRepository
    {
        Task<IEnumerable<Category>> GetAllAsync(int campusId);
        Task<Category?> GetByIdAsync(int id, int campusId);
        Task<bool> ExistsByNameAsync(string name, int campusId, int? excludeId = null);
        Task<Category> CreateAsync(Category category);
        Task<Category> UpdateAsync(Category category);
        Task<bool> DeleteAsync(int id, int campusId);
        Task<(int linkedItemCount, int historicalOrderCount)> GetDependencyCountsAsync(int categoryId);
        Task<Dictionary<int, (int linkedItemCount, int historicalOrderCount)>> GetBatchDependencyCountsAsync(int campusId);
    }
}

