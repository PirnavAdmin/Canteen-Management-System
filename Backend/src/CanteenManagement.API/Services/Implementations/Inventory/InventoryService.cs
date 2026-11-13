using System.Text.Json;
using CanteenManagement.API.DTOs.Inventory;
using CanteenManagement.API.Models.Inventory;
using CanteenManagement.API.Repositories.Interfaces.Inventory;
using CanteenManagement.API.Services.Interfaces.Common;
using CanteenManagement.API.Services.Interfaces.Inventory;

namespace CanteenManagement.API.Services.Implementations.Inventory
{
    public class InventoryService : IInventoryService
    {
        private readonly IInventoryRepository _repository;
        private readonly IAuditLoggingService _auditService;

        public InventoryService(IInventoryRepository repository, IAuditLoggingService auditService)
        {
            _repository = repository;
            _auditService = auditService;
        }

        public async Task<IEnumerable<InventoryItemDto>> GetItemsAsync(int institutionId, int? outletId = null)
        {
            var items = await _repository.GetItemsAsync(institutionId, outletId);
            return items.Select(MapToItemDto).ToList();
        }

        public async Task<StockMovementLedgerDto> RecordMovementAsync(RecordStockMovementDto dto, int institutionId, string performedBy)
        {
            var item = await _repository.GetItemByIdAsync(dto.IngredientId, institutionId);
            if (item == null)
            {
                throw new KeyNotFoundException($"Inventory item with ID {dto.IngredientId} was not found.");
            }

            decimal absQty = Math.Abs(dto.Quantity);

            if (dto.MovementType == "Stock In")
            {
                item.AvailableQuantity += absQty;
            }
            else if (dto.MovementType == "Stock Out" || dto.MovementType == "Wastage")
            {
                if (item.AvailableQuantity < absQty)
                {
                    throw new InvalidOperationException($"Insufficient stock: Only {item.AvailableQuantity} {item.Unit} available, but attempted to deduct {absQty} {item.Unit}.");
                }
                item.AvailableQuantity -= absQty;
            }
            else if (dto.MovementType == "Adjustment")
            {
                item.AvailableQuantity += dto.Quantity;
                if (item.AvailableQuantity < 0)
                {
                    throw new InvalidOperationException("Adjustment cannot result in negative stock quantity.");
                }
            }

            // Recalculate status
            if (item.AvailableQuantity <= 0) item.Status = "Out of Stock";
            else if (item.AvailableQuantity <= item.ReorderLevel) item.Status = "Low Stock";
            else item.Status = "In Stock";

            await _repository.UpdateItemAsync(item);

            var movement = new StockMovement
            {
                ItemId = item.ItemId,
                MovementType = dto.MovementType,
                Quantity = dto.Quantity,
                BatchNumber = dto.BatchNumber ?? item.BatchNumber,
                ExpiryDate = dto.ExpiryDate ?? item.ExpiryDate,
                Reference = dto.Reference ?? $"ADJ-{Random.Shared.Next(100, 999)}",
                Reason = dto.Reason.Trim(),
                PerformedBy = performedBy,
                DateTime = DateTime.UtcNow
            };

            var createdMovement = await _repository.AddMovementAsync(movement);

            await _auditService.LogActionAsync(
                institutionId,
                null,
                performedBy,
                "RECORD_STOCK_MOVEMENT",
                "InventoryItem",
                item.ItemId.ToString(),
                $"{dto.MovementType} of {dto.Quantity} {item.Unit} on '{item.IngredientName}'. Reason: {dto.Reason}."
            );

            return new StockMovementLedgerDto
            {
                Id = createdMovement.MovementId,
                IngredientId = item.ItemId,
                IngredientName = item.IngredientName,
                MovementType = createdMovement.MovementType,
                Quantity = createdMovement.Quantity,
                Unit = item.Unit,
                BatchNumber = createdMovement.BatchNumber,
                ExpiryDate = createdMovement.ExpiryDate?.ToString("yyyy-MM-dd"),
                Reference = createdMovement.Reference,
                Reason = createdMovement.Reason,
                PerformedBy = createdMovement.PerformedBy,
                DateTime = createdMovement.DateTime
            };
        }

