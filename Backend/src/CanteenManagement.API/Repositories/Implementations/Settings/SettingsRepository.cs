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

        public async Task<SystemSetting?> GetSettingAsync(int institutionId, string category, string key)
        {
            return await _dbContext.SystemSettings
                .FirstOrDefaultAsync(s => s.InstitutionId == institutionId && s.Category == category && s.SettingKey == key);
        }

        public async Task<SystemSetting> SaveSettingAsync(SystemSetting setting)
        {
            var existing = await GetSettingAsync(setting.InstitutionId, setting.Category, setting.SettingKey);
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

        public async Task<IEnumerable<DsarRequest>> GetDsarRequestsAsync(int institutionId)
        {
            return await _dbContext.DsarRequests
                .Where(r => r.InstitutionId == institutionId)
                .OrderByDescending(r => r.RequestedAt)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<DsarRequest?> GetDsarRequestByIdAsync(string id, int institutionId)
        {
            return await _dbContext.DsarRequests
                .FirstOrDefaultAsync(r => r.RequestId == id && r.InstitutionId == institutionId);
        }

        public async Task<DsarRequest> CreateDsarRequestAsync(DsarRequest request)
        {
            await _dbContext.DsarRequests.AddAsync(request);
            await _dbContext.SaveChangesAsync();
            return request;
        }

        public async Task<DsarRequest> UpdateDsarRequestAsync(DsarRequest request)
        {
            _dbContext.DsarRequests.Update(request);
            await _dbContext.SaveChangesAsync();
            return request;
        }
    }
}
