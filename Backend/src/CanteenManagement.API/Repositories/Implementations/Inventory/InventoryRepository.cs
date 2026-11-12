using CanteenManagement.API.Data;
using CanteenManagement.API.Models.Inventory;
using CanteenManagement.API.Repositories.Interfaces.Inventory;
using Microsoft.EntityFrameworkCore;

namespace CanteenManagement.API.Repositories.Implementations.Inventory
{
    public class InventoryRepository : IInventoryRepository
    {
        private readonly AppDbContext _dbContext;

        public InventoryRepository(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<IEnumerable<InventoryItem>> GetItemsAsync(int institutionId, int? outletId = null)
        {
            var query = _dbContext.InventoryItems
                .Include(i => i.Outlet)
                .Where(i => i.InstitutionId == institutionId);

            if (outletId.HasValue && outletId.Value > 0)
            {
                query = query.Where(i => i.OutletId == outletId.Value);
            }

            return await query.OrderBy(i => i.IngredientName).AsNoTracking().ToListAsync();
        }

        public async Task<InventoryItem?> GetItemByIdAsync(int id, int institutionId)
        {
            return await _dbContext.InventoryItems
                .Include(i => i.Outlet)
                .FirstOrDefaultAsync(i => i.ItemId == id && i.InstitutionId == institutionId);
        }

        public async Task<InventoryItem> UpdateItemAsync(InventoryItem item)
        {
            item.UpdatedAt = DateTime.UtcNow;
            _dbContext.InventoryItems.Update(item);
            await _dbContext.SaveChangesAsync();
            return item;
        }

        public async Task<StockMovement> AddMovementAsync(StockMovement movement)
        {
            await _dbContext.StockMovements.AddAsync(movement);
            await _dbContext.SaveChangesAsync();
            return movement;
        }

        public async Task<IEnumerable<StockMovement>> GetLedgerAsync(int institutionId, int? outletId = null)
        {
            var query = _dbContext.StockMovements
                .Include(m => m.Item)
                .Where(m => m.Item != null && m.Item.InstitutionId == institutionId);

            if (outletId.HasValue && outletId.Value > 0)
            {
                query = query.Where(m => m.Item!.OutletId == outletId.Value);
            }

            return await query.OrderByDescending(m => m.DateTime).AsNoTracking().ToListAsync();
        }

        public async Task<IEnumerable<PurchaseOrder>> GetPurchaseOrdersAsync(int institutionId, int? outletId = null)
        {
            var query = _dbContext.PurchaseOrders
                .Include(p => p.Supplier)
                .Where(p => p.InstitutionId == institutionId);

            if (outletId.HasValue && outletId.Value > 0)
            {
                query = query.Where(p => p.OutletId == outletId.Value);
            }

            return await query.OrderByDescending(p => p.OrderDate).AsNoTracking().ToListAsync();
        }

        public async Task<PurchaseOrder?> GetPurchaseOrderByIdAsync(int id, int institutionId)
        {
            return await _dbContext.PurchaseOrders
                .Include(p => p.Supplier)
                .FirstOrDefaultAsync(p => p.PurchaseOrderId == id && p.InstitutionId == institutionId);
        }

        public async Task<PurchaseOrder> CreatePurchaseOrderAsync(PurchaseOrder po)
        {
            await _dbContext.PurchaseOrders.AddAsync(po);
            await _dbContext.SaveChangesAsync();
            return po;
        }

        public async Task<PurchaseOrder> UpdatePurchaseOrderAsync(PurchaseOrder po)
        {
            po.UpdatedAt = DateTime.UtcNow;
            _dbContext.PurchaseOrders.Update(po);
            await _dbContext.SaveChangesAsync();
            return po;
        }

        public async Task<IEnumerable<Supplier>> GetSuppliersAsync(int institutionId)
        {
            return await _dbContext.Suppliers
                .Where(s => s.InstitutionId == institutionId)
                .OrderBy(s => s.Name)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Supplier> CreateSupplierAsync(Supplier supplier)
        {
            await _dbContext.Suppliers.AddAsync(supplier);
            await _dbContext.SaveChangesAsync();
            return supplier;
        }
    }
}
