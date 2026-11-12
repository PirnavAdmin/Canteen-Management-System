using CanteenManagement.API.Models.Categories;

namespace CanteenManagement.API.Repositories.Interfaces.Categories
{
    public interface ICategoryRepository
    {
        Task<IEnumerable<Category>> GetAllAsync(int institutionId);
        Task<Category?> GetByIdAsync(int id, int institutionId);
        Task<bool> ExistsByNameAsync(string name, int institutionId, int? excludeId = null);
        Task<Category> CreateAsync(Category category);
        Task<Category> UpdateAsync(Category category);
        Task<bool> DeleteAsync(int id, int institutionId);
        Task<(int linkedItemCount, int historicalOrderCount)> GetDependencyCountsAsync(int categoryId);
    }
}

