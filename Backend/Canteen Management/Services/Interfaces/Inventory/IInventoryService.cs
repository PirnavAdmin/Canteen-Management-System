using CanteenManagement.API.DTOs.Inventory;

namespace CanteenManagement.API.Services.Interfaces.Inventory
{
    public interface IInventoryService
    {
        Task<IEnumerable<InventoryItemDto>> GetItemsAsync(int campusId, int? outletId = null);
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
    }
}

