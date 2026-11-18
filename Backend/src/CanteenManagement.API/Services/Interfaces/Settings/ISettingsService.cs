using CanteenManagement.API.DTOs.Settings;

namespace CanteenManagement.API.Services.Interfaces.Settings
{
    public interface ISettingsService
    {
        Task<SystemSettingsResponseDto> GetSettingsAsync(int campusId);
        Task<PaymentSettingsDto> UpdatePaymentSettingsAsync(PaymentSettingsDto dto, int campusId, string performedBy);
        Task<OrderRulesDto> UpdateOrderRulesAsync(OrderRulesDto dto, int campusId, string performedBy);
    }
}

