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

        public async Task<SystemSettingsResponseDto> GetSettingsAsync(int campusId)
        {
            var paymentJson = await _repository.GetSettingAsync(campusId, "Payment", "General");
            var rulesJson = await _repository.GetSettingAsync(campusId, "OrderRules", "General");

            var payment = paymentJson != null ? JsonSerializer.Deserialize<PaymentSettingsDto>(paymentJson.SettingValueJson) : new();
            var rules = rulesJson != null ? JsonSerializer.Deserialize<OrderRulesDto>(rulesJson.SettingValueJson) : new();

            return new SystemSettingsResponseDto
            {
                Payments = payment ?? new(),
                OrderRules = rules ?? new()
            };
        }

        public async Task<PaymentSettingsDto> UpdatePaymentSettingsAsync(PaymentSettingsDto dto, int campusId, string performedBy)
        {
            var setting = new SystemSetting
            {
                CampusId = campusId,
                Category = "Payment",
                SettingKey = "General",
                SettingValueJson = JsonSerializer.Serialize(dto),
                UpdatedAt = DateTime.UtcNow
            };

            await _repository.SaveSettingAsync(setting);

            await _auditService.LogActionAsync(
                campusId,
                null,
                performedBy,
                "UPDATE_PAYMENT_SETTINGS",
                "SystemSetting",
                "Payment.General",
                "Updated payment gateways and GST settings."
            );

            return dto;
        }

        public async Task<OrderRulesDto> UpdateOrderRulesAsync(OrderRulesDto dto, int campusId, string performedBy)
        {
            var setting = new SystemSetting
            {
                CampusId = campusId,
                Category = "OrderRules",
                SettingKey = "General",
                SettingValueJson = JsonSerializer.Serialize(dto),
                UpdatedAt = DateTime.UtcNow
            };

            await _repository.SaveSettingAsync(setting);

            await _auditService.LogActionAsync(
                campusId,
                null,
                performedBy,
                "UPDATE_ORDER_RULES",
                "SystemSetting",
                "OrderRules.General",
                "Updated ordering limits and rules."
            );

            return dto;
        }
    }
}

