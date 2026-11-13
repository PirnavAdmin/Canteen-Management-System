using System.Data;
using CanteenManagement.API.Data;
using CanteenManagement.API.Models.Inventory;
using CanteenManagement.API.Models.Outlets;
using CanteenManagement.API.Repositories.Interfaces.Inventory;
using Dapper;
using Microsoft.EntityFrameworkCore;

namespace CanteenManagement.API.Repositories.Implementations.Inventory
{
    public class InventoryRepository : IInventoryRepository
    {
        private readonly AppDbContext _dbContext;
        private readonly IDbConnectionFactory _connectionFactory;

        public InventoryRepository(AppDbContext dbContext, IDbConnectionFactory connectionFactory)
        {
            _dbContext = dbContext;
            _connectionFactory = connectionFactory;
        }

        public async Task<IEnumerable<InventoryItem>> GetItemsAsync(int institutionId, int? outletId = null)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                var items = await connection.QueryAsync<InventoryItem, CanteenOutlet, InventoryItem>(
                    "sp_GetInventoryItems",
                    (item, outlet) =>
                    {
                        item.Outlet = outlet;
                        return item;
                    },
                    new { p_InstitutionId = institutionId, p_OutletId = outletId ?? 0 },
                    splitOn: "OutletId",
                    commandType: CommandType.StoredProcedure);

