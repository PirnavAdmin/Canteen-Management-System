using CanteenManagement.API.DTOs.Menu;
using CanteenManagement.API.Models.Menu;

namespace CanteenManagement.API.Repositories.Interfaces.Menu
{
    public interface IMenuRepository
    {
        Task<IEnumerable<MenuItem>> GetAllAsync(int institutionId, MenuItemFilterDto? filter = null);
        Task<MenuItem?> GetByIdAsync(int id, int institutionId);
        Task<bool> ExistsByCodeAsync(string code, int institutionId, int? excludeId = null);
        Task<MenuItem> CreateAsync(MenuItem item);
        Task<MenuItem> UpdateAsync(MenuItem item);
        Task<bool> DeleteAsync(int id, int institutionId);
        Task<int> GetHistoricalOrderCountAsync(int menuItemId);
    }
}

