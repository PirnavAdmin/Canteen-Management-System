using CanteenManagement.API.Models.Inventory;

namespace CanteenManagement.API.Repositories.Interfaces.Inventory
{
    public interface IInventoryRepository
    {
        Task<IEnumerable<InventoryItem>> GetItemsAsync(int campusId, int? outletId = null, string? storeType = null);
        Task<InventoryItem?> GetItemByIdAsync(int id, int campusId);
        Task<InventoryItem> AddItemAsync(InventoryItem item);
        Task<InventoryItem> UpdateItemAsync(InventoryItem item);
        Task<bool> DeleteItemAsync(int id, int campusId);
        Task<StockMovement> AddMovementAsync(StockMovement movement);
        Task<IEnumerable<StockMovement>> GetLedgerAsync(int campusId, int? outletId = null);
        Task<IEnumerable<PurchaseOrder>> GetPurchaseOrdersAsync(int campusId, int? outletId = null);
        Task<PurchaseOrder?> GetPurchaseOrderByIdAsync(int id, int campusId);
        Task<PurchaseOrder> CreatePurchaseOrderAsync(PurchaseOrder po);
        Task<PurchaseOrder> UpdatePurchaseOrderAsync(PurchaseOrder po);
        Task<IEnumerable<Supplier>> GetSuppliersAsync(int campusId);
        Task<Supplier?> GetSupplierByIdAsync(int id, int campusId);
        Task<Supplier> CreateSupplierAsync(Supplier supplier);
        Task<Supplier?> UpdateSupplierAsync(Supplier supplier);
        Task<(bool success, string actionTaken, int linkedPoCount)> DeleteSupplierAsync(int id, int campusId);
        Task<Supplier?> ToggleSupplierStatusAsync(int id, int campusId, string status);
        Task<IEnumerable<StockRequest>> GetStockRequestsAsync(int campusId, int? outletId = null, string? status = null);
        Task<StockRequest?> GetStockRequestByIdAsync(string id, int campusId);
        Task<StockRequest> CreateStockRequestAsync(StockRequest request);
        Task<StockRequest> UpdateStockRequestAsync(StockRequest request);
        Task<bool> DeleteStockRequestAsync(string id, int campusId);
    }
}
