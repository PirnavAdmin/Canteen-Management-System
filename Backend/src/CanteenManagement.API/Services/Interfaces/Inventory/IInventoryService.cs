using CanteenManagement.API.DTOs.Inventory;

namespace CanteenManagement.API.Services.Interfaces.Inventory
{
    public interface IInventoryService
    {
        Task<IEnumerable<InventoryItemDto>> GetItemsAsync(int institutionId, int? outletId = null);
        Task<StockMovementLedgerDto> RecordMovementAsync(RecordStockMovementDto dto, int institutionId, string performedBy);
        Task<IEnumerable<StockMovementLedgerDto>> GetLedgerAsync(int institutionId, int? outletId = null);
        Task<IEnumerable<PurchaseOrderDto>> GetPurchaseOrdersAsync(int institutionId, int? outletId = null);
        Task<PurchaseOrderDto> CreatePurchaseOrderAsync(CreatePurchaseOrderDto dto, int institutionId, string performedBy);
        Task<PurchaseOrderDto> UpdatePurchaseOrderStatusAsync(int id, string status, int institutionId, string performedBy);
        Task<IEnumerable<SupplierDto>> GetSuppliersAsync(int institutionId);
        Task<SupplierDto> CreateSupplierAsync(CreateSupplierDto dto, int institutionId, string performedBy);
    }
}
