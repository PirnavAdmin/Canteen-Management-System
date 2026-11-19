using CanteenManagement.API.Data;
using CanteenManagement.API.Models.Settings;
using CanteenManagement.API.Repositories.Interfaces.Settings;
using Microsoft.EntityFrameworkCore;

namespace CanteenManagement.API.Repositories.Implementations.Settings
{
    public class SettingsRepository : ISettingsRepository
    {
        private readonly AppDbContext _dbContext;

        public SettingsRepository(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<SystemSetting?> GetSettingAsync(int campusId, string category, string key)
        {
            return await _dbContext.SystemSettings
                .FirstOrDefaultAsync(s => s.CampusId == campusId && s.Category == category && s.SettingKey == key);
        }

        public async Task<SystemSetting> SaveSettingAsync(SystemSetting setting)
        {
            var existing = await GetSettingAsync(setting.CampusId, setting.Category, setting.SettingKey);
            if (existing == null)
            {
                await _dbContext.SystemSettings.AddAsync(setting);
            }
            else
            {
                existing.SettingValueJson = setting.SettingValueJson;
                existing.UpdatedAt = DateTime.UtcNow;
                _dbContext.SystemSettings.Update(existing);
                setting = existing;
            }

            await _dbContext.SaveChangesAsync();
            return setting;
        }
    }
}

