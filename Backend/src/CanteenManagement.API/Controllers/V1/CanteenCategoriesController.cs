using Asp.Versioning;
using CanteenManagement.API.DTOs.CanteenCategory;
using CanteenManagement.API.DTOs.Common;
using CanteenManagement.API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CanteenManagement.API.Controllers.V1
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/canteen-categories")]
    [Produces("application/json")]
    public class CanteenCategoriesController : ControllerBase
    {
        private readonly ICanteenCategoryService _service;
        private readonly ILogger<CanteenCategoriesController> _logger;

        public CanteenCategoriesController(
            ICanteenCategoryService service,
            ILogger<CanteenCategoriesController> logger)
        {
            _service = service;
            _logger = logger;
        }

        /// <summary>
        /// Helper to extract InstitutionId from claims or header with fallback to default (1)
        /// </summary>
        private int GetInstitutionId()
        {
            var claim = User.Claims.FirstOrDefault(c => c.Type == "InstitutionId" || c.Type == "institution_id")?.Value;
            if (int.TryParse(claim, out var instId) && instId > 0)
            {
                return instId;
            }

            if (Request.Headers.TryGetValue("X-Institution-Id", out var headerVal) &&
                int.TryParse(headerVal.FirstOrDefault(), out var headerInstId) && headerInstId > 0)
            {
                return headerInstId;
            }

            return 1; // Default tenant
        }

        /// <summary>
        /// 1. GET /api/v1/canteen-categories
        /// Returns all categories for the institution, optionally filtered by active status.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<CanteenCategoryResponseDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll([FromQuery] bool? isActive = null)
        {
            var institutionId = GetInstitutionId();
            var response = await _service.GetAllAsync(institutionId, isActive);
            return Ok(response);
        }

        /// <summary>
        /// 2. GET /api/v1/canteen-categories/{id}
        /// Returns a single category by CategoryId.
        /// </summary>
        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(ApiResponse<CanteenCategoryResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CanteenCategoryResponseDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById([FromRoute] int id)
        {
            var institutionId = GetInstitutionId();
            var response = await _service.GetByIdAsync(id, institutionId);
            if (!response.Success)
            {
                return NotFound(response);
            }
            return Ok(response);
        }

        /// <summary>
        /// 3. POST /api/v1/canteen-categories
        /// Creates a new food category (e.g., Breakfast, Meals, Snacks, Beverages).
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<CanteenCategoryResponseDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<CanteenCategoryResponseDto>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Create([FromBody] CreateCanteenCategoryDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse<CanteenCategoryResponseDto>.Fail("Invalid category data."));
            }

            var institutionId = GetInstitutionId();
            var response = await _service.CreateAsync(institutionId, dto);
            if (!response.Success)
            {
                return BadRequest(response);
            }

            return CreatedAtAction(nameof(GetById), new { version = "1.0", id = response.Data?.CategoryId }, response);
        }

        /// <summary>
        /// 4. PUT /api/v1/canteen-categories/{id}
        /// Updates an existing category's name, description, and display order.
        /// </summary>
        [HttpPut("{id:int}")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] UpdateCanteenCategoryDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse<bool>.Fail("Invalid category data."));
            }

            var institutionId = GetInstitutionId();
            var response = await _service.UpdateAsync(id, institutionId, dto);
            if (!response.Success)
            {
                if (response.Message == "Category not found.") return NotFound(response);
                return BadRequest(response);
            }

            return Ok(response);
        }

        /// <summary>
        /// 5. PATCH /api/v1/canteen-categories/{id}/status
        /// Activates or deactivates a category. Prevents deletion to preserve historical orders.
        /// </summary>
        [HttpPatch("{id:int}/status")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ToggleStatus([FromRoute] int id, [FromBody] ToggleCategoryStatusDto dto)
        {
            var institutionId = GetInstitutionId();
            var response = await _service.ToggleStatusAsync(id, institutionId, dto.IsActive);
            if (!response.Success)
            {
                if (response.Message == "Category not found.") return NotFound(response);
                return BadRequest(response);
            }

            return Ok(response);
        }
    }
}
