using Asp.Versioning;
using CanteenManagement.API.DTOs.Inventory;
using CanteenManagement.API.Helpers;
using CanteenManagement.API.Services.Interfaces.Inventory;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CanteenManagement.API.Controllers.V1
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/canteen-inventory")]
    [Authorize(Policy = "RequireStaffOrAdmin")]
    public class InventoryController : ControllerBase
    {
        private readonly IInventoryService _inventoryService;

        public InventoryController(IInventoryService inventoryService)
        {
            _inventoryService = inventoryService;
        }

        [HttpGet]
        [HttpGet("items")]
        public async Task<IActionResult> GetItems([FromQuery] int? outletId)
        {
            var campusId = User.ResolveCampusId();
            var items = await _inventoryService.GetItemsAsync(campusId, outletId);
            return Ok(ApiResponse<IEnumerable<InventoryItemDto>>.SuccessResponse(items));
        }

        [HttpPost("items")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> CreateItem([FromBody] CreateInventoryItemDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return BadRequest(ApiResponse<string>.ErrorResponse("Validation failed.", errors));
            }

            var campusId = User.ResolveCampusId();
            var userName = User.ResolveUserName();
            var created = await _inventoryService.CreateItemAsync(dto, campusId, userName);
            return Ok(ApiResponse<InventoryItemDto>.SuccessResponse(created, $"Raw material '{created.IngredientName}' added to inventory successfully."));
        }

        [HttpPut("items/{id:int}")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> UpdateItem(int id, [FromBody] UpdateInventoryItemDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return BadRequest(ApiResponse<string>.ErrorResponse("Validation failed.", errors));
            }

            var campusId = User.ResolveCampusId();
            var userName = User.ResolveUserName();
            var updated = await _inventoryService.UpdateItemAsync(id, dto, campusId, userName);
            if (updated == null)
            {
                return NotFound(ApiResponse<string>.ErrorResponse($"Inventory item with ID {id} was not found."));
            }

            return Ok(ApiResponse<InventoryItemDto>.SuccessResponse(updated, $"Inventory item '{updated.IngredientName}' updated successfully."));
        }

        [HttpDelete("items/{id:int}")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> DeleteItem(int id)
        {
            var campusId = User.ResolveCampusId();
            var userName = User.ResolveUserName();
            var success = await _inventoryService.DeleteItemAsync(id, campusId, userName);
            if (!success)
            {
                return NotFound(ApiResponse<string>.ErrorResponse($"Inventory item with ID {id} was not found."));
            }

            return Ok(ApiResponse<bool>.SuccessResponse(true, "Inventory item deleted successfully."));
        }

        [HttpPost("movements")]
        public async Task<IActionResult> RecordMovement([FromBody] RecordStockMovementDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return BadRequest(ApiResponse<string>.ErrorResponse("Validation failed.", errors));
            }

            try
            {
                var campusId = User.ResolveCampusId();
                var userName = User.ResolveUserName();
                var result = await _inventoryService.RecordMovementAsync(dto, campusId, userName);
                return Ok(ApiResponse<StockMovementLedgerDto>.SuccessResponse(result, "Stock movement recorded successfully."));
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

        [HttpGet("ledger")]
        public async Task<IActionResult> GetLedger([FromQuery] int? outletId)
        {
            var campusId = User.ResolveCampusId();
            var ledger = await _inventoryService.GetLedgerAsync(campusId, outletId);
            return Ok(ApiResponse<IEnumerable<StockMovementLedgerDto>>.SuccessResponse(ledger));
        }

        [HttpGet("purchase-orders")]
        public async Task<IActionResult> GetPurchaseOrders([FromQuery] int? outletId)
        {
            var campusId = User.ResolveCampusId();
            var pos = await _inventoryService.GetPurchaseOrdersAsync(campusId, outletId);
            return Ok(ApiResponse<IEnumerable<PurchaseOrderDto>>.SuccessResponse(pos));
        }

        [HttpPost("purchase-orders")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> CreatePurchaseOrder([FromBody] CreatePurchaseOrderDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return BadRequest(ApiResponse<string>.ErrorResponse("Validation failed.", errors));
            }

            var campusId = User.ResolveCampusId();
            var userName = User.ResolveUserName();
            var created = await _inventoryService.CreatePurchaseOrderAsync(dto, campusId, userName);
            return Ok(ApiResponse<PurchaseOrderDto>.SuccessResponse(created, $"Purchase order {created.PoNumber} created."));
        }

        [HttpPatch("purchase-orders/{id}/status")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> UpdatePOStatus(int id, [FromBody] UpdatePOStatusRequest request)
        {
            try
            {
                var campusId = User.ResolveCampusId();
                var userName = User.ResolveUserName();
                var updated = await _inventoryService.UpdatePurchaseOrderStatusAsync(id, request.Status, campusId, userName);
                return Ok(ApiResponse<PurchaseOrderDto>.SuccessResponse(updated, $"PO status updated to {updated.Status}."));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<string>.ErrorResponse(ex.Message));
            }
        }

        [HttpGet("suppliers")]
        public async Task<IActionResult> GetSuppliers()
        {
            var campusId = User.ResolveCampusId();
            var suppliers = await _inventoryService.GetSuppliersAsync(campusId);
            return Ok(ApiResponse<IEnumerable<SupplierDto>>.SuccessResponse(suppliers));
        }

        [HttpPost("suppliers")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> CreateSupplier([FromBody] CreateSupplierDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return BadRequest(ApiResponse<string>.ErrorResponse("Validation failed.", errors));
            }

            var campusId = User.ResolveCampusId();
            var userName = User.ResolveUserName();
            var created = await _inventoryService.CreateSupplierAsync(dto, campusId, userName);
            return Ok(ApiResponse<SupplierDto>.SuccessResponse(created, $"Supplier '{created.Name}' created."));
        }

        [HttpPut("suppliers/{id:int}")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> UpdateSupplier(int id, [FromBody] UpdateSupplierDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return BadRequest(ApiResponse<string>.ErrorResponse("Validation failed.", errors));
            }

            var campusId = User.ResolveCampusId();
            var userName = User.ResolveUserName();
            var updated = await _inventoryService.UpdateSupplierAsync(id, dto, campusId, userName);
            if (updated == null)
            {
                return NotFound(ApiResponse<string>.ErrorResponse($"Supplier with ID {id} was not found."));
            }

            return Ok(ApiResponse<SupplierDto>.SuccessResponse(updated, $"Supplier '{updated.Name}' updated successfully."));
        }

        [HttpDelete("suppliers/{id:int}")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> DeleteSupplier(int id)
        {
            var campusId = User.ResolveCampusId();
            var userName = User.ResolveUserName();
            var result = await _inventoryService.DeleteSupplierAsync(id, campusId, userName);
            if (!result.Success && result.ActionTaken == "NOT_FOUND")
            {
                return NotFound(ApiResponse<string>.ErrorResponse(result.Message));
            }

            return Ok(ApiResponse<SupplierDeleteResultDto>.SuccessResponse(result, result.Message));
        }

        [HttpPatch("suppliers/{id:int}/status")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> UpdateSupplierStatus(int id, [FromBody] UpdateSupplierStatusDto dto)
        {
            var campusId = User.ResolveCampusId();
            var userName = User.ResolveUserName();
            var updated = await _inventoryService.UpdateSupplierStatusAsync(id, dto.Status, campusId, userName);
            if (updated == null)
            {
                return NotFound(ApiResponse<string>.ErrorResponse($"Supplier with ID {id} was not found."));
            }

            return Ok(ApiResponse<SupplierDto>.SuccessResponse(updated, $"Supplier status updated to '{dto.Status}'."));
        }

        [HttpGet("stock-requests")]
        public async Task<IActionResult> GetStockRequests([FromQuery] int? outletId, [FromQuery] string? status)
        {
            var campusId = User.ResolveCampusId();
            var requests = await _inventoryService.GetStockRequestsAsync(campusId, outletId, status);
            return Ok(ApiResponse<IEnumerable<StockRequestDto>>.SuccessResponse(requests));
        }

        [HttpPost("stock-requests")]
        public async Task<IActionResult> CreateStockRequest([FromBody] CreateStockRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return BadRequest(ApiResponse<string>.ErrorResponse("Validation failed.", errors));
            }

            var campusId = User.ResolveCampusId();
            var userName = User.ResolveUserName();
            var created = await _inventoryService.CreateStockRequestAsync(dto, campusId, userName);
            return Ok(ApiResponse<StockRequestDto>.SuccessResponse(created, $"Stock requisition #{created.RequestId} submitted successfully."));
        }

        [HttpPatch("stock-requests/{id:int}/dispatch")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> DispatchStockRequest(int id, [FromBody] DispatchStockRequestDto dto)
        {
            try
            {
                var campusId = User.ResolveCampusId();
                var userName = User.ResolveUserName();
                var updated = await _inventoryService.DispatchStockRequestAsync(id, dto, campusId, userName);
                return Ok(ApiResponse<StockRequestDto>.SuccessResponse(updated, $"Stock requisition #{id} dispatched from Main Inventory."));
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

        [HttpPatch("stock-requests/{id:int}/received")]
        public async Task<IActionResult> ReceiveStockRequest(int id)
        {
            try
            {
                var campusId = User.ResolveCampusId();
                var userName = User.ResolveUserName();
                var updated = await _inventoryService.ReceiveStockRequestAsync(id, campusId, userName);
                return Ok(ApiResponse<StockRequestDto>.SuccessResponse(updated, $"Stock requisition #{id} received into kitchen inventory."));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<string>.ErrorResponse(ex.Message));
            }
        }

        [HttpPatch("stock-requests/{id:int}/reject")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> RejectStockRequest(int id, [FromBody] RejectStockRequestDto dto)
        {
            try
            {
                var campusId = User.ResolveCampusId();
                var userName = User.ResolveUserName();
                var updated = await _inventoryService.RejectStockRequestAsync(id, dto.Reason, campusId, userName);
                return Ok(ApiResponse<StockRequestDto>.SuccessResponse(updated, $"Stock requisition #{id} has been rejected."));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<string>.ErrorResponse(ex.Message));
            }
        }

        [HttpDelete("stock-requests/{id:int}")]
        public async Task<IActionResult> DeleteStockRequest(int id)
        {
            var campusId = User.ResolveCampusId();
            var userName = User.ResolveUserName();
            var success = await _inventoryService.DeleteStockRequestAsync(id, campusId, userName);
            if (!success)
            {
                return NotFound(ApiResponse<string>.ErrorResponse($"Stock request with ID {id} was not found."));
            }
            return Ok(ApiResponse<bool>.SuccessResponse(true, "Stock request removed successfully."));
        }
    }

    public class UpdatePOStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}

