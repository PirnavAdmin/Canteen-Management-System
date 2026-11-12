using CanteenManagement.API.DTOs.Settings;

namespace CanteenManagement.API.Services.Interfaces.Settings
{
    public interface ISettingsService
    {
        Task<SystemSettingsResponseDto> GetSettingsAsync(int institutionId);
        Task<OutletSettingsDto> UpdateOutletSettingsAsync(OutletSettingsDto dto, int institutionId, string performedBy);
        Task<PaymentSettingsDto> UpdatePaymentSettingsAsync(PaymentSettingsDto dto, int institutionId, string performedBy);
        Task<OrderRulesDto> UpdateOrderRulesAsync(OrderRulesDto dto, int institutionId, string performedBy);
        Task<PrivacySettingsDto> UpdatePrivacySettingsAsync(PrivacySettingsDto dto, int institutionId, string performedBy);
        Task<DsarRequestDto> UpdateDsarStatusAsync(string requestId, UpdateDsarStatusDto dto, int institutionId, string performedBy);
    }
}