        public async Task<IEnumerable<StockMovementLedgerDto>> GetLedgerAsync(int institutionId, int? outletId = null)
        {
            var movements = await _repository.GetLedgerAsync(institutionId, outletId);
            return movements.Select(m => new StockMovementLedgerDto
            {
                Id = m.MovementId,
                IngredientId = m.ItemId,
                IngredientName = m.Item?.IngredientName ?? string.Empty,
                MovementType = m.MovementType,
                Quantity = m.Quantity,
                Unit = m.Item?.Unit ?? "kg",
                BatchNumber = m.BatchNumber,
                ExpiryDate = m.ExpiryDate?.ToString("yyyy-MM-dd"),
                Reference = m.Reference,
                Reason = m.Reason,
                PerformedBy = m.PerformedBy,
                DateTime = m.DateTime
            }).ToList();
        }

        private static List<PurchaseOrderItemDto> ParseItemsJson(string? json)
        {
            if (string.IsNullOrWhiteSpace(json)) return new List<PurchaseOrderItemDto>();
            try
            {
                return JsonSerializer.Deserialize<List<PurchaseOrderItemDto>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
                    ?? new List<PurchaseOrderItemDto>();
            }
            catch
            {
                return new List<PurchaseOrderItemDto>();
            }
        }

        public async Task<IEnumerable<PurchaseOrderDto>> GetPurchaseOrdersAsync(int institutionId, int? outletId = null)
        {
            var pos = await _repository.GetPurchaseOrdersAsync(institutionId, outletId);
            return pos.Select(p => new PurchaseOrderDto
            {
                Id = p.PurchaseOrderId,
                OutletId = p.OutletId,
                PoNumber = p.PoNumber,
                SupplierId = p.SupplierId,
                SupplierName = p.SupplierName ?? p.Supplier?.Name ?? "Institutional Supplier",
                OrderDate = p.OrderDate.ToString("yyyy-MM-dd"),
                ExpectedDelivery = p.ExpectedDelivery?.ToString("yyyy-MM-dd"),
                TotalAmount = p.TotalAmount,
                Status = p.Status,
                Items = ParseItemsJson(p.ItemsJson),
                CreatedAt = p.CreatedAt
            }).ToList();
        }

