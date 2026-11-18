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

        [HttpGet]
        public async Task<IActionResult> GetSettings()
        {
            var campusId = User.ResolveCampusId();
            var settings = await _settingsService.GetSettingsAsync(campusId);
            return Ok(ApiResponse<SystemSettingsResponseDto>.SuccessResponse(settings));
        }

        [HttpPut("outlet")]
        public async Task<IActionResult> UpdateOutletSettings([FromBody] OutletSettingsDto dto)
        {
            var campusId = User.ResolveCampusId();
            var userName = User.ResolveUserName();
            var result = await _settingsService.UpdateOutletSettingsAsync(dto, campusId, userName);
            return Ok(ApiResponse<OutletSettingsDto>.SuccessResponse(result, "Outlet settings updated successfully."));
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

        [HttpPut("privacy")]
        public async Task<IActionResult> UpdatePrivacySettings([FromBody] PrivacySettingsDto dto)
        {
            var campusId = User.ResolveCampusId();
            var userName = User.ResolveUserName();
            var result = await _settingsService.UpdatePrivacySettingsAsync(dto, campusId, userName);
            return Ok(ApiResponse<PrivacySettingsDto>.SuccessResponse(result, "Privacy settings updated successfully."));
        }

        [HttpPatch("dsar/{id}")]
        public async Task<IActionResult> UpdateDsarStatus(string id, [FromBody] UpdateDsarStatusDto dto)
        {
            try
            {
                var campusId = User.ResolveCampusId();
                var userName = User.ResolveUserName();
                var result = await _settingsService.UpdateDsarStatusAsync(id, dto, campusId, userName);
                return Ok(ApiResponse<DsarRequestDto>.SuccessResponse(result, $"DSAR request updated to {result.Status}."));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<string>.ErrorResponse(ex.Message));
            }
        }
    }
}

