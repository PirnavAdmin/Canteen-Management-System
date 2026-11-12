using CanteenManagement.API.DTOs.Categories;

namespace CanteenManagement.API.Services.Interfaces.Categories
{
    public interface ICategoryService
    {
        Task<IEnumerable<CategoryDto>> GetAllAsync(int institutionId);
        Task<CategoryDto?> GetByIdAsync(int id, int institutionId);
        Task<CategoryDto> CreateAsync(CreateCategoryDto dto, int institutionId, string performedBy);
        Task<CategoryDto> UpdateAsync(int id, UpdateCategoryDto dto, int institutionId, string performedBy);
        Task<CategoryDto> ToggleStatusAsync(int id, int institutionId, string performedBy);
        Task<(bool success, bool blockedByPolicy, string? message)> DeleteAsync(int id, int institutionId, string performedBy);
    }
}

