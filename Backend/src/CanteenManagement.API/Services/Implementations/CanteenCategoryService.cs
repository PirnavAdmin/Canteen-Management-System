using CanteenManagement.API.DTOs.CanteenCategory;
using CanteenManagement.API.DTOs.Common;
using CanteenManagement.API.Repositories.Interfaces;
using CanteenManagement.API.Services.Interfaces;

namespace CanteenManagement.API.Services.Implementations
{
    public class CanteenCategoryService : ICanteenCategoryService
    {
        private readonly ICanteenCategoryRepository _repository;
        private readonly ILogger<CanteenCategoryService> _logger;

        public CanteenCategoryService(
            ICanteenCategoryRepository repository,
            ILogger<CanteenCategoryService> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        public async Task<ApiResponse<IEnumerable<CanteenCategoryResponseDto>>> GetAllAsync(int institutionId, bool? isActive = null)
        {
            try
            {
                var categories = await _repository.GetAllAsync(institutionId, isActive);
                return ApiResponse<IEnumerable<CanteenCategoryResponseDto>>.Ok(categories, "Categories retrieved successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving categories for InstitutionId {InstitutionId}", institutionId);
                return ApiResponse<IEnumerable<CanteenCategoryResponseDto>>.Fail("Failed to retrieve categories.");
            }
        }

        public async Task<ApiResponse<CanteenCategoryResponseDto>> GetByIdAsync(int categoryId, int institutionId)
        {
            try
            {
                var category = await _repository.GetByIdAsync(categoryId, institutionId);
                if (category == null)
                {
                    return ApiResponse<CanteenCategoryResponseDto>.Fail("Category not found.");
                }

                return ApiResponse<CanteenCategoryResponseDto>.Ok(category, "Category retrieved successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving category {CategoryId} for InstitutionId {InstitutionId}", categoryId, institutionId);
                return ApiResponse<CanteenCategoryResponseDto>.Fail("Failed to retrieve category details.");
            }
        }

        public async Task<ApiResponse<CanteenCategoryResponseDto>> CreateAsync(int institutionId, CreateCanteenCategoryDto dto)
        {
            try
            {
                var exists = await _repository.ExistsByNameAsync(institutionId, dto.Name);
                if (exists)
                {
                    return ApiResponse<CanteenCategoryResponseDto>.Fail($"A category named '{dto.Name}' already exists.");
                }

                var newId = await _repository.CreateAsync(institutionId, dto);
                if (newId <= 0)
                {
                    return ApiResponse<CanteenCategoryResponseDto>.Fail("Failed to create category.");
                }

                var created = await _repository.GetByIdAsync(newId, institutionId);
                return ApiResponse<CanteenCategoryResponseDto>.Ok(created!, "Category created successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating category for InstitutionId {InstitutionId}", institutionId);
                return ApiResponse<CanteenCategoryResponseDto>.Fail("An error occurred while creating the category.");
            }
        }

        public async Task<ApiResponse<bool>> UpdateAsync(int categoryId, int institutionId, UpdateCanteenCategoryDto dto)
        {
            try
            {
                var existing = await _repository.GetByIdAsync(categoryId, institutionId);
                if (existing == null)
                {
                    return ApiResponse<bool>.Fail("Category not found.");
                }

                var exists = await _repository.ExistsByNameAsync(institutionId, dto.Name, categoryId);
                if (exists)
                {
                    return ApiResponse<bool>.Fail($"Another category named '{dto.Name}' already exists.");
                }

                var updated = await _repository.UpdateAsync(categoryId, institutionId, dto);
                if (!updated)
                {
                    return ApiResponse<bool>.Fail("Category could not be updated.");
                }

                return ApiResponse<bool>.Ok(true, "Category updated successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating category {CategoryId} for InstitutionId {InstitutionId}", categoryId, institutionId);
                return ApiResponse<bool>.Fail("An error occurred while updating the category.");
            }
        }

        public async Task<ApiResponse<bool>> ToggleStatusAsync(int categoryId, int institutionId, bool isActive)
        {
            try
            {
                var existing = await _repository.GetByIdAsync(categoryId, institutionId);
                if (existing == null)
                {
                    return ApiResponse<bool>.Fail("Category not found.");
                }

                var updated = await _repository.ToggleStatusAsync(categoryId, institutionId, isActive);
                if (!updated)
                {
                    return ApiResponse<bool>.Fail("Category status could not be changed.");
                }

                var statusText = isActive ? "activated" : "deactivated";
                return ApiResponse<bool>.Ok(true, $"Category {statusText} successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling status for category {CategoryId}", categoryId);
                return ApiResponse<bool>.Fail("An error occurred while updating category status.");
            }
        }
    }
}
