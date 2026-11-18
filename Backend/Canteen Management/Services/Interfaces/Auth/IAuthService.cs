using CanteenManagement.API.DTOs.Auth;
using CanteenManagement.API.Helpers;

namespace CanteenManagement.API.Services.Interfaces.Auth
{
    public interface IAuthService
    {
        Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginRequestDto dto, int institutionId, string? ipAddress = null);
        Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterRequestDto dto, string? ipAddress = null);
        Task<ApiResponse<UserDto>> GetCurrentUserAsync(int userId);
    }
}

