using Asp.Versioning;
using CanteenManagement.API.DTOs.Feedback;
using CanteenManagement.API.Helpers;
using CanteenManagement.API.Services.Interfaces.Feedback;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CanteenManagement.API.Controllers.V1
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/canteen-feedback")]
    public class FeedbackController : ControllerBase
    {
        private readonly IFeedbackService _feedbackService;

        public FeedbackController(IFeedbackService feedbackService)
        {
            _feedbackService = feedbackService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? outletId, [FromQuery] string? status, [FromQuery] int? rating)
        {
            var institutionId = User.ResolveInstitutionId();
            var tickets = await _feedbackService.GetAllAsync(institutionId, outletId, status, rating);
            return Ok(ApiResponse<IEnumerable<FeedbackDto>>.SuccessResponse(tickets));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var institutionId = User.ResolveInstitutionId();
            var ticket = await _feedbackService.GetByIdAsync(id, institutionId);
            if (ticket == null)
            {
                return NotFound(ApiResponse<string>.ErrorResponse($"Ticket with ID {id} was not found."));
            }
            return Ok(ApiResponse<FeedbackDto>.SuccessResponse(ticket));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateFeedbackDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return BadRequest(ApiResponse<string>.ErrorResponse("Validation failed.", errors));
            }

            var institutionId = User.ResolveInstitutionId();
            var userName = User.ResolveUserName();
            var created = await _feedbackService.CreateAsync(dto, institutionId, userName);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, ApiResponse<FeedbackDto>.SuccessResponse(created, "Feedback submitted successfully."));
        }

        [HttpPost("{id}/resolve")]
        [Authorize(Policy = "RequireStaffOrAdmin")]
        public async Task<IActionResult> Resolve(string id, [FromBody] ResolveFeedbackDto dto)
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
                var updated = await _feedbackService.ResolveTicketAsync(id, dto, institutionId, userName);
                return Ok(ApiResponse<FeedbackDto>.SuccessResponse(updated, $"Ticket resolved with status {updated.Status}."));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<string>.ErrorResponse(ex.Message));
            }
        }
    }
}

