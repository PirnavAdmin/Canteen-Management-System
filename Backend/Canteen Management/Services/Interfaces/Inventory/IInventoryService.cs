using CanteenManagement.API.DTOs.Inventory;

namespace CanteenManagement.API.Services.Interfaces.Inventory
{
    public interface IInventoryService
    {
        Task<IEnumerable<InventoryItemDto>> GetItemsAsync(int campusId, int? outletId = null, string? storeType = null);
        Task<InventoryItemDto> CreateItemAsync(CreateInventoryItemDto dto, int campusId, string performedBy);
        Task<InventoryItemDto?> UpdateItemAsync(int id, UpdateInventoryItemDto dto, int campusId, string performedBy);
        Task<bool> DeleteItemAsync(int id, int campusId, string performedBy);
        Task<StockMovementLedgerDto> RecordMovementAsync(RecordStockMovementDto dto, int campusId, string performedBy);
        Task<IEnumerable<StockMovementLedgerDto>> GetLedgerAsync(int campusId, int? outletId = null);
        Task<IEnumerable<PurchaseOrderDto>> GetPurchaseOrdersAsync(int campusId, int? outletId = null);
        Task<PurchaseOrderDto> CreatePurchaseOrderAsync(CreatePurchaseOrderDto dto, int campusId, string performedBy);
        Task<PurchaseOrderDto> UpdatePurchaseOrderStatusAsync(int id, string status, int campusId, string performedBy);
        Task<IEnumerable<SupplierDto>> GetSuppliersAsync(int campusId);
        Task<SupplierDto> CreateSupplierAsync(CreateSupplierDto dto, int campusId, string performedBy);
        Task<SupplierDto?> UpdateSupplierAsync(int id, UpdateSupplierDto dto, int campusId, string performedBy);
        Task<SupplierDeleteResultDto> DeleteSupplierAsync(int id, int campusId, string performedBy);
        Task<SupplierDto?> UpdateSupplierStatusAsync(int id, string status, int campusId, string performedBy);
        Task<IEnumerable<StockRequestDto>> GetStockRequestsAsync(int campusId, int? outletId = null, string? status = null);
        Task<StockRequestDto> CreateStockRequestAsync(CreateStockRequestDto dto, int campusId, string requestedBy);
        Task<StockRequestDto> UpdateStockRequestAsync(string id, UpdateStockRequestDto dto, int campusId, string performedBy);
        Task<StockRequestDto> DispatchStockRequestAsync(string id, DispatchStockRequestDto dto, int campusId, string performedBy);
        Task<StockRequestDto> ReceiveStockRequestAsync(string id, int campusId, string performedBy);
        Task<StockRequestDto> RejectStockRequestAsync(string id, string reason, int campusId, string performedBy);
        Task<bool> DeleteStockRequestAsync(string id, int campusId, string performedBy);
    }
}
