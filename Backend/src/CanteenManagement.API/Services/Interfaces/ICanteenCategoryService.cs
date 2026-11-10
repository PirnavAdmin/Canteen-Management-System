using CanteenManagement.API.DTOs.CanteenCategory;
using CanteenManagement.API.DTOs.Common;

namespace CanteenManagement.API.Services.Interfaces
{
    public interface ICanteenCategoryService
    {
        Task<ApiResponse<IEnumerable<CanteenCategoryResponseDto>>> GetAllAsync(int institutionId, bool? isActive = null);
        Task<ApiResponse<CanteenCategoryResponseDto>> GetByIdAsync(int categoryId, int institutionId);
        Task<ApiResponse<CanteenCategoryResponseDto>> CreateAsync(int institutionId, CreateCanteenCategoryDto dto);
        Task<ApiResponse<bool>> UpdateAsync(int categoryId, int institutionId, UpdateCanteenCategoryDto dto);
        Task<ApiResponse<bool>> ToggleStatusAsync(int categoryId, int institutionId, bool isActive);
        Task<ApiResponse<CanteenCategoryStatsDto>> GetStatsAsync(int institutionId);
        Task<ApiResponse<int>> GetNextDisplayOrderAsync(int institutionId);
        Task<ApiResponse<bool>> CheckNameExistsAsync(int institutionId, string name, int? excludeCategoryId = null);
        Task<ApiResponse<IEnumerable<CanteenCategoryLookupDto>>> GetLookupAsync(int institutionId);
    }
}
