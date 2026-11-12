using CanteenManagement.API.Models.Inventory;

namespace CanteenManagement.API.Repositories.Interfaces.Inventory
{
    public interface IInventoryRepository
    {
        Task<IEnumerable<InventoryItem>> GetItemsAsync(int institutionId, int? outletId = null);
        Task<InventoryItem?> GetItemByIdAsync(int id, int institutionId);
        Task<InventoryItem> UpdateItemAsync(InventoryItem item);
        Task<StockMovement> AddMovementAsync(StockMovement movement);
        Task<IEnumerable<StockMovement>> GetLedgerAsync(int institutionId, int? outletId = null);
        Task<IEnumerable<PurchaseOrder>> GetPurchaseOrdersAsync(int institutionId, int? outletId = null);
        Task<PurchaseOrder?> GetPurchaseOrderByIdAsync(int id, int institutionId);
        Task<PurchaseOrder> CreatePurchaseOrderAsync(PurchaseOrder po);
        Task<PurchaseOrder> UpdatePurchaseOrderAsync(PurchaseOrder po);
        Task<IEnumerable<Supplier>> GetSuppliersAsync(int institutionId);
        Task<Supplier> CreateSupplierAsync(Supplier supplier);
    }
}
