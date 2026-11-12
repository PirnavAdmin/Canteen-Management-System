using CanteenManagement.API.DTOs.Menu;

namespace CanteenManagement.API.Services.Interfaces.Menu
{
    public interface IMenuService
    {
        Task<IEnumerable<MenuItemDto>> GetAllAsync(int institutionId, MenuItemFilterDto? filter = null);
        Task<MenuItemDto?> GetByIdAsync(int id, int institutionId);
        Task<MenuItemDto> CreateAsync(CreateMenuItemDto dto, int institutionId, string performedBy);
        Task<MenuItemDto> UpdateAsync(int id, UpdateMenuItemDto dto, int institutionId, string performedBy);
        Task<MenuItemDto> ToggleStatusAsync(int id, int institutionId, string performedBy);
        Task<MenuItemDto> TogglePublishAsync(int id, int institutionId, string performedBy);
        Task<(bool success, bool blockedByPolicy, string? message)> DeleteAsync(int id, int institutionId, string performedBy);
    }
}
