using CanteenManagement.API.DTOs.Outlets;
using CanteenManagement.API.Models.Outlets;

namespace CanteenManagement.API.Repositories.Interfaces.Outlets
{
    public interface ICanteenOutletRepository
    {
        Task<IEnumerable<CanteenOutlet>> GetAllAsync(int campusId, string? status = null, string? search = null);
        Task<CanteenOutlet?> GetByIdAsync(int outletId, int campusId);
        Task<CanteenOutlet?> GetByCodeAsync(string code, int campusId);
        Task<bool> ExistsByCodeAsync(string code, int campusId, int? excludeOutletId = null);
        Task<CanteenOutlet> CreateAsync(CanteenOutlet outlet);
        Task<bool> UpdateAsync(CanteenOutlet outlet);
        Task<bool> DeleteAsync(int outletId, int campusId);
        Task<CanteenOutletStatsDto> GetStatsAsync(int campusId);
        Task<CanteenOutletSetting?> GetSettingsAsync(int outletId);
        Task<bool> UpdateSettingsAsync(CanteenOutletSetting settings);
    }
}

