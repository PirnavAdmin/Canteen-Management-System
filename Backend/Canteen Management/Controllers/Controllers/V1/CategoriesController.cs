using Asp.Versioning;
using CanteenManagement.API.DTOs.Categories;
using CanteenManagement.API.Helpers;
using CanteenManagement.API.Services.Interfaces.Categories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CanteenManagement.API.Controllers.V1
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/canteen-categories")]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoryService _categoryService;

        public CategoriesController(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var institutionId = User.ResolveInstitutionId();
            var categories = await _categoryService.GetAllAsync(institutionId);
            return Ok(ApiResponse<IEnumerable<CategoryDto>>.SuccessResponse(categories));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var institutionId = User.ResolveInstitutionId();
            var category = await _categoryService.GetByIdAsync(id, institutionId);
            if (category == null)
            {
                return NotFound(ApiResponse<string>.ErrorResponse($"Category with ID {id} was not found."));
            }
            return Ok(ApiResponse<CategoryDto>.SuccessResponse(category));
        }

        [HttpPost]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> Create([FromBody] CreateCategoryDto dto)
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
                var created = await _categoryService.CreateAsync(dto, institutionId, userName);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, ApiResponse<CategoryDto>.SuccessResponse(created, "Category created successfully."));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<string>.ErrorResponse(ex.Message));
            }
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateCategoryDto dto)
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
                var updated = await _categoryService.UpdateAsync(id, dto, institutionId, userName);
                return Ok(ApiResponse<CategoryDto>.SuccessResponse(updated, "Category updated successfully."));
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
                var toggled = await _categoryService.ToggleStatusAsync(id, institutionId, userName);
                return Ok(ApiResponse<CategoryDto>.SuccessResponse(toggled, $"Category status changed to {toggled.Status}."));
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
            var (success, blockedByPolicy, message) = await _categoryService.DeleteAsync(id, institutionId, userName);

            if (blockedByPolicy)
            {
                return StatusCode(StatusCodes.Status409Conflict, ApiResponse<string>.ErrorResponse(message!));
            }

            if (!success)
            {
                return NotFound(ApiResponse<string>.ErrorResponse(message ?? $"Category with ID {id} was not found."));
            }

            return Ok(ApiResponse<bool>.SuccessResponse(true, "Category deleted successfully."));
        }
    }
}

