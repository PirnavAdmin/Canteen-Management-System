using Asp.Versioning;
using CanteenManagement.API.DTOs.Settings;
using CanteenManagement.API.Helpers;
using CanteenManagement.API.Services.Interfaces.Settings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CanteenManagement.API.Controllers.V1
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/canteen-settings")]
    [Authorize(Policy = "RequireAdmin")]
    public class SettingsController : ControllerBase
    {
        private readonly ISettingsService _settingsService;

        public SettingsController(ISettingsService settingsService)
        {
            _settingsService = settingsService;
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetSettings()
        {
            var campusId = User.Identity?.IsAuthenticated == true ? User.ResolveCampusId() : 1;
            var settings = await _settingsService.GetSettingsAsync(campusId);
            return Ok(ApiResponse<SystemSettingsResponseDto>.SuccessResponse(settings));
        }

        [AllowAnonymous]
        [HttpGet("public-payment-config")]
        public async Task<IActionResult> GetPublicPaymentConfig()
        {
            var campusId = User.Identity?.IsAuthenticated == true ? User.ResolveCampusId() : 1;
            var config = await _settingsService.GetPublicPaymentConfigAsync(campusId);
            return Ok(ApiResponse<PublicPaymentConfigDto>.SuccessResponse(config));
        }

        [HttpPut("payments")]
        public async Task<IActionResult> UpdatePaymentSettings([FromBody] PaymentSettingsDto dto)
        {
            var campusId = User.ResolveCampusId();
            var userName = User.ResolveUserName();
            var result = await _settingsService.UpdatePaymentSettingsAsync(dto, campusId, userName);
            return Ok(ApiResponse<PaymentSettingsDto>.SuccessResponse(result, "Payment settings updated successfully."));
        }

        [HttpPut("rules")]
        public async Task<IActionResult> UpdateOrderRules([FromBody] OrderRulesDto dto)
        {
            var campusId = User.ResolveCampusId();
            var userName = User.ResolveUserName();
            var result = await _settingsService.UpdateOrderRulesAsync(dto, campusId, userName);
            return Ok(ApiResponse<OrderRulesDto>.SuccessResponse(result, "Order rules updated successfully."));
        }
    }
}
