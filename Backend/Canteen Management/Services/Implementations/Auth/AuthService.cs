using CanteenManagement.API.DTOs.Auth;
using CanteenManagement.API.Helpers;
using CanteenManagement.API.Models.Auth;
using CanteenManagement.API.Repositories.Interfaces.Auth;
using CanteenManagement.API.Services.Interfaces.Auth;
using CanteenManagement.API.Services.Interfaces.Common;

namespace CanteenManagement.API.Services.Implementations.Auth
{
    public class AuthService : IAuthService
    {
        private readonly IAuthRepository _repository;
        private readonly IJwtTokenHelper _jwtHelper;
        private readonly IAuditLoggingService _auditLogger;
        private readonly ILogger<AuthService> _logger;

        public AuthService(
            IAuthRepository repository,
            IJwtTokenHelper jwtHelper,
            IAuditLoggingService auditLogger,
            ILogger<AuthService> logger)
        {
            _repository = repository;
            _jwtHelper = jwtHelper;
            _auditLogger = auditLogger;
            _logger = logger;
        }

        public async Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginRequestDto dto, int institutionId, string? ipAddress = null)
        {
            if (string.IsNullOrWhiteSpace(dto.UsernameOrEmail) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return ApiResponse<AuthResponseDto>.Fail("Username/Email and Password are required.", statusCode: 400);
            }

            var user = await _repository.GetByUsernameOrEmailAsync(dto.UsernameOrEmail, institutionId);
            if (user == null || !PasswordHasher.VerifyPassword(dto.Password, user.PasswordHash))
            {
                return ApiResponse<AuthResponseDto>.Fail("Invalid credentials.", statusCode: 401);
            }

            if (!user.IsActive)
            {
                return ApiResponse<AuthResponseDto>.Fail("This account has been deactivated. Please contact administrator.", statusCode: 403);
            }

            var token = _jwtHelper.GenerateToken(user);

            // Audit log login action
            await _auditLogger.LogAsync(
                action: "Login",
                entityName: "User",
                entityId: user.UserId.ToString(),
                details: $"User '{user.Username}' logged in with role '{user.Role}'.",
                userId: user.UserId,
                userName: user.Username,
                institutionId: user.InstitutionId,
                ipAddress: ipAddress);

            var response = new AuthResponseDto
            {
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                User = MapToUserDto(user)
            };

            return ApiResponse<AuthResponseDto>.Ok(response, "Login successful.");
        }

        public async Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterRequestDto dto, string? ipAddress = null)
        {
            if (await _repository.ExistsByUsernameAsync(dto.Username, dto.InstitutionId))
            {
                return ApiResponse<AuthResponseDto>.Fail($"Username '{dto.Username}' is already taken.", statusCode: 400);
            }

            if (await _repository.ExistsByEmailAsync(dto.Email, dto.InstitutionId))
            {
                return ApiResponse<AuthResponseDto>.Fail($"Email '{dto.Email}' is already registered.", statusCode: 400);
            }

            var user = new User
            {
                InstitutionId = dto.InstitutionId,
                Username = dto.Username.Trim(),
                Email = dto.Email.Trim().ToLower(),
                PasswordHash = PasswordHasher.HashPassword(dto.Password),
                FullName = dto.FullName.Trim(),
                Role = dto.Role,
                PhoneNumber = dto.PhoneNumber?.Trim(),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var createdUser = await _repository.CreateAsync(user);
            var token = _jwtHelper.GenerateToken(createdUser);

            // Audit log registration
            await _auditLogger.LogAsync(
                action: "Register",
                entityName: "User",
                entityId: createdUser.UserId.ToString(),
                details: $"New user '{createdUser.Username}' registered with role '{createdUser.Role}'.",
                userId: createdUser.UserId,
                userName: createdUser.Username,
                institutionId: createdUser.InstitutionId,
                ipAddress: ipAddress);

            var response = new AuthResponseDto
            {
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                User = MapToUserDto(createdUser)
            };

            return ApiResponse<AuthResponseDto>.Ok(response, "Registration successful.", statusCode: 201);
        }

        public async Task<ApiResponse<UserDto>> GetCurrentUserAsync(int userId)
        {
            var user = await _repository.GetByIdAsync(userId);
            if (user == null || !user.IsActive)
            {
                return ApiResponse<UserDto>.Fail("User not found or inactive.", statusCode: 404);
            }

            return ApiResponse<UserDto>.Ok(MapToUserDto(user));
        }

        private static UserDto MapToUserDto(User user)
        {
            return new UserDto
            {
                UserId = user.UserId,
                InstitutionId = user.InstitutionId,
                Username = user.Username,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role,
                PhoneNumber = user.PhoneNumber,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt
            };
        }
    }
}

