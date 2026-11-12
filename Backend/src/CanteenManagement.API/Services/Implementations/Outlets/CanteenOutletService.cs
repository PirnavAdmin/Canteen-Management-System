using CanteenManagement.API.DTOs.Outlets;
using CanteenManagement.API.Helpers;
using CanteenManagement.API.Models.Outlets;
using CanteenManagement.API.Repositories.Interfaces.Outlets;
using CanteenManagement.API.Services.Interfaces.Common;
using CanteenManagement.API.Services.Interfaces.Outlets;

namespace CanteenManagement.API.Services.Implementations.Outlets
{
    public class CanteenOutletService : ICanteenOutletService
    {
        private readonly ICanteenOutletRepository _repository;
        private readonly IAuditLoggingService _auditLogger;
        private readonly ILogger<CanteenOutletService> _logger;

        public CanteenOutletService(
            ICanteenOutletRepository repository,
            IAuditLoggingService auditLogger,
            ILogger<CanteenOutletService> logger)
        {
            _repository = repository;
            _auditLogger = auditLogger;
            _logger = logger;
        }

        public async Task<ApiResponse<IEnumerable<CanteenOutletDto>>> GetAllAsync(int institutionId, string? status = null, string? search = null)
        {
            var outlets = await _repository.GetAllAsync(institutionId, status, search);
            var dtos = outlets.Select(MapToDto);
            return ApiResponse<IEnumerable<CanteenOutletDto>>.Ok(dtos);
        }

        public async Task<ApiResponse<CanteenOutletDto>> GetByIdAsync(int outletId, int institutionId)
        {
            var outlet = await _repository.GetByIdAsync(outletId, institutionId);
            if (outlet == null)
            {
                return ApiResponse<CanteenOutletDto>.Fail("Canteen outlet not found.", statusCode: 404);
            }

            return ApiResponse<CanteenOutletDto>.Ok(MapToDto(outlet));
        }

