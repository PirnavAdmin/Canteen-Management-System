using Asp.Versioning;
using CanteenManagement.API.DTOs.Slots;
using CanteenManagement.API.Helpers;
using CanteenManagement.API.Services.Interfaces.Slots;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CanteenManagement.API.Controllers.V1
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/canteen-slots")]
    public class SlotsController : ControllerBase
    {
        private readonly ISlotService _slotService;

        public SlotsController(ISlotService slotService)
        {
            _slotService = slotService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? outletId, [FromQuery] string? date, [FromQuery] string? session)
        {
            var institutionId = User.ResolveInstitutionId();
            var slots = await _slotService.GetAllAsync(institutionId, outletId, date, session);
            return Ok(ApiResponse<IEnumerable<SlotDto>>.SuccessResponse(slots));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var institutionId = User.ResolveInstitutionId();
            var slot = await _slotService.GetByIdAsync(id, institutionId);
            if (slot == null)
            {
                return NotFound(ApiResponse<string>.ErrorResponse($"Slot with ID {id} was not found."));
            }
            return Ok(ApiResponse<SlotDto>.SuccessResponse(slot));
        }

        [HttpPost]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> Create([FromBody] CreateSlotDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return BadRequest(ApiResponse<string>.ErrorResponse("Validation failed.", errors));
            }

            try
            {
                var institutionId = User.ResolveInstitutionId();
                var userName = User.ResolveUserName();
                var created = await _slotService.CreateAsync(dto, institutionId, userName);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, ApiResponse<SlotDto>.SuccessResponse(created, "Time slot created successfully."));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<string>.ErrorResponse(ex.Message));
            }
        }

        [HttpPatch("{id}/capacity")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> AdjustCapacity(int id, [FromBody] AdjustCapacityDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return BadRequest(ApiResponse<string>.ErrorResponse("Validation failed.", errors));
            }

            try
            {
                var institutionId = User.ResolveInstitutionId();
                var userName = User.ResolveUserName();
                var updated = await _slotService.UpdateCapacityAsync(id, dto.MaxCapacity, institutionId, userName);
                return Ok(ApiResponse<SlotDto>.SuccessResponse(updated, $"Slot capacity adjusted to {updated.MaxCapacity}."));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<string>.ErrorResponse(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<string>.ErrorResponse(ex.Message));
            }
        }

        [HttpPatch("{id}/status")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> ToggleStatus(int id)
        {
            try
            {
                var institutionId = User.ResolveInstitutionId();
                var userName = User.ResolveUserName();
                var toggled = await _slotService.ToggleStatusAsync(id, institutionId, userName);
                return Ok(ApiResponse<SlotDto>.SuccessResponse(toggled, $"Slot status changed to {toggled.Status}."));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<string>.ErrorResponse(ex.Message));
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var institutionId = User.ResolveInstitutionId();
                var userName = User.ResolveUserName();
                var deleted = await _slotService.DeleteAsync(id, institutionId, userName);
                if (!deleted)
                {
                    return NotFound(ApiResponse<string>.ErrorResponse($"Slot with ID {id} was not found."));
                }
                return Ok(ApiResponse<bool>.SuccessResponse(true, "Slot deleted successfully."));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<string>.ErrorResponse(ex.Message));
            }
        }
    }
}
