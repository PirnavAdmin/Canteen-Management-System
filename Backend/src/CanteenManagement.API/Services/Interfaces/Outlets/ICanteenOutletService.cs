using CanteenManagement.API.DTOs.Outlets;
using CanteenManagement.API.Helpers;

namespace CanteenManagement.API.Services.Interfaces.Outlets
{
    public interface ICanteenOutletService
    {
        Task<ApiResponse<IEnumerable<CanteenOutletDto>>> GetAllAsync(int institutionId, string? status = null, string? search = null);
        Task<ApiResponse<CanteenOutletDto>> GetByIdAsync(int outletId, int institutionId);
        Task<ApiResponse<CanteenOutletDto>> CreateAsync(int institutionId, CreateCanteenOutletDto dto, int userId, string userName);
        Task<ApiResponse<CanteenOutletDto>> UpdateAsync(int outletId, int institutionId, UpdateCanteenOutletDto dto, int userId, string userName);
        Task<ApiResponse<bool>> ToggleStatusAsync(int outletId, int institutionId, string status, int userId, string userName);
        Task<ApiResponse<bool>> DeleteAsync(int outletId, int institutionId, int userId, string userName);
        Task<ApiResponse<CanteenOutletStatsDto>> GetStatsAsync(int institutionId);
        Task<ApiResponse<CanteenOutletSettingDto>> GetSettingsAsync(int outletId, int institutionId);
        Task<ApiResponse<CanteenOutletSettingDto>> UpdateSettingsAsync(int outletId, int institutionId, UpdateOutletSettingsDto dto, int userId, string userName);
    }
}

