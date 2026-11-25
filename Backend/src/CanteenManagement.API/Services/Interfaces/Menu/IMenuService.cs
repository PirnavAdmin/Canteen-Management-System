using CanteenManagement.API.DTOs.Menu;

namespace CanteenManagement.API.Services.Interfaces.Menu
{
    public interface IMenuService
    {
        Task<IEnumerable<MenuItemDto>> GetAllAsync(int campusId, MenuItemFilterDto? filter = null);
        Task<MenuItemDto?> GetByIdAsync(int id, int campusId);
        Task<MenuItemDto> CreateAsync(CreateMenuItemDto dto, int campusId, string performedBy);
        Task<MenuItemDto> UpdateAsync(int id, UpdateMenuItemDto dto, int campusId, string performedBy);
        Task<MenuItemDto> ToggleStatusAsync(int id, int campusId, string performedBy);
        Task<MenuItemDto> TogglePublishAsync(int id, int campusId, string performedBy);
        Task<(bool success, bool blockedByPolicy, string? message)> DeleteAsync(int id, int campusId, string performedBy);
        Task<int> ResetDailyCapacityAsync(int campusId, string performedBy, bool force = false);
    }
}