                return items;
            }
            catch
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
        }

        public async Task<InventoryItem?> GetItemByIdAsync(int id, int institutionId)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                var items = await connection.QueryAsync<InventoryItem, CanteenOutlet, InventoryItem>(
                    "sp_GetInventoryItemById",
                    (item, outlet) =>
                    {
                        item.Outlet = outlet;
                        return item;
                    },
                    new { p_ItemId = id, p_InstitutionId = institutionId },
                    splitOn: "OutletId",
                    commandType: CommandType.StoredProcedure);

                return items.FirstOrDefault();
            }
            catch
            {
                return await _dbContext.InventoryItems
                    .Include(i => i.Outlet)
                    .FirstOrDefaultAsync(i => i.ItemId == id && i.InstitutionId == institutionId);
            }
        }

        public async Task<InventoryItem> AddItemAsync(InventoryItem item)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                var created = await connection.QueryFirstOrDefaultAsync<InventoryItem>(
                    "sp_AddInventoryItem",
                    new
                    {
                        p_InstitutionId = item.InstitutionId,
                        p_OutletId = item.OutletId,
                        p_IngredientName = item.IngredientName,
                        p_Category = item.Category,
                        p_AvailableQuantity = item.AvailableQuantity,
                        p_Unit = item.Unit,
                        p_ReorderLevel = item.ReorderLevel,
                        p_CostPerUnit = item.CostPerUnit,
                        p_BatchNumber = item.BatchNumber,
                        p_ExpiryDate = item.ExpiryDate,
                        p_Status = item.Status
                    },
                    commandType: CommandType.StoredProcedure);

                return created ?? item;
            }
            catch
            {
                await _dbContext.InventoryItems.AddAsync(item);
                await _dbContext.SaveChangesAsync();
                return item;
            }
        }

        public async Task<InventoryItem> UpdateItemAsync(InventoryItem item)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                var updated = await connection.QueryFirstOrDefaultAsync<InventoryItem>(
                    "sp_UpdateInventoryItem",
                    new
                    {
                        p_ItemId = item.ItemId,
                        p_AvailableQuantity = item.AvailableQuantity,
                        p_CostPerUnit = item.CostPerUnit,
                        p_Status = item.Status
                    },
                    commandType: CommandType.StoredProcedure);

                return updated ?? item;
            }
            catch
            {
                item.UpdatedAt = DateTime.UtcNow;
                _dbContext.InventoryItems.Update(item);
                await _dbContext.SaveChangesAsync();
                return item;
            }
        }

        public async Task<StockMovement> AddMovementAsync(StockMovement movement)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                var created = await connection.QueryFirstOrDefaultAsync<StockMovement>(
                    "sp_AddStockMovement",
                    new
                    {
                        p_ItemId = movement.ItemId,
                        p_MovementType = movement.MovementType,
                        p_Quantity = movement.Quantity,
                        p_BatchNumber = movement.BatchNumber,
                        p_ExpiryDate = movement.ExpiryDate,
                        p_Reference = movement.Reference,
                        p_Reason = movement.Reason,
                        p_PerformedBy = movement.PerformedBy
                    },
                    commandType: CommandType.StoredProcedure);

                return created ?? movement;
            }
            catch
            {
                await _dbContext.StockMovements.AddAsync(movement);
                await _dbContext.SaveChangesAsync();
                return movement;
            }
        }

        public async Task<IEnumerable<StockMovement>> GetLedgerAsync(int institutionId, int? outletId = null)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                var ledger = await connection.QueryAsync<StockMovement, InventoryItem, StockMovement>(
                    "sp_GetStockLedger",
                    (movement, item) =>
                    {
                        movement.Item = item;
                        return movement;
                    },
                    new { p_InstitutionId = institutionId, p_OutletId = outletId ?? 0 },
                    splitOn: "ItemId",
                    commandType: CommandType.StoredProcedure);

                return ledger;
            }
            catch
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
        }

        public async Task<IEnumerable<PurchaseOrder>> GetPurchaseOrdersAsync(int institutionId, int? outletId = null)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                return await connection.QueryAsync<PurchaseOrder>(
                    "sp_GetPurchaseOrders",
                    new { p_InstitutionId = institutionId, p_OutletId = outletId ?? 0 },
                    commandType: CommandType.StoredProcedure);
            }
            catch
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
        }

        public async Task<PurchaseOrder?> GetPurchaseOrderByIdAsync(int id, int institutionId)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                return await connection.QueryFirstOrDefaultAsync<PurchaseOrder>(
                    "sp_GetPurchaseOrderById",
                    new { p_PurchaseOrderId = id, p_InstitutionId = institutionId },
                    commandType: CommandType.StoredProcedure);
            }
            catch
            {
                return await _dbContext.PurchaseOrders
                    .Include(p => p.Supplier)
                    .FirstOrDefaultAsync(p => p.PurchaseOrderId == id && p.InstitutionId == institutionId);
            }
        }

        public async Task<PurchaseOrder> CreatePurchaseOrderAsync(PurchaseOrder po)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                var created = await connection.QueryFirstOrDefaultAsync<PurchaseOrder>(
                    "sp_CreatePurchaseOrder",
                    new
                    {
                        p_InstitutionId = po.InstitutionId,
                        p_OutletId = po.OutletId,
                        p_PoNumber = po.PoNumber,
                        p_SupplierId = po.SupplierId,
                        p_SupplierName = po.SupplierName,
                        p_OrderDate = po.OrderDate,
                        p_ExpectedDelivery = po.ExpectedDelivery,
                        p_TotalAmount = po.TotalAmount,
                        p_Status = po.Status,
                        p_ItemsJson = po.ItemsJson
                    },
                    commandType: CommandType.StoredProcedure);

                return created ?? po;
            }
            catch
            {
                await _dbContext.PurchaseOrders.AddAsync(po);
                await _dbContext.SaveChangesAsync();
                return po;
            }
        }

        public async Task<PurchaseOrder> UpdatePurchaseOrderAsync(PurchaseOrder po)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                var updated = await connection.QueryFirstOrDefaultAsync<PurchaseOrder>(
                    "sp_UpdatePurchaseOrderStatus",
                    new
                    {
                        p_PurchaseOrderId = po.PurchaseOrderId,
                        p_Status = po.Status
                    },
                    commandType: CommandType.StoredProcedure);

                return updated ?? po;
            }
            catch
            {
                po.UpdatedAt = DateTime.UtcNow;
                _dbContext.PurchaseOrders.Update(po);
                await _dbContext.SaveChangesAsync();
                return po;
            }
        }

        public async Task<IEnumerable<Supplier>> GetSuppliersAsync(int institutionId)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                return await connection.QueryAsync<Supplier>(
                    "sp_GetSuppliers",
                    new { p_InstitutionId = institutionId },
                    commandType: CommandType.StoredProcedure);
            }
            catch
            {
                return await _dbContext.Suppliers
                    .Where(s => s.InstitutionId == institutionId)
                    .OrderBy(s => s.Name)
                    .AsNoTracking()
                    .ToListAsync();
            }
        }

        public async Task<Supplier?> GetSupplierByIdAsync(int id, int institutionId)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                return await connection.QueryFirstOrDefaultAsync<Supplier>(
                    "sp_GetSupplierById",
                    new { p_SupplierId = id, p_InstitutionId = institutionId },
                    commandType: CommandType.StoredProcedure);
            }
            catch
            {
                return await _dbContext.Suppliers
                    .FirstOrDefaultAsync(s => s.SupplierId == id && s.InstitutionId == institutionId);
            }
        }

        public async Task<Supplier> CreateSupplierAsync(Supplier supplier)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                var created = await connection.QueryFirstOrDefaultAsync<Supplier>(
                    "sp_CreateSupplier",
                    new
                    {
                        p_InstitutionId = supplier.InstitutionId,
                        p_Name = supplier.Name,
                        p_ContactPerson = supplier.ContactPerson,
                        p_Phone = supplier.Phone,
                        p_Email = supplier.Email,
                        p_Address = supplier.Address,
                        p_SuppliedCategories = supplier.SuppliedCategories,
                        p_Status = supplier.Status
                    },
                    commandType: CommandType.StoredProcedure);

                return created ?? supplier;
            }
            catch
            {
                await _dbContext.Suppliers.AddAsync(supplier);
                await _dbContext.SaveChangesAsync();
                return supplier;
            }
        }
    }
}
