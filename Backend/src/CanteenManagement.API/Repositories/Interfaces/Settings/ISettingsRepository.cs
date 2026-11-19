using CanteenManagement.API.Models.Settings;

namespace CanteenManagement.API.Repositories.Interfaces.Settings
{
    public interface ISettingsRepository
    {
        Task<SystemSetting?> GetSettingAsync(int campusId, string category, string key);
        Task<SystemSetting> SaveSettingAsync(SystemSetting setting);
    }
}

