using Asp.Versioning;
using CanteenManagement.API.DTOs.Outlets;
using CanteenManagement.API.Helpers;
using CanteenManagement.API.Services.Interfaces.Outlets;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CanteenManagement.API.Controllers.V1
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/canteen-outlets")]
    [Produces("application/json")]
    [Tags("Canteen Outlets")]
    public class CanteenOutletsController : ControllerBase
    {
        private readonly ICanteenOutletService _service;
        private readonly ILogger<CanteenOutletsController> _logger;

        public CanteenOutletsController(
            ICanteenOutletService service,
            ILogger<CanteenOutletsController> logger)
        {
            _service = service;
            _logger = logger;
        }

        /// <summary>
        /// Retrieves all canteen outlets for the caller's institution, with optional status and search filters
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<CanteenOutletDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll([FromQuery] string? status = null, [FromQuery] string? search = null)
        {
            var institutionId = User.ResolveInstitutionId();
            var response = await _service.GetAllAsync(institutionId, status, search);
            return Ok(response);
        }

        /// <summary>
        /// Retrieves summary statistics across outlets (Total, Active, Inactive, Revenue)
        /// </summary>
        [HttpGet("stats")]
        [ProducesResponseType(typeof(ApiResponse<CanteenOutletStatsDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetStats()
        {
            var institutionId = User.ResolveInstitutionId();
            var response = await _service.GetStatsAsync(institutionId);
            return Ok(response);
        }

        /// <summary>
        /// Retrieves details of a specific canteen outlet by ID
        /// </summary>
        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(ApiResponse<CanteenOutletDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CanteenOutletDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById([FromRoute] int id)
        {
            var institutionId = User.ResolveInstitutionId();
            var response = await _service.GetByIdAsync(id, institutionId);
            if (!response.Success)
            {
                return StatusCode(response.StatusCode, response);
            }

            return Ok(response);
        }

        /// <summary>
        /// Creates a new canteen outlet (Admin role required)
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<CanteenOutletDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<CanteenOutletDto>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Create([FromBody] CreateCanteenOutletDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return BadRequest(ApiResponse<CanteenOutletDto>.Fail("Validation failed.", errors));
            }

            var institutionId = User.ResolveInstitutionId();
            var userId = User.ResolveUserId();
            var userName = User.ResolveUserName();

            var response = await _service.CreateAsync(institutionId, dto, userId, userName);
            if (!response.Success)
            {
                return StatusCode(response.StatusCode, response);
            }

            return CreatedAtAction(nameof(GetById), new { version = "1.0", id = response.Data?.OutletId }, response);
        }

        /// <summary>
        /// Updates an existing canteen outlet's details (Admin role required)
        /// </summary>
        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<CanteenOutletDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CanteenOutletDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<CanteenOutletDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] UpdateCanteenOutletDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return BadRequest(ApiResponse<CanteenOutletDto>.Fail("Validation failed.", errors));
            }

            var institutionId = User.ResolveInstitutionId();
            var userId = User.ResolveUserId();
            var userName = User.ResolveUserName();

            var response = await _service.UpdateAsync(id, institutionId, dto, userId, userName);
            if (!response.Success)
            {
                return StatusCode(response.StatusCode, response);
            }

            return Ok(response);
        }

        /// <summary>
        /// Toggles active/inactive status of an outlet (Admin role required)
        /// </summary>
        [HttpPatch("{id:int}/status")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ToggleStatus([FromRoute] int id, [FromBody] ToggleOutletStatusDto dto)
        {
            var institutionId = User.ResolveInstitutionId();
            var userId = User.ResolveUserId();
            var userName = User.ResolveUserName();

            var response = await _service.ToggleStatusAsync(id, institutionId, dto.Status, userId, userName);
            if (!response.Success)
            {
                return StatusCode(response.StatusCode, response);
            }

            return Ok(response);
        }

        /// <summary>
        /// Deletes an outlet (Admin role required)
        /// </summary>
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Delete([FromRoute] int id)
        {
            var institutionId = User.ResolveInstitutionId();
            var userId = User.ResolveUserId();
            var userName = User.ResolveUserName();

            var response = await _service.DeleteAsync(id, institutionId, userId, userName);
            if (!response.Success)
            {
                return StatusCode(response.StatusCode, response);
            }

            return Ok(response);
        }

        /// <summary>
        /// Retrieves operational settings for an outlet (auto-expire, hold times, cancellation rule)
        /// </summary>
        [HttpGet("{id:int}/settings")]
        [ProducesResponseType(typeof(ApiResponse<CanteenOutletSettingDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CanteenOutletSettingDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetSettings([FromRoute] int id)
        {
            var institutionId = User.ResolveInstitutionId();
            var response = await _service.GetSettingsAsync(id, institutionId);
            if (!response.Success)
            {
                return StatusCode(response.StatusCode, response);
            }

            return Ok(response);
        }

        /// <summary>
        /// Updates operational settings for an outlet (Admin role required)
        /// </summary>
        [HttpPut("{id:int}/settings")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<CanteenOutletSettingDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CanteenOutletSettingDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<CanteenOutletSettingDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateSettings([FromRoute] int id, [FromBody] UpdateOutletSettingsDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return BadRequest(ApiResponse<CanteenOutletSettingDto>.Fail("Validation failed.", errors));
            }

            var institutionId = User.ResolveInstitutionId();
            var userId = User.ResolveUserId();
            var userName = User.ResolveUserName();

            var response = await _service.UpdateSettingsAsync(id, institutionId, dto, userId, userName);
            if (!response.Success)
            {
                return StatusCode(response.StatusCode, response);
            }

            return Ok(response);
        }
    }
}

