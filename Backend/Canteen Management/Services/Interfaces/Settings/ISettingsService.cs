using CanteenManagement.API.DTOs.Settings;

namespace CanteenManagement.API.Services.Interfaces.Settings
{
    public interface ISettingsService
    {
        Task<SystemSettingsResponseDto> GetSettingsAsync(int campusId);
        Task<OutletSettingsDto> UpdateOutletSettingsAsync(OutletSettingsDto dto, int campusId, string performedBy);
        Task<PaymentSettingsDto> UpdatePaymentSettingsAsync(PaymentSettingsDto dto, int campusId, string performedBy);
        Task<OrderRulesDto> UpdateOrderRulesAsync(OrderRulesDto dto, int campusId, string performedBy);
        Task<PrivacySettingsDto> UpdatePrivacySettingsAsync(PrivacySettingsDto dto, int campusId, string performedBy);
        Task<DsarRequestDto> UpdateDsarStatusAsync(string requestId, UpdateDsarStatusDto dto, int campusId, string performedBy);
    }
}

