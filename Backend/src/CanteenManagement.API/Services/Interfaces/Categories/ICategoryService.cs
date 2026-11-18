using CanteenManagement.API.DTOs.Categories;

namespace CanteenManagement.API.Services.Interfaces.Categories
{
    public interface ICategoryService
    {
        Task<IEnumerable<CategoryDto>> GetAllAsync(int campusId);
        Task<CategoryDto?> GetByIdAsync(int id, int campusId);
        Task<CategoryDto> CreateAsync(CreateCategoryDto dto, int campusId, string performedBy);
        Task<CategoryDto> UpdateAsync(int id, UpdateCategoryDto dto, int campusId, string performedBy);
        Task<CategoryDto> ToggleStatusAsync(int id, int campusId, string performedBy);
        Task<(bool success, bool blockedByPolicy, string? message)> DeleteAsync(int id, int campusId, string performedBy);
    }
}

