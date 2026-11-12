using System.Text.Json;
using CanteenManagement.API.DTOs.Menu;
using CanteenManagement.API.Models.Menu;
using CanteenManagement.API.Repositories.Interfaces.Menu;
using CanteenManagement.API.Services.Interfaces.Common;
using CanteenManagement.API.Services.Interfaces.Menu;

namespace CanteenManagement.API.Services.Implementations.Menu
{
    public class MenuService : IMenuService
    {
        private readonly IMenuRepository _repository;
        private readonly IAuditLoggingService _auditService;

        public MenuService(IMenuRepository repository, IAuditLoggingService auditService)
        {
            _repository = repository;
            _auditService = auditService;
        }

        public async Task<IEnumerable<MenuItemDto>> GetAllAsync(int institutionId, MenuItemFilterDto? filter = null)
        {
            var items = await _repository.GetAllAsync(institutionId, filter);
            return items.Select(MapToDto).ToList();
        }

        public async Task<MenuItemDto?> GetByIdAsync(int id, int institutionId)
        {
            var item = await _repository.GetByIdAsync(id, institutionId);
            return item == null ? null : MapToDto(item);
        }

        public async Task<MenuItemDto> CreateAsync(CreateMenuItemDto dto, int institutionId, string performedBy)
        {
            if (await _repository.ExistsByCodeAsync(dto.Code, institutionId))
            {
                throw new InvalidOperationException($"Item code '{dto.Code}' already exists in menu registry.");
            }

            var item = new MenuItem
            {
                InstitutionId = institutionId,
                OutletId = dto.OutletId,
                CategoryId = dto.CategoryId,
                Code = dto.Code.Trim().ToUpper(),
                Name = dto.Name.Trim(),
                Description = dto.Description?.Trim(),
                FoodType = dto.FoodType,
                Price = dto.Price,
                DailyCapacity = dto.DailyCapacity,
                RemainingCapacity = dto.DailyCapacity,
                Availability = dto.Availability ?? "Available",
                Status = dto.Status ?? "Active",
                PublicationStatus = dto.PublicationStatus ?? "Published",
                ServingSize = dto.ServingSize,
                Calories = dto.Calories,
                ImageUrl = dto.ImageUrl,
                AllergensJson = dto.Allergens != null ? JsonSerializer.Serialize(dto.Allergens) : "[]",
                WorkingDaysJson = dto.WorkingDays != null ? JsonSerializer.Serialize(dto.WorkingDays) : "[]",
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                CreatedAt = DateTime.UtcNow
            };

            if (dto.Variants != null)
            {
                foreach (var v in dto.Variants)
                {
                    item.Variants.Add(new MenuItemVariant { Name = v.Name, Price = v.Price });
                }
            }

            if (dto.AddOns != null)
            {
                foreach (var a in dto.AddOns)
                {
                    item.AddOns.Add(new MenuItemAddon { Name = a.Name, Price = a.Price });
                }
            }

            var created = await _repository.CreateAsync(item);

            await _auditService.LogActionAsync(
                institutionId,
                null,
                performedBy,
                "CREATE_MENU_ITEM",
                "MenuItem",
                created.MenuItemId.ToString(),
                $"Created menu item '{created.Name}' ({created.Code}) at price {created.Price}."
            );

            // Fetch with eager loaded navigations
            var loaded = await _repository.GetByIdAsync(created.MenuItemId, institutionId);
            return MapToDto(loaded ?? created);
        }

        public async Task<MenuItemDto> UpdateAsync(int id, UpdateMenuItemDto dto, int institutionId, string performedBy)
        {
            var item = await _repository.GetByIdAsync(id, institutionId);
            if (item == null)
            {
                throw new KeyNotFoundException($"Menu item with ID {id} was not found.");
            }

            if (await _repository.ExistsByCodeAsync(dto.Code, institutionId, id))
            {
                throw new InvalidOperationException($"Another menu item with code '{dto.Code}' already exists.");
            }

            item.OutletId = dto.OutletId;
            item.CategoryId = dto.CategoryId;
            item.Code = dto.Code.Trim().ToUpper();
            item.Name = dto.Name.Trim();
            item.Description = dto.Description?.Trim();
            item.FoodType = dto.FoodType;
            item.Price = dto.Price;
            item.DailyCapacity = dto.DailyCapacity;
            item.Availability = dto.Availability ?? item.Availability;
            item.Status = dto.Status ?? item.Status;
            item.PublicationStatus = dto.PublicationStatus ?? item.PublicationStatus;
            item.ServingSize = dto.ServingSize;
            item.Calories = dto.Calories;
            item.ImageUrl = dto.ImageUrl;
            item.AllergensJson = dto.Allergens != null ? JsonSerializer.Serialize(dto.Allergens) : item.AllergensJson;
            item.WorkingDaysJson = dto.WorkingDays != null ? JsonSerializer.Serialize(dto.WorkingDays) : item.WorkingDaysJson;
            item.StartTime = dto.StartTime;
            item.EndTime = dto.EndTime;

            // Update variants & addons
            item.Variants.Clear();
            if (dto.Variants != null)
            {
                foreach (var v in dto.Variants)
                {
                    item.Variants.Add(new MenuItemVariant { Name = v.Name, Price = v.Price });
                }
            }

            item.AddOns.Clear();
            if (dto.AddOns != null)
            {
                foreach (var a in dto.AddOns)
                {
                    item.AddOns.Add(new MenuItemAddon { Name = a.Name, Price = a.Price });
                }
            }

            var updated = await _repository.UpdateAsync(item);

            await _auditService.LogActionAsync(
                institutionId,
                null,
                performedBy,
                "UPDATE_MENU_ITEM",
                "MenuItem",
                updated.MenuItemId.ToString(),
                $"Updated menu item '{updated.Name}' ({updated.Code})."
            );

            var loaded = await _repository.GetByIdAsync(updated.MenuItemId, institutionId);
            return MapToDto(loaded ?? updated);
        }

