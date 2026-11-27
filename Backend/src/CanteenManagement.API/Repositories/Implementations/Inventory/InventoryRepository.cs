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

        public async Task<IEnumerable<InventoryItem>> GetItemsAsync(int campusId, int? outletId = null, string? storeType = null)
        {
            var query = _dbContext.InventoryItems
                .Include(i => i.Outlet)
                .Include(i => i.Warehouse)
                .Where(i => i.CampusId == campusId);

            if (!string.IsNullOrWhiteSpace(storeType) && storeType.Equals("CentralWarehouse", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(i => i.WarehouseId != null || i.StoreType == "CentralWarehouse" || i.OutletId == null);
            }
            else if (outletId.HasValue && outletId.Value > 0)
            {
                query = query.Where(i => i.OutletId == outletId.Value && i.StoreType != "CentralWarehouse");
            }

            return await query.OrderBy(i => i.IngredientName).AsNoTracking().ToListAsync();
        }

        public async Task<InventoryItem?> GetItemByIdAsync(int id, int campusId)
        {
            return await _dbContext.InventoryItems
                .Include(i => i.Outlet)
                .Include(i => i.Warehouse)
                .FirstOrDefaultAsync(i => i.ItemId == id && i.CampusId == campusId);
        }

        public async Task<InventoryItem> AddItemAsync(InventoryItem item)
        {
            try
            {
                item.CreatedAt = DateTime.UtcNow;
                await _dbContext.InventoryItems.AddAsync(item);
                await _dbContext.SaveChangesAsync();
                return item;
            }
            catch
            {
                using var connection = _connectionFactory.CreateConnection();
                var created = await connection.QueryFirstOrDefaultAsync<InventoryItem>(
                    "sp_AddInventoryItem",
                    new
                    {
                        p_CampusId = item.CampusId,
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
        }

        public async Task<InventoryItem> UpdateItemAsync(InventoryItem item)
        {
            try
            {
                var existing = await _dbContext.InventoryItems.FirstOrDefaultAsync(i => i.ItemId == item.ItemId && i.CampusId == item.CampusId);
                if (existing != null)
                {
                    existing.IngredientName = item.IngredientName;
                    existing.Category = item.Category;
                    existing.AvailableQuantity = item.AvailableQuantity;
                    existing.Unit = item.Unit;
                    existing.ReorderLevel = item.ReorderLevel;
                    existing.CostPerUnit = item.CostPerUnit;
                    existing.BatchNumber = item.BatchNumber;
                    existing.ExpiryDate = item.ExpiryDate;
                    existing.Status = item.Status;
                    if (item.OutletId > 0) existing.OutletId = item.OutletId;
                    existing.UpdatedAt = DateTime.UtcNow;
                    await _dbContext.SaveChangesAsync();
                    return existing;
                }
            }
            catch { }

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

        public async Task<bool> DeleteItemAsync(int id, int campusId)
        {
            try
            {
                var item = await _dbContext.InventoryItems.FirstOrDefaultAsync(i => i.ItemId == id && i.CampusId == campusId);
                if (item == null) return false;

                var movements = _dbContext.StockMovements.Where(m => m.ItemId == id);
                _dbContext.StockMovements.RemoveRange(movements);

                _dbContext.InventoryItems.Remove(item);
                await _dbContext.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
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

        public async Task<IEnumerable<StockMovement>> GetLedgerAsync(int campusId, int? outletId = null)
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
                    new { p_CampusId = campusId, p_OutletId = outletId ?? 0 },
                    splitOn: "ItemId",
                    commandType: CommandType.StoredProcedure);

                return ledger;
            }
            catch
            {
                var query = _dbContext.StockMovements
                    .Include(m => m.Item)
                    .Where(m => m.Item != null && m.Item.CampusId == campusId);

                if (outletId.HasValue && outletId.Value > 0)
                {
                    query = query.Where(m => m.Item!.OutletId == outletId.Value);
                }

                return await query.OrderByDescending(m => m.DateTime).AsNoTracking().ToListAsync();
            }
        }

        public async Task<IEnumerable<PurchaseOrder>> GetPurchaseOrdersAsync(int campusId, int? outletId = null)
        {
            var query = _dbContext.PurchaseOrders
                .Include(p => p.Supplier)
                .Include(p => p.Warehouse)
                .Where(p => p.CampusId == campusId);

            if (outletId.HasValue && outletId.Value > 0)
            {
                query = query.Where(p => p.OutletId == outletId.Value);
            }

            return await query.OrderByDescending(p => p.OrderDate).AsNoTracking().ToListAsync();
        }

        public async Task<PurchaseOrder?> GetPurchaseOrderByIdAsync(int id, int campusId)
        {
            return await _dbContext.PurchaseOrders
                .Include(p => p.Supplier)
                .Include(p => p.Warehouse)
                .FirstOrDefaultAsync(p => p.PurchaseOrderId == id && p.CampusId == campusId);
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
                        p_CampusId = po.CampusId,
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

        public async Task<IEnumerable<Supplier>> GetSuppliersAsync(int campusId)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                return await connection.QueryAsync<Supplier>(
                    "sp_GetSuppliers",
                    new { p_CampusId = campusId },
                    commandType: CommandType.StoredProcedure);
            }
            catch
            {
                return await _dbContext.Suppliers
                    .Where(s => s.CampusId == campusId)
                    .OrderBy(s => s.Name)
                    .AsNoTracking()
                    .ToListAsync();
            }
        }

        public async Task<Supplier?> GetSupplierByIdAsync(int id, int campusId)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                return await connection.QueryFirstOrDefaultAsync<Supplier>(
                    "sp_GetSupplierById",
                    new { p_SupplierId = id, p_CampusId = campusId },
                    commandType: CommandType.StoredProcedure);
            }
            catch
            {
                return await _dbContext.Suppliers
                    .FirstOrDefaultAsync(s => s.SupplierId == id && s.CampusId == campusId);
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
                        p_CampusId = supplier.CampusId,
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

        public async Task<Supplier?> UpdateSupplierAsync(Supplier supplier)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                var updated = await connection.QueryFirstOrDefaultAsync<Supplier>(
                    "sp_UpdateSupplier",
                    new
                    {
                        p_SupplierId = supplier.SupplierId,
                        p_CampusId = supplier.CampusId,
                        p_Name = supplier.Name,
                        p_ContactPerson = supplier.ContactPerson,
                        p_Phone = supplier.Phone,
                        p_Email = supplier.Email,
                        p_Address = supplier.Address,
                        p_SuppliedCategories = supplier.SuppliedCategories,
                        p_Gstin = supplier.Gstin,
                        p_FssaiNumber = supplier.FssaiNumber,
                        p_Status = supplier.Status
                    },
                    commandType: CommandType.StoredProcedure);

                return updated ?? supplier;
            }
            catch
            {
                var existing = await _dbContext.Suppliers.FirstOrDefaultAsync(s => s.SupplierId == supplier.SupplierId && s.CampusId == supplier.CampusId);
                if (existing == null) return null;

                existing.Name = supplier.Name;
                existing.ContactPerson = supplier.ContactPerson;
                existing.Phone = supplier.Phone;
                existing.Email = supplier.Email;
                existing.Address = supplier.Address;
                existing.SuppliedCategories = supplier.SuppliedCategories;
                existing.Gstin = supplier.Gstin ?? existing.Gstin;
                existing.FssaiNumber = supplier.FssaiNumber ?? existing.FssaiNumber;
                existing.Status = supplier.Status ?? existing.Status;

                _dbContext.Suppliers.Update(existing);
                await _dbContext.SaveChangesAsync();
                return existing;
            }
        }

        public async Task<(bool success, string actionTaken, int linkedPoCount)> DeleteSupplierAsync(int id, int campusId)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                var result = await connection.QueryFirstOrDefaultAsync<dynamic>(
                    "sp_DeleteSupplier",
                    new { p_SupplierId = id, p_CampusId = campusId },
                    commandType: CommandType.StoredProcedure);

                if (result != null)
                {
                    var dict = (IDictionary<string, object>)result;
                    var successVal = dict.ContainsKey("Success") ? Convert.ToInt32(dict["Success"]) == 1 : true;
                    var action = dict.ContainsKey("ActionTaken") ? dict["ActionTaken"]?.ToString() ?? "HARD_DELETED" : "HARD_DELETED";
                    var poCount = dict.ContainsKey("LinkedPOCount") ? Convert.ToInt32(dict["LinkedPOCount"]) : 0;
                    return (successVal, action, poCount);
                }
                return (false, "NOT_FOUND", 0);
            }
            catch
            {
                var supplier = await _dbContext.Suppliers.FirstOrDefaultAsync(s => s.SupplierId == id && s.CampusId == campusId);
                if (supplier == null) return (false, "NOT_FOUND", 0);

                var poCount = await _dbContext.PurchaseOrders.CountAsync(po => po.SupplierId == id && po.CampusId == campusId);
                if (poCount > 0)
                {
                    supplier.Status = "Inactive";
                    _dbContext.Suppliers.Update(supplier);
                    await _dbContext.SaveChangesAsync();
                    return (true, "SOFT_DELETED", poCount);
                }

                _dbContext.Suppliers.Remove(supplier);
                await _dbContext.SaveChangesAsync();
                return (true, "HARD_DELETED", 0);
            }
        }

        public async Task<Supplier?> ToggleSupplierStatusAsync(int id, int campusId, string status)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                var updated = await connection.QueryFirstOrDefaultAsync<Supplier>(
                    "sp_ToggleSupplierStatus",
                    new { p_SupplierId = id, p_CampusId = campusId, p_Status = status },
                    commandType: CommandType.StoredProcedure);

                return updated;
            }
            catch
            {
                var supplier = await _dbContext.Suppliers.FirstOrDefaultAsync(s => s.SupplierId == id && s.CampusId == campusId);
                if (supplier == null) return null;

                supplier.Status = status;
                _dbContext.Suppliers.Update(supplier);
                await _dbContext.SaveChangesAsync();
                return supplier;
            }
        }

        public async Task<IEnumerable<StockRequest>> GetStockRequestsAsync(int campusId, int? outletId = null, string? status = null)
        {
            var query = _dbContext.StockRequests
                .Include(r => r.Outlet)
                .Include(r => r.Item)
                .Where(r => r.CampusId == campusId);

            if (outletId.HasValue && outletId.Value > 0)
            {
                query = query.Where(r => r.OutletId == outletId.Value);
            }

            if (!string.IsNullOrWhiteSpace(status) && !string.Equals(status, "ALL", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(r => r.Status == status);
            }

            return await query.OrderByDescending(r => r.CreatedAt).AsNoTracking().ToListAsync();
        }

        public async Task<StockRequest?> GetStockRequestByIdAsync(string id, int campusId)
        {
            return await _dbContext.StockRequests
                .Include(r => r.Outlet)
                .Include(r => r.Item)
                .FirstOrDefaultAsync(r => r.RequestId == id && r.CampusId == campusId);
        }

        public async Task<StockRequest> CreateStockRequestAsync(StockRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.RequestId))
            {
                request.RequestId = $"REQ-{DateTime.UtcNow:yyyy}-{Random.Shared.Next(1000, 9999)}";
            }
            request.CreatedAt = DateTime.UtcNow;
            await _dbContext.StockRequests.AddAsync(request);
            await _dbContext.SaveChangesAsync();
            return request;
        }

        public async Task<StockRequest> UpdateStockRequestAsync(StockRequest request)
        {
            request.UpdatedAt = DateTime.UtcNow;
            _dbContext.StockRequests.Update(request);
            await _dbContext.SaveChangesAsync();
            return request;
        }

        public async Task<bool> DeleteStockRequestAsync(string id, int campusId)
        {
            var req = await _dbContext.StockRequests.FirstOrDefaultAsync(r => r.RequestId == id && r.CampusId == campusId);
            if (req == null) return false;

            _dbContext.StockRequests.Remove(req);
            await _dbContext.SaveChangesAsync();
            return true;
        }
    }
}
