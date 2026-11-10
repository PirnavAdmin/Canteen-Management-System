using CanteenManagement.API.DTOs.CanteenCategory;
using CanteenManagement.API.Models;

namespace CanteenManagement.API.Repositories.Interfaces
{
    public interface ICanteenCategoryRepository
    {
        Task<IEnumerable<CanteenCategoryResponseDto>> GetAllAsync(int institutionId, bool? isActive = null);
        Task<CanteenCategoryResponseDto?> GetByIdAsync(int categoryId, int institutionId);
        Task<int> CreateAsync(int institutionId, CreateCanteenCategoryDto dto);
        Task<bool> UpdateAsync(int categoryId, int institutionId, UpdateCanteenCategoryDto dto);
        Task<bool> ToggleStatusAsync(int categoryId, int institutionId, bool isActive);
        Task<bool> ExistsByNameAsync(int institutionId, string name, int? excludeCategoryId = null);
        Task<CanteenCategoryStatsDto> GetStatsAsync(int institutionId);
        Task<int> GetNextDisplayOrderAsync(int institutionId);
        Task<IEnumerable<CanteenCategoryLookupDto>> GetLookupAsync(int institutionId);
    }
}
