using CanteenManagement.API.DTOs.Categories;
using CanteenManagement.API.Models.Categories;
using CanteenManagement.API.Repositories.Interfaces.Categories;
using CanteenManagement.API.Services.Interfaces.Categories;
using CanteenManagement.API.Services.Interfaces.Common;

namespace CanteenManagement.API.Services.Implementations.Categories
{
    public class CategoryService : ICategoryService
    {
        private readonly ICategoryRepository _repository;
        private readonly IAuditLoggingService _auditService;

        public CategoryService(ICategoryRepository repository, IAuditLoggingService auditService)
        {
            _repository = repository;
            _auditService = auditService;
        }

        public async Task<IEnumerable<CategoryDto>> GetAllAsync(int institutionId)
        {
            var categories = await _repository.GetAllAsync(institutionId);
            var countsMap = await _repository.GetBatchDependencyCountsAsync(institutionId);
            var result = new List<CategoryDto>();

            foreach (var cat in categories)
            {
                var counts = countsMap.GetValueOrDefault(cat.CategoryId, (0, 0));
                result.Add(MapToDto(cat, counts.Item1, counts.Item2));
            }

            return result;
        }

        public async Task<CategoryDto?> GetByIdAsync(int id, int institutionId)
        {
            var cat = await _repository.GetByIdAsync(id, institutionId);
            if (cat == null) return null;

            var (linkedItems, orders) = await _repository.GetDependencyCountsAsync(cat.CategoryId);
            return MapToDto(cat, linkedItems, orders);
        }

        public async Task<CategoryDto> CreateAsync(CreateCategoryDto dto, int institutionId, string performedBy)
        {
            if (await _repository.ExistsByNameAsync(dto.Name, institutionId))
            {
                throw new InvalidOperationException($"Category '{dto.Name}' already exists.");
            }

            var category = new Category
            {
                InstitutionId = institutionId,
                Name = dto.Name.Trim(),
                Description = dto.Description?.Trim(),
                DisplayOrder = dto.DisplayOrder,
                Status = dto.Status,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _repository.CreateAsync(category);

            await _auditService.LogActionAsync(
                institutionId,
                null,
                performedBy,
                "CREATE_CATEGORY",
                "Category",
                created.CategoryId.ToString(),
                $"Created food category '{created.Name}' with order {created.DisplayOrder}."
            );

            return MapToDto(created, 0, 0);
        }

        public async Task<CategoryDto> UpdateAsync(int id, UpdateCategoryDto dto, int institutionId, string performedBy)
        {
            var category = await _repository.GetByIdAsync(id, institutionId);
            if (category == null)
            {
                throw new KeyNotFoundException($"Category with ID {id} was not found.");
            }

            if (await _repository.ExistsByNameAsync(dto.Name, institutionId, id))
            {
                throw new InvalidOperationException($"Another category named '{dto.Name}' already exists.");
            }

            category.Name = dto.Name.Trim();
            category.Description = dto.Description?.Trim();
            category.DisplayOrder = dto.DisplayOrder;
            category.Status = dto.Status;

            var updated = await _repository.UpdateAsync(category);

            await _auditService.LogActionAsync(
                institutionId,
                null,
                performedBy,
                "UPDATE_CATEGORY",
                "Category",
                updated.CategoryId.ToString(),
                $"Updated category '{updated.Name}' details."
            );

            var (linkedItems, orders) = await _repository.GetDependencyCountsAsync(updated.CategoryId);
            return MapToDto(updated, linkedItems, orders);
        }

        public async Task<CategoryDto> ToggleStatusAsync(int id, int institutionId, string performedBy)
        {
            var category = await _repository.GetByIdAsync(id, institutionId);
            if (category == null)
            {
                throw new KeyNotFoundException($"Category with ID {id} was not found.");
            }

            category.Status = category.Status == "Active" ? "Inactive" : "Active";
            var updated = await _repository.UpdateAsync(category);

            await _auditService.LogActionAsync(
                institutionId,
                null,
                performedBy,
                "TOGGLE_CATEGORY_STATUS",
                "Category",
                updated.CategoryId.ToString(),
                $"Toggled status to '{updated.Status}' for category '{updated.Name}'."
            );

            var (linkedItems, orders) = await _repository.GetDependencyCountsAsync(updated.CategoryId);
            return MapToDto(updated, linkedItems, orders);
        }

        public async Task<(bool success, bool blockedByPolicy, string? message)> DeleteAsync(int id, int institutionId, string performedBy)
        {
            var category = await _repository.GetByIdAsync(id, institutionId);
            if (category == null)
            {
                return (false, false, $"Category with ID {id} was not found.");
            }

            // SRS Section 3.2 Enforcement: Prevent deletion where historical records depend on it
            var (linkedItems, orders) = await _repository.GetDependencyCountsAsync(id);
            if (linkedItems > 0 || orders > 0)
            {
                return (false, true, $"Institutional Policy Violation (SRS §3.2): Category '{category.Name}' cannot be deleted because {linkedItems} menu items and {orders} historical order records depend on it. Please deactivate the category instead.");
            }

            var deleted = await _repository.DeleteAsync(id, institutionId);
            if (deleted)
            {
                await _auditService.LogActionAsync(
                    institutionId,
                    null,
                    performedBy,
                    "DELETE_CATEGORY",
                    "Category",
                    id.ToString(),
                    $"Deleted category '{category.Name}'."
                );
            }

            return (deleted, false, null);
        }

        private static CategoryDto MapToDto(Category c, int linkedItems, int orders) => new()
        {
            Id = c.CategoryId,
            InstitutionId = c.InstitutionId,
            Name = c.Name,
            Description = c.Description,
            DisplayOrder = c.DisplayOrder,
            Status = c.Status,
            LinkedItemCount = linkedItems,
            HistoricalOrderCount = orders,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt
        };
    }
}