        public async Task<ApiResponse<CanteenOutletDto>> CreateAsync(int institutionId, CreateCanteenOutletDto dto, int userId, string userName)
        {
            if (await _repository.ExistsByCodeAsync(dto.Code, institutionId))
            {
                return ApiResponse<CanteenOutletDto>.Fail($"Outlet Code '{dto.Code}' already exists. Please choose a unique code.", statusCode: 400);
            }

            var outlet = new CanteenOutlet
            {
                InstitutionId = institutionId,
                Code = dto.Code.Trim().ToUpper(),
                Name = dto.Name.Trim(),
                Location = dto.Location?.Trim(),
                OpenTime = dto.OpenTime,
                CloseTime = dto.CloseTime,
                FssaiLicenseNo = dto.FssaiLicenseNo?.Trim(),
                ContactNumber = dto.ContactNumber?.Trim(),
                Status = dto.Status,
                IsOrderAcceptanceEnabled = dto.IsOrderAcceptanceEnabled,
                WorkingDays = dto.WorkingDays,
                AdminContactJson = dto.AdminContactJson,
                CreatedAt = DateTime.UtcNow,
                Settings = new CanteenOutletSetting
                {
                    AutoExpireUnpaidMinutes = 10,
                    PickupHoldMinutes = 30,
                    CancellationPolicy = "UntilAccepted",
                    AllowUpi = true,
                    AllowCards = true,
                    AllowWallet = true,
                    AllowCash = true,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            var created = await _repository.CreateAsync(outlet);

            // Audit log creation
            await _auditLogger.LogAsync(
                action: "Create",
                entityName: "CanteenOutlet",
                entityId: created.OutletId.ToString(),
                details: $"Created outlet '{created.Name}' ({created.Code})",
                userId: userId,
                userName: userName,
                institutionId: institutionId);

            return ApiResponse<CanteenOutletDto>.Ok(MapToDto(created), "Canteen outlet created successfully.", statusCode: 201);
        }

        public async Task<ApiResponse<CanteenOutletDto>> UpdateAsync(int outletId, int institutionId, UpdateCanteenOutletDto dto, int userId, string userName)
        {
            var existing = await _repository.GetByIdAsync(outletId, institutionId);
            if (existing == null)
            {
                return ApiResponse<CanteenOutletDto>.Fail("Canteen outlet not found.", statusCode: 404);
            }

            existing.Name = dto.Name.Trim();
            existing.Location = dto.Location?.Trim();
            existing.OpenTime = dto.OpenTime;
            existing.CloseTime = dto.CloseTime;
            existing.FssaiLicenseNo = dto.FssaiLicenseNo?.Trim();
            existing.ContactNumber = dto.ContactNumber?.Trim();
            existing.Status = dto.Status;
            existing.IsOrderAcceptanceEnabled = dto.IsOrderAcceptanceEnabled;
            if (dto.WorkingDays != null) existing.WorkingDays = dto.WorkingDays;
            if (dto.AdminContactJson != null) existing.AdminContactJson = dto.AdminContactJson;
            existing.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(existing);

            // Audit log update
            await _auditLogger.LogAsync(
                action: "Update",
                entityName: "CanteenOutlet",
                entityId: existing.OutletId.ToString(),
                details: $"Updated outlet '{existing.Name}' ({existing.Code})",
                userId: userId,
                userName: userName,
                institutionId: institutionId);

            return ApiResponse<CanteenOutletDto>.Ok(MapToDto(existing), "Canteen outlet updated successfully.");
        }

        public async Task<ApiResponse<bool>> ToggleStatusAsync(int outletId, int institutionId, string status, int userId, string userName)
        {
            var existing = await _repository.GetByIdAsync(outletId, institutionId);
            if (existing == null)
            {
                return ApiResponse<bool>.Fail("Canteen outlet not found.", statusCode: 404);
            }

            var oldStatus = existing.Status;
            existing.Status = status;
            existing.IsOrderAcceptanceEnabled = status == "Active";
            existing.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(existing);

            // Audit log status change
            await _auditLogger.LogAsync(
                action: "StatusChange",
                entityName: "CanteenOutlet",
                entityId: existing.OutletId.ToString(),
                details: $"Changed status from '{oldStatus}' to '{status}'",
                userId: userId,
                userName: userName,
                institutionId: institutionId);

            return ApiResponse<bool>.Ok(true, $"Outlet status changed to {status}.");
        }

        public async Task<ApiResponse<bool>> DeleteAsync(int outletId, int institutionId, int userId, string userName)
        {
            var existing = await _repository.GetByIdAsync(outletId, institutionId);
            if (existing == null)
            {
                return ApiResponse<bool>.Fail("Canteen outlet not found.", statusCode: 404);
            }

            var deleted = await _repository.DeleteAsync(outletId, institutionId);
            if (deleted)
            {
                await _auditLogger.LogAsync(
                    action: "Delete",
                    entityName: "CanteenOutlet",
                    entityId: outletId.ToString(),
                    details: $"Deleted outlet '{existing.Name}' ({existing.Code})",
                    userId: userId,
                    userName: userName,
                    institutionId: institutionId);
            }

            return ApiResponse<bool>.Ok(deleted, "Canteen outlet deleted successfully.");
        }

        public async Task<ApiResponse<CanteenOutletStatsDto>> GetStatsAsync(int institutionId)
        {
            var stats = await _repository.GetStatsAsync(institutionId);
            return ApiResponse<CanteenOutletStatsDto>.Ok(stats);
        }

        public async Task<ApiResponse<CanteenOutletSettingDto>> GetSettingsAsync(int outletId, int institutionId)
        {
            var outlet = await _repository.GetByIdAsync(outletId, institutionId);
            if (outlet == null)
            {
                return ApiResponse<CanteenOutletSettingDto>.Fail("Canteen outlet not found.", statusCode: 404);
            }

            var settings = await _repository.GetSettingsAsync(outletId) ?? new CanteenOutletSetting { OutletId = outletId };
            return ApiResponse<CanteenOutletSettingDto>.Ok(MapToSettingDto(settings));
        }

        public async Task<ApiResponse<CanteenOutletSettingDto>> UpdateSettingsAsync(int outletId, int institutionId, UpdateOutletSettingsDto dto, int userId, string userName)
        {
            var outlet = await _repository.GetByIdAsync(outletId, institutionId);
            if (outlet == null)
            {
                return ApiResponse<CanteenOutletSettingDto>.Fail("Canteen outlet not found.", statusCode: 404);
            }

            var settings = await _repository.GetSettingsAsync(outletId);
            if (settings == null)
            {
                settings = new CanteenOutletSetting
                {
                    OutletId = outletId,
                    AutoExpireUnpaidMinutes = dto.AutoExpireUnpaidMinutes,
                    PickupHoldMinutes = dto.PickupHoldMinutes,
                    CancellationPolicy = dto.CancellationPolicy,
                    AllowUpi = dto.AllowUpi,
                    AllowCards = dto.AllowCards,
                    AllowWallet = dto.AllowWallet,
                    AllowCash = dto.AllowCash,
                    UpdatedAt = DateTime.UtcNow
                };
            }
            else
            {
                settings.AutoExpireUnpaidMinutes = dto.AutoExpireUnpaidMinutes;
                settings.PickupHoldMinutes = dto.PickupHoldMinutes;
                settings.CancellationPolicy = dto.CancellationPolicy;
                settings.AllowUpi = dto.AllowUpi;
                settings.AllowCards = dto.AllowCards;
                settings.AllowWallet = dto.AllowWallet;
                settings.AllowCash = dto.AllowCash;
            }

            await _repository.UpdateSettingsAsync(settings);

            // Audit log settings change
            await _auditLogger.LogAsync(
                action: "UpdateSettings",
                entityName: "CanteenOutletSetting",
                entityId: outletId.ToString(),
                details: $"Updated operational settings for outlet '{outlet.Name}'",
                userId: userId,
                userName: userName,
                institutionId: institutionId);

            return ApiResponse<CanteenOutletSettingDto>.Ok(MapToSettingDto(settings), "Outlet settings updated successfully.");
        }

        private static CanteenOutletDto MapToDto(CanteenOutlet outlet)
        {
            return new CanteenOutletDto
            {
                OutletId = outlet.OutletId,
                InstitutionId = outlet.InstitutionId,
                Code = outlet.Code,
                Name = outlet.Name,
                Location = outlet.Location,
                OpenTime = outlet.OpenTime,
                CloseTime = outlet.CloseTime,
                FssaiLicenseNo = outlet.FssaiLicenseNo,
                ContactNumber = outlet.ContactNumber,
                Status = outlet.Status,
                IsOrderAcceptanceEnabled = outlet.IsOrderAcceptanceEnabled,
                WorkingDays = outlet.WorkingDays,
                AdminContactJson = outlet.AdminContactJson,
                CreatedAt = outlet.CreatedAt,
                UpdatedAt = outlet.UpdatedAt,
                Settings = outlet.Settings != null ? MapToSettingDto(outlet.Settings) : null
            };
        }

        private static CanteenOutletSettingDto MapToSettingDto(CanteenOutletSetting s)
        {
            return new CanteenOutletSettingDto
            {
                SettingId = s.SettingId,
                OutletId = s.OutletId,
                AutoExpireUnpaidMinutes = s.AutoExpireUnpaidMinutes,
                PickupHoldMinutes = s.PickupHoldMinutes,
                CancellationPolicy = s.CancellationPolicy,
                AllowUpi = s.AllowUpi,
                AllowCards = s.AllowCards,
                AllowWallet = s.AllowWallet,
                AllowCash = s.AllowCash,
                UpdatedAt = s.UpdatedAt
            };
        }
    }
}

