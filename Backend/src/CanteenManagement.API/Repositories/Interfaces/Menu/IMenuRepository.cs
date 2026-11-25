using CanteenManagement.API.DTOs.Menu;
using CanteenManagement.API.Models.Menu;

namespace CanteenManagement.API.Repositories.Interfaces.Menu
{
    public interface IMenuRepository
    {
        Task<IEnumerable<MenuItem>> GetAllAsync(int campusId, MenuItemFilterDto? filter = null);
        Task<MenuItem?> GetByIdAsync(int id, int campusId);
        Task<bool> ExistsByCodeAsync(string code, int campusId, int? excludeId = null);
        Task<MenuItem> CreateAsync(MenuItem item);
        Task<MenuItem> UpdateAsync(MenuItem item);
        Task<bool> DeleteAsync(int id, int campusId);
        Task<int> GetHistoricalOrderCountAsync(int menuItemId);
        Task<bool> DeductCapacityAsync(int menuItemId, int quantity);
        Task<bool> RestoreCapacityAsync(int menuItemId, int quantity);
        Task<int> ResetDailyCapacityAsync(int campusId, bool force = false);
    }
}