        public async Task<MenuItemDto> ToggleStatusAsync(int id, int institutionId, string performedBy)
        {
            var item = await _repository.GetByIdAsync(id, institutionId);
            if (item == null)
            {
                throw new KeyNotFoundException($"Menu item with ID {id} was not found.");
            }

            item.Status = item.Status == "Active" ? "Inactive" : "Active";
            item.Availability = item.Status == "Active" ? "Available" : "Unavailable";

            var updated = await _repository.UpdateAsync(item);

            await _auditService.LogActionAsync(
                institutionId,
                null,
                performedBy,
                "TOGGLE_MENU_STATUS",
                "MenuItem",
                updated.MenuItemId.ToString(),
                $"Toggled status to '{updated.Status}' for menu item '{updated.Name}'."
            );

            return MapToDto(updated);
        }

        public async Task<MenuItemDto> TogglePublishAsync(int id, int institutionId, string performedBy)
        {
            var item = await _repository.GetByIdAsync(id, institutionId);
            if (item == null)
            {
                throw new KeyNotFoundException($"Menu item with ID {id} was not found.");
            }

            item.PublicationStatus = item.PublicationStatus == "Published" ? "Draft" : "Published";

            var updated = await _repository.UpdateAsync(item);

            await _auditService.LogActionAsync(
                institutionId,
                null,
                performedBy,
                "TOGGLE_MENU_PUBLISH",
                "MenuItem",
                updated.MenuItemId.ToString(),
                $"Toggled publication status to '{updated.PublicationStatus}' for menu item '{updated.Name}'."
            );

            return MapToDto(updated);
        }

        public async Task<(bool success, bool blockedByPolicy, string? message)> DeleteAsync(int id, int institutionId, string performedBy)
        {
            var item = await _repository.GetByIdAsync(id, institutionId);
            if (item == null)
            {
                return (false, false, $"Menu item with ID {id} was not found.");
            }

            var orderCount = await _repository.GetHistoricalOrderCountAsync(id);
            if (orderCount > 0)
            {
                return (false, true, $"Institutional Policy Violation: Menu item '{item.Name}' ({item.Code}) has {orderCount} historical student/faculty orders and cannot be permanently deleted. Please mark as 'Inactive' or 'Draft' instead.");
            }

            var deleted = await _repository.DeleteAsync(id, institutionId);
            if (deleted)
            {
                await _auditService.LogActionAsync(
                    institutionId,
                    null,
                    performedBy,
                    "DELETE_MENU_ITEM",
                    "MenuItem",
                    id.ToString(),
                    $"Deleted menu item '{item.Name}' ({item.Code})."
                );
            }

            return (deleted, false, null);
        }

        private static MenuItemDto MapToDto(MenuItem m) => new()
        {
            Id = m.MenuItemId,
            Code = m.Code,
            Name = m.Name,
            Description = m.Description,
            CategoryId = m.CategoryId,
            Category = m.Category?.Name ?? string.Empty,
            OutletId = m.OutletId,
            OutletName = m.Outlet?.Name ?? string.Empty,
            FoodType = m.FoodType,
            Price = m.Price,
            DailyCapacity = m.DailyCapacity,
            RemainingCapacity = m.RemainingCapacity,
            Availability = m.Availability,
            Status = m.Status,
            PublicationStatus = m.PublicationStatus,
            ServingSize = m.ServingSize,
            Calories = m.Calories,
            ImageUrl = m.ImageUrl,
            Allergens = !string.IsNullOrWhiteSpace(m.AllergensJson)
                ? (JsonSerializer.Deserialize<List<string>>(m.AllergensJson) ?? new())
                : new(),
            WorkingDays = !string.IsNullOrWhiteSpace(m.WorkingDaysJson)
                ? (JsonSerializer.Deserialize<List<string>>(m.WorkingDaysJson) ?? new())
                : new(),
            StartTime = m.StartTime,
            EndTime = m.EndTime,
            HistoricalOrderCount = m.HistoricalOrderCount,
            Variants = m.Variants.Select(v => new MenuItemVariantDto { Id = v.VariantId, Name = v.Name, Price = v.Price }).ToList(),
            AddOns = m.AddOns.Select(a => new MenuItemAddonDto { Id = a.AddonId, Name = a.Name, Price = a.Price }).ToList(),
            CreatedAt = m.CreatedAt,
            UpdatedAt = m.UpdatedAt
        };
    }
}
