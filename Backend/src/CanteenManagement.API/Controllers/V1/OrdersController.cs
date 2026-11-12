using Asp.Versioning;
using CanteenManagement.API.DTOs.Orders;
using CanteenManagement.API.Helpers;
using CanteenManagement.API.Services.Interfaces.Orders;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CanteenManagement.API.Controllers.V1
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/canteen-orders")]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;

        public OrdersController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? outletId, [FromQuery] string? status, [FromQuery] string? searchTerm)
        {
            var institutionId = User.ResolveInstitutionId();
            var orders = await _orderService.GetAllAsync(institutionId, outletId, status, searchTerm);
            return Ok(ApiResponse<IEnumerable<OrderDto>>.SuccessResponse(orders));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var institutionId = User.ResolveInstitutionId();
            var order = await _orderService.GetByIdAsync(id, institutionId);
            if (order == null)
            {
                return NotFound(ApiResponse<string>.ErrorResponse($"Order with ID {id} was not found."));
            }
            return Ok(ApiResponse<OrderDto>.SuccessResponse(order));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateOrderDto dto)
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
                var created = await _orderService.CreateAsync(dto, institutionId, userName);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, ApiResponse<OrderDto>.SuccessResponse(created, $"Order created with token {created.Token}."));
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
        [Authorize(Policy = "RequireStaffOrAdmin")]
        public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateOrderStatusDto dto)
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
                var updated = await _orderService.UpdateStatusAsync(id, dto, institutionId, userName);
                return Ok(ApiResponse<OrderDto>.SuccessResponse(updated, $"Order transitioned to {updated.Status}."));
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

        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> Cancel(string id, [FromBody] CancelOrderDto dto)
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
                var updated = await _orderService.CancelOrderAsync(id, dto, institutionId, userName);
                return Ok(ApiResponse<OrderDto>.SuccessResponse(updated, "Order cancelled successfully."));
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

        [HttpPost("{id}/refund")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> ProcessRefund(string id)
        {
            try
            {
                var institutionId = User.ResolveInstitutionId();
                var userName = User.ResolveUserName();
                var updated = await _orderService.ProcessRefundAsync(id, institutionId, userName);
                return Ok(ApiResponse<OrderDto>.SuccessResponse(updated, $"Refund of ₹{updated.TotalAmount} processed successfully."));
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
    }
}