        public async Task<PurchaseOrderDto> CreatePurchaseOrderAsync(CreatePurchaseOrderDto dto, int institutionId, string performedBy)
        {
            var supplierName = dto.SupplierName;
            if (string.IsNullOrWhiteSpace(supplierName) && dto.SupplierId.HasValue)
            {
                var sup = await _repository.GetSupplierByIdAsync(dto.SupplierId.Value, institutionId);
                supplierName = sup?.Name;
            }

            var totalAmount = dto.TotalAmount;
            if (totalAmount <= 0 && dto.Items != null && dto.Items.Count > 0)
            {
                totalAmount = dto.Items.Sum(i => i.Total > 0 ? i.Total : (i.Qty * i.UnitPrice));
            }

            var itemsJson = dto.Items != null && dto.Items.Count > 0
                ? JsonSerializer.Serialize(dto.Items)
                : null;

            var po = new PurchaseOrder
            {
                InstitutionId = institutionId,
                OutletId = dto.OutletId,
                PoNumber = $"PO-{DateTime.UtcNow.Year}-{Random.Shared.Next(1000, 9999)}",
                SupplierId = dto.SupplierId,
                SupplierName = supplierName,
                OrderDate = DateTime.UtcNow.Date,
                ExpectedDelivery = dto.ExpectedDelivery?.Date,
                TotalAmount = totalAmount,
                Status = "Submitted",
                ItemsJson = itemsJson,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _repository.CreatePurchaseOrderAsync(po);

            await _auditService.LogActionAsync(
                institutionId,
                null,
                performedBy,
                "CREATE_PURCHASE_ORDER",
                "PurchaseOrder",
                created.PurchaseOrderId.ToString(),
                $"Purchase order {created.PoNumber} created for amount {created.TotalAmount}."
            );

            return new PurchaseOrderDto
            {
                Id = created.PurchaseOrderId,
                OutletId = created.OutletId,
                PoNumber = created.PoNumber,
                SupplierId = created.SupplierId,
                SupplierName = created.SupplierName,
                OrderDate = created.OrderDate.ToString("yyyy-MM-dd"),
                ExpectedDelivery = created.ExpectedDelivery?.ToString("yyyy-MM-dd"),
                TotalAmount = created.TotalAmount,
                Status = created.Status,
                Items = ParseItemsJson(created.ItemsJson),
                CreatedAt = created.CreatedAt
            };
        }

        public async Task<PurchaseOrderDto> UpdatePurchaseOrderStatusAsync(int id, string status, int institutionId, string performedBy)
        {
            var po = await _repository.GetPurchaseOrderByIdAsync(id, institutionId);
            if (po == null)
            {
                throw new KeyNotFoundException($"Purchase order {id} was not found.");
            }

            var previousStatus = po.Status;
            po.Status = status;
            var updated = await _repository.UpdatePurchaseOrderAsync(po);

            // Step 5 -> Step 6: When PO status transitions to "Received", automatically inward goods to stock & ledger!
            if (!string.Equals(previousStatus, "Received", StringComparison.OrdinalIgnoreCase) &&
                string.Equals(status, "Received", StringComparison.OrdinalIgnoreCase))
            {
                var items = ParseItemsJson(po.ItemsJson);
                if (items != null && items.Count > 0)
                {
                    var existingStockItems = (await _repository.GetItemsAsync(institutionId, po.OutletId > 0 ? po.OutletId : null)).ToList();

                    foreach (var item in items)
                    {
                        if (string.IsNullOrWhiteSpace(item.IngredientName) || item.Qty <= 0) continue;

                        var targetName = item.IngredientName.Trim();
                        var match = existingStockItems.FirstOrDefault(s =>
                            string.Equals(s.IngredientName.Trim(), targetName, StringComparison.OrdinalIgnoreCase));

                        int targetItemId;
                        string unit = string.IsNullOrWhiteSpace(item.Unit) ? "kg" : item.Unit.Trim();

                        if (match != null)
                        {
                            match.AvailableQuantity += (decimal)item.Qty;
                            if (item.UnitPrice > 0) match.CostPerUnit = item.UnitPrice;

                            if (match.AvailableQuantity <= 0) match.Status = "Out of Stock";
                            else if (match.AvailableQuantity <= match.ReorderLevel) match.Status = "Low Stock";
                            else match.Status = "In Stock";

                            await _repository.UpdateItemAsync(match);
                            targetItemId = match.ItemId;
                        }
                        else
                        {
                            var newItem = new InventoryItem
                            {
                                InstitutionId = institutionId,
                                OutletId = po.OutletId > 0 ? po.OutletId : 1,
                                IngredientName = targetName,
                                Category = "Groceries",
                                AvailableQuantity = (decimal)item.Qty,
                                Unit = unit,
                                ReorderLevel = Math.Max(5, (decimal)item.Qty * 0.2m),
                                CostPerUnit = item.UnitPrice > 0 ? item.UnitPrice : 0,
                                BatchNumber = $"PO-{po.PurchaseOrderId}-{DateTime.UtcNow:yyyyMMdd}",
                                ExpiryDate = po.ExpectedDelivery?.AddDays(30) ?? DateTime.UtcNow.AddDays(30),
                                Status = "In Stock",
                                CreatedAt = DateTime.UtcNow
                            };
                            var createdItem = await _repository.AddItemAsync(newItem);
                            targetItemId = createdItem.ItemId;
                            existingStockItems.Add(createdItem);
                        }

                        // Create Stock Movement log entry for Movement Ledger
                        var movement = new StockMovement
                        {
                            ItemId = targetItemId,
                            MovementType = "Stock In",
                            Quantity = (decimal)item.Qty,
                            BatchNumber = $"PO-{po.PurchaseOrderId}-{DateTime.UtcNow:yyyyMMdd}",
                            ExpiryDate = po.ExpectedDelivery?.AddDays(30) ?? DateTime.UtcNow.AddDays(30),
                            Reference = po.PoNumber,
                            Reason = $"Procurement arrival from {po.SupplierName ?? "Supplier"} (PO: {po.PoNumber})",
                            PerformedBy = string.IsNullOrWhiteSpace(performedBy) ? "Campus Inventory Incharge" : performedBy,
                            DateTime = DateTime.UtcNow
                        };
                        await _repository.AddMovementAsync(movement);
                    }
                }
            }

            await _auditService.LogActionAsync(
                institutionId,
                null,
                performedBy,
                "UPDATE_PO_STATUS",
                "PurchaseOrder",
                updated.PurchaseOrderId.ToString(),
                $"PO {updated.PoNumber} status changed to {status}."
            );

            return new PurchaseOrderDto
            {
                Id = updated.PurchaseOrderId,
                OutletId = updated.OutletId,
                PoNumber = updated.PoNumber,
                SupplierId = updated.SupplierId,
                SupplierName = updated.SupplierName,
                OrderDate = updated.OrderDate.ToString("yyyy-MM-dd"),
                ExpectedDelivery = updated.ExpectedDelivery?.ToString("yyyy-MM-dd"),
                TotalAmount = updated.TotalAmount,
                Status = updated.Status,
                Items = ParseItemsJson(updated.ItemsJson),
                CreatedAt = updated.CreatedAt
            };
        }

        public async Task<IEnumerable<SupplierDto>> GetSuppliersAsync(int institutionId)
        {
            var suppliers = await _repository.GetSuppliersAsync(institutionId);
            return suppliers.Select(s => new SupplierDto
            {
                Id = s.SupplierId,
                Name = s.Name,
                ContactPerson = s.ContactPerson,
                Phone = s.Phone,
                Email = s.Email,
                Address = s.Address,
                SuppliedCategories = s.SuppliedCategories,
                Gstin = s.Gstin,
                FssaiNumber = s.FssaiNumber,
                Status = s.Status
            }).ToList();
        }

        public async Task<SupplierDto> CreateSupplierAsync(CreateSupplierDto dto, int institutionId, string performedBy)
        {
            var supplier = new Supplier
            {
                InstitutionId = institutionId,
                Name = dto.Name.Trim(),
                ContactPerson = dto.ContactPerson?.Trim(),
                Phone = dto.Phone?.Trim(),
                Email = dto.Email?.Trim(),
                Address = dto.Address?.Trim(),
                SuppliedCategories = dto.SuppliedCategories?.Trim(),
                Gstin = dto.Gstin?.Trim(),
                FssaiNumber = dto.FssaiNumber?.Trim(),
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };

            var created = await _repository.CreateSupplierAsync(supplier);

            await _auditService.LogActionAsync(
                institutionId,
                null,
                performedBy,
                "CREATE_SUPPLIER",
                "Supplier",
                created.SupplierId.ToString(),
                $"Created supplier '{created.Name}'."
            );

            return new SupplierDto
            {
                Id = created.SupplierId,
                Name = created.Name,
                ContactPerson = created.ContactPerson,
                Phone = created.Phone,
                Email = created.Email,
                Address = created.Address,
                SuppliedCategories = created.SuppliedCategories,
                Gstin = created.Gstin,
                FssaiNumber = created.FssaiNumber,
                Status = created.Status
            };
        }

        private static InventoryItemDto MapToItemDto(InventoryItem i) => new()
        {
            Id = i.ItemId,
            OutletId = i.OutletId,
            OutletName = i.Outlet?.Name ?? "Main Canteen",
            ItemCode = $"ING-{i.ItemId:D3}",
            IngredientName = i.IngredientName,
            Category = i.Category,
            AvailableQuantity = i.AvailableQuantity,
            Unit = i.Unit,
            ReorderLevel = i.ReorderLevel,
            CostPerUnit = i.CostPerUnit,
            BatchNumber = i.BatchNumber,
            ExpiryDate = i.ExpiryDate?.ToString("yyyy-MM-dd"),
            SupplierName = "Institutional Vendor",
            Status = i.Status,
            UpdatedAt = i.UpdatedAt
        };
    }
}

