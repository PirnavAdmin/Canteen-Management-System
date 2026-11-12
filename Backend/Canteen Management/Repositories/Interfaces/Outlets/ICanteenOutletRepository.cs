using CanteenManagement.API.DTOs.Outlets;
using CanteenManagement.API.Models.Outlets;

namespace CanteenManagement.API.Repositories.Interfaces.Outlets
{
    public interface ICanteenOutletRepository
    {
        Task<IEnumerable<CanteenOutlet>> GetAllAsync(int institutionId, string? status = null, string? search = null);
        Task<CanteenOutlet?> GetByIdAsync(int outletId, int institutionId);
        Task<CanteenOutlet?> GetByCodeAsync(string code, int institutionId);
        Task<bool> ExistsByCodeAsync(string code, int institutionId, int? excludeOutletId = null);
        Task<CanteenOutlet> CreateAsync(CanteenOutlet outlet);
        Task<bool> UpdateAsync(CanteenOutlet outlet);
        Task<bool> DeleteAsync(int outletId, int institutionId);
        Task<CanteenOutletStatsDto> GetStatsAsync(int institutionId);
        Task<CanteenOutletSetting?> GetSettingsAsync(int outletId);
        Task<bool> UpdateSettingsAsync(CanteenOutletSetting settings);
    }
}

