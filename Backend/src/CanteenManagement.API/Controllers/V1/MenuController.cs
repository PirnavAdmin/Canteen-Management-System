using Asp.Versioning;
using CanteenManagement.API.DTOs.Menu;
using CanteenManagement.API.Helpers;
using CanteenManagement.API.Services.Interfaces.Menu;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CanteenManagement.API.Controllers.V1
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/canteen-menu")]
    public class MenuController : ControllerBase
    {
        private readonly IMenuService _menuService;

        public MenuController(IMenuService menuService)
        {
            _menuService = menuService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] MenuItemFilterDto filter)
        {
            var institutionId = User.ResolveInstitutionId();
            var items = await _menuService.GetAllAsync(institutionId, filter);
            return Ok(ApiResponse<IEnumerable<MenuItemDto>>.SuccessResponse(items));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var institutionId = User.ResolveInstitutionId();
            var item = await _menuService.GetByIdAsync(id, institutionId);
            if (item == null)
            {
                return NotFound(ApiResponse<string>.ErrorResponse($"Menu item with ID {id} was not found."));
            }
            return Ok(ApiResponse<MenuItemDto>.SuccessResponse(item));
        }

        [HttpPost]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> Create([FromBody] CreateMenuItemDto dto)
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
                var created = await _menuService.CreateAsync(dto, institutionId, userName);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, ApiResponse<MenuItemDto>.SuccessResponse(created, "Menu item created successfully."));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<string>.ErrorResponse(ex.Message));
            }
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateMenuItemDto dto)
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
                var updated = await _menuService.UpdateAsync(id, dto, institutionId, userName);
                return Ok(ApiResponse<MenuItemDto>.SuccessResponse(updated, "Menu item updated successfully."));
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
                var toggled = await _menuService.ToggleStatusAsync(id, institutionId, userName);
                return Ok(ApiResponse<MenuItemDto>.SuccessResponse(toggled, $"Menu item status changed to {toggled.Status}."));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<string>.ErrorResponse(ex.Message));
            }
        }

        [HttpPatch("{id}/publish")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> TogglePublish(int id)
        {
            try
            {
                var institutionId = User.ResolveInstitutionId();
                var userName = User.ResolveUserName();
                var toggled = await _menuService.TogglePublishAsync(id, institutionId, userName);
                return Ok(ApiResponse<MenuItemDto>.SuccessResponse(toggled, $"Menu item publication status changed to {toggled.PublicationStatus}."));
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
            var institutionId = User.ResolveInstitutionId();
            var userName = User.ResolveUserName();
            var (success, blockedByPolicy, message) = await _menuService.DeleteAsync(id, institutionId, userName);

            if (blockedByPolicy)
            {
                return StatusCode(StatusCodes.Status409Conflict, ApiResponse<string>.ErrorResponse(message!));
            }

            if (!success)
            {
                return NotFound(ApiResponse<string>.ErrorResponse(message ?? $"Menu item with ID {id} was not found."));
            }

            return Ok(ApiResponse<bool>.SuccessResponse(true, "Menu item deleted successfully."));
        }
    }
}
