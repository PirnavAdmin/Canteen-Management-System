using CanteenManagement.API.Models.Settings;

namespace CanteenManagement.API.Repositories.Interfaces.Settings
{
    public interface ISettingsRepository
    {
        Task<SystemSetting?> GetSettingAsync(int institutionId, string category, string key);
        Task<SystemSetting> SaveSettingAsync(SystemSetting setting);
        Task<IEnumerable<DsarRequest>> GetDsarRequestsAsync(int institutionId);
        Task<DsarRequest?> GetDsarRequestByIdAsync(string id, int institutionId);
        Task<DsarRequest> CreateDsarRequestAsync(DsarRequest request);
        Task<DsarRequest> UpdateDsarRequestAsync(DsarRequest request);
    }
}
