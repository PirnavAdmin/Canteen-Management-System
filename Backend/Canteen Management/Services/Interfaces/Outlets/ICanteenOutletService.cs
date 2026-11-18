using CanteenManagement.API.DTOs.Outlets;
using CanteenManagement.API.Helpers;

namespace CanteenManagement.API.Services.Interfaces.Outlets
{
    public interface ICanteenOutletService
    {
        Task<ApiResponse<IEnumerable<CanteenOutletDto>>> GetAllAsync(int campusId, string? status = null, string? search = null);
        Task<ApiResponse<CanteenOutletDto>> GetByIdAsync(int outletId, int campusId);
        Task<ApiResponse<CanteenOutletDto>> CreateAsync(int campusId, CreateCanteenOutletDto dto, int userId, string userName);
        Task<ApiResponse<CanteenOutletDto>> UpdateAsync(int outletId, int campusId, UpdateCanteenOutletDto dto, int userId, string userName);
        Task<ApiResponse<bool>> ToggleStatusAsync(int outletId, int campusId, string status, int userId, string userName);
        Task<ApiResponse<bool>> DeleteAsync(int outletId, int campusId, int userId, string userName);
        Task<ApiResponse<CanteenOutletStatsDto>> GetStatsAsync(int campusId);
        Task<ApiResponse<CanteenOutletSettingDto>> GetSettingsAsync(int outletId, int campusId);
        Task<ApiResponse<CanteenOutletSettingDto>> UpdateSettingsAsync(int outletId, int campusId, UpdateOutletSettingsDto dto, int userId, string userName);
    }
}

