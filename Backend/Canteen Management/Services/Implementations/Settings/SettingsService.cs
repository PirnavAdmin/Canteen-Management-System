using System.Text.Json;
using CanteenManagement.API.DTOs.Settings;
using CanteenManagement.API.Models.Settings;
using CanteenManagement.API.Repositories.Interfaces.Settings;
using CanteenManagement.API.Services.Interfaces.Common;
using CanteenManagement.API.Services.Interfaces.Settings;

namespace CanteenManagement.API.Services.Implementations.Settings
{
    public class SettingsService : ISettingsService
    {
        private readonly ISettingsRepository _repository;
        private readonly IAuditLoggingService _auditService;

        public SettingsService(ISettingsRepository repository, IAuditLoggingService auditService)
        {
            _repository = repository;
            _auditService = auditService;
        }

        public async Task<SystemSettingsResponseDto> GetSettingsAsync(int institutionId)
        {
            var outletJson = await _repository.GetSettingAsync(institutionId, "Outlet", "General");
            var paymentJson = await _repository.GetSettingAsync(institutionId, "Payment", "General");
            var rulesJson = await _repository.GetSettingAsync(institutionId, "OrderRules", "General");
            var privacyJson = await _repository.GetSettingAsync(institutionId, "Privacy", "General");
            var dsarList = await _repository.GetDsarRequestsAsync(institutionId);

            var outlet = outletJson != null ? JsonSerializer.Deserialize<OutletSettingsDto>(outletJson.SettingValueJson) : new();
            var payment = paymentJson != null ? JsonSerializer.Deserialize<PaymentSettingsDto>(paymentJson.SettingValueJson) : new();
            var rules = rulesJson != null ? JsonSerializer.Deserialize<OrderRulesDto>(rulesJson.SettingValueJson) : new();
            var privacy = privacyJson != null ? JsonSerializer.Deserialize<PrivacySettingsDto>(privacyJson.SettingValueJson) : new();

            privacy ??= new PrivacySettingsDto();
            privacy.DsarRequests = dsarList.Select(d => new DsarRequestDto
            {
                Id = d.RequestId,
                UserName = d.UserName,
                UserRole = d.UserRole,
                Email = d.Email,
                RequestType = d.RequestType,
                Status = d.Status,
                Notes = d.Notes,
                RequestedAt = d.RequestedAt,
                FulfilledAt = d.FulfilledAt
            }).ToList();

            return new SystemSettingsResponseDto
            {
                Outlet = outlet ?? new(),
                Payments = payment ?? new(),
                OrderRules = rules ?? new(),
                Privacy = privacy
            };
        }

        public async Task<OutletSettingsDto> UpdateOutletSettingsAsync(OutletSettingsDto dto, int institutionId, string performedBy)
        {
            var setting = new SystemSetting
            {
                InstitutionId = institutionId,
                Category = "Outlet",
                SettingKey = "General",
                SettingValueJson = JsonSerializer.Serialize(dto),
                UpdatedAt = DateTime.UtcNow
            };

            await _repository.SaveSettingAsync(setting);

            await _auditService.LogActionAsync(
                institutionId,
                null,
                performedBy,
                "UPDATE_OUTLET_SETTINGS",
                "SystemSetting",
                "Outlet.General",
                "Updated outlet operational settings."
            );

            return dto;
        }

        public async Task<PaymentSettingsDto> UpdatePaymentSettingsAsync(PaymentSettingsDto dto, int institutionId, string performedBy)
        {
            var setting = new SystemSetting
            {
                InstitutionId = institutionId,
                Category = "Payment",
                SettingKey = "General",
                SettingValueJson = JsonSerializer.Serialize(dto),
                UpdatedAt = DateTime.UtcNow
            };

            await _repository.SaveSettingAsync(setting);

            await _auditService.LogActionAsync(
                institutionId,
                null,
                performedBy,
                "UPDATE_PAYMENT_SETTINGS",
                "SystemSetting",
                "Payment.General",
                "Updated payment gateways and GST settings."
            );

            return dto;
        }

        public async Task<OrderRulesDto> UpdateOrderRulesAsync(OrderRulesDto dto, int institutionId, string performedBy)
        {
            var setting = new SystemSetting
            {
                InstitutionId = institutionId,
                Category = "OrderRules",
                SettingKey = "General",
                SettingValueJson = JsonSerializer.Serialize(dto),
                UpdatedAt = DateTime.UtcNow
            };

            await _repository.SaveSettingAsync(setting);

            await _auditService.LogActionAsync(
                institutionId,
                null,
                performedBy,
                "UPDATE_ORDER_RULES",
                "SystemSetting",
                "OrderRules.General",
                "Updated ordering limits and rules."
            );

            return dto;
        }

        public async Task<PrivacySettingsDto> UpdatePrivacySettingsAsync(PrivacySettingsDto dto, int institutionId, string performedBy)
        {
            var setting = new SystemSetting
            {
                InstitutionId = institutionId,
                Category = "Privacy",
                SettingKey = "General",
                SettingValueJson = JsonSerializer.Serialize(dto),
                UpdatedAt = DateTime.UtcNow
            };

            await _repository.SaveSettingAsync(setting);

            await _auditService.LogActionAsync(
                institutionId,
                null,
                performedBy,
                "UPDATE_PRIVACY_SETTINGS",
                "SystemSetting",
                "Privacy.General",
                "Updated DPDP privacy retention policies."
            );

            return dto;
        }

        public async Task<DsarRequestDto> UpdateDsarStatusAsync(string requestId, UpdateDsarStatusDto dto, int institutionId, string performedBy)
        {
            var request = await _repository.GetDsarRequestByIdAsync(requestId, institutionId);
            if (request == null)
            {
                throw new KeyNotFoundException($"DSAR request {requestId} was not found.");
            }

            request.Status = dto.Status;
            request.Notes = dto.Notes;
            if (dto.Status == "Fulfilled")
            {
                request.FulfilledAt = DateTime.UtcNow;

                // DPDP Section Rule: Erasure anonymizes personal identity while statutory financial audit trails remain
                if (request.RequestType.Contains("Erasure"))
                {
                    request.Notes = $"{request.Notes} (DPDP Act Compliance: Personal credentials and identity anonymized. Financial invoices and order audit trails preserved under statutory 7-year retention)";
                }
            }

            var updated = await _repository.UpdateDsarRequestAsync(request);

            await _auditService.LogActionAsync(
                institutionId,
                null,
                performedBy,
                "UPDATE_DSAR_STATUS",
                "DsarRequest",
                updated.RequestId,
                $"DSAR request {updated.RequestId} status updated to {updated.Status}."
            );

            return new DsarRequestDto
            {
                Id = updated.RequestId,
                UserName = updated.UserName,
                UserRole = updated.UserRole,
                Email = updated.Email,
                RequestType = updated.RequestType,
                Status = updated.Status,
                Notes = updated.Notes,
                RequestedAt = updated.RequestedAt,
                FulfilledAt = updated.FulfilledAt
            };
        }
    }
}

