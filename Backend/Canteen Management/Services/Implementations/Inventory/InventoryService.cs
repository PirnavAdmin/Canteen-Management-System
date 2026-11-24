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

        public async Task<IEnumerable<InventoryItemDto>> GetItemsAsync(int campusId, int? outletId = null)
        {
            var items = await _repository.GetItemsAsync(campusId, outletId);
            return items.Select(MapToItemDto).ToList();
        }

        public async Task<InventoryItemDto> CreateItemAsync(CreateInventoryItemDto dto, int campusId, string performedBy)
        {
            var item = new InventoryItem
            {
                CampusId = campusId,
                OutletId = dto.OutletId ?? 1,
                IngredientName = dto.IngredientName.Trim(),
                Category = string.IsNullOrWhiteSpace(dto.Category) ? "Groceries" : dto.Category.Trim(),
                AvailableQuantity = dto.AvailableQuantity,
                Unit = string.IsNullOrWhiteSpace(dto.Unit) ? "kg" : dto.Unit.Trim(),
                ReorderLevel = dto.ReorderLevel > 0 ? dto.ReorderLevel : 10m,
                CostPerUnit = dto.CostPerUnit,
                BatchNumber = dto.BatchNumber ?? $"BAT-{Random.Shared.Next(100, 999)}",
                ExpiryDate = dto.ExpiryDate,
                Status = dto.AvailableQuantity <= 0 ? "Out of Stock" : (dto.AvailableQuantity <= (dto.ReorderLevel > 0 ? dto.ReorderLevel : 10m) ? "Low Stock" : "In Stock"),
                CreatedAt = DateTime.UtcNow
            };

            var created = await _repository.AddItemAsync(item);

            if (dto.AvailableQuantity > 0)
            {
                try
                {
                    await _repository.AddMovementAsync(new StockMovement
                    {
                        ItemId = created.ItemId,
                        MovementType = "Stock In",
                        Quantity = dto.AvailableQuantity,
                        BatchNumber = created.BatchNumber,
                        ExpiryDate = created.ExpiryDate,
                        Reference = "INITIAL-STOCK",
                        Reason = "Initial stock entry on item registration",
                        PerformedBy = performedBy,
                        DateTime = DateTime.UtcNow
                    });
                }
                catch { }
            }

            await _auditService.LogActionAsync(
                campusId,
                null,
                performedBy,
                "CREATE_INVENTORY_ITEM",
                "InventoryItem",
                created.ItemId.ToString(),
                $"Added raw material '{created.IngredientName}' with initial stock {created.AvailableQuantity} {created.Unit}."
            );

            return MapToItemDto(created);
        }

        public async Task<InventoryItemDto?> UpdateItemAsync(int id, UpdateInventoryItemDto dto, int campusId, string performedBy)
        {
            var item = await _repository.GetItemByIdAsync(id, campusId);
            if (item == null) return null;

            var oldQty = item.AvailableQuantity;

            if (!string.IsNullOrWhiteSpace(dto.IngredientName)) item.IngredientName = dto.IngredientName.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Category)) item.Category = dto.Category.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Unit)) item.Unit = dto.Unit.Trim();
            if (dto.ReorderLevel.HasValue) item.ReorderLevel = dto.ReorderLevel.Value;
            if (dto.CostPerUnit.HasValue) item.CostPerUnit = dto.CostPerUnit.Value;
            if (dto.OutletId.HasValue && dto.OutletId.Value > 0) item.OutletId = dto.OutletId.Value;
            if (!string.IsNullOrWhiteSpace(dto.BatchNumber)) item.BatchNumber = dto.BatchNumber;
            if (dto.ExpiryDate.HasValue) item.ExpiryDate = dto.ExpiryDate.Value;

            if (dto.AvailableQuantity.HasValue)
            {
                item.AvailableQuantity = dto.AvailableQuantity.Value;
            }

            if (item.AvailableQuantity <= 0) item.Status = "Out of Stock";
            else if (item.AvailableQuantity <= item.ReorderLevel) item.Status = "Low Stock";
            else item.Status = "In Stock";

            if (!string.IsNullOrWhiteSpace(dto.Status)) item.Status = dto.Status;

            var updated = await _repository.UpdateItemAsync(item);

            if (dto.AvailableQuantity.HasValue && dto.AvailableQuantity.Value != oldQty)
            {
                var diff = dto.AvailableQuantity.Value - oldQty;
                try
                {
                    await _repository.AddMovementAsync(new StockMovement
                    {
                        ItemId = item.ItemId,
                        MovementType = "Adjustment",
                        Quantity = diff,
                        BatchNumber = item.BatchNumber,
                        ExpiryDate = item.ExpiryDate,
                        Reference = "DIRECT-UPDATE",
                        Reason = $"Direct stock edit by {performedBy} (from {oldQty} to {item.AvailableQuantity} {item.Unit})",
                        PerformedBy = performedBy,
                        DateTime = DateTime.UtcNow
                    });
                }
                catch { }
            }

            await _auditService.LogActionAsync(
                campusId,
                null,
                performedBy,
                "UPDATE_INVENTORY_ITEM",
                "InventoryItem",
                item.ItemId.ToString(),
                $"Updated inventory item '{item.IngredientName}'. Stock: {item.AvailableQuantity} {item.Unit}."
            );

            return MapToItemDto(updated);
        }

        public async Task<bool> DeleteItemAsync(int id, int campusId, string performedBy)
        {
            var item = await _repository.GetItemByIdAsync(id, campusId);
            if (item == null) return false;

            var success = await _repository.DeleteItemAsync(id, campusId);
            if (success)
            {
                await _auditService.LogActionAsync(
                    campusId,
                    null,
                    performedBy,
                    "DELETE_INVENTORY_ITEM",
                    "InventoryItem",
                    id.ToString(),
                    $"Deleted inventory item '{item.IngredientName}'."
                );
            }
            return success;
        }

        public async Task<StockMovementLedgerDto> RecordMovementAsync(RecordStockMovementDto dto, int campusId, string performedBy)
        {
            var item = await _repository.GetItemByIdAsync(dto.IngredientId, campusId);
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
                campusId,
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

        public async Task<IEnumerable<StockMovementLedgerDto>> GetLedgerAsync(int campusId, int? outletId = null)
        {
            var movements = await _repository.GetLedgerAsync(campusId, outletId);
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

        public async Task<IEnumerable<PurchaseOrderDto>> GetPurchaseOrdersAsync(int campusId, int? outletId = null)
        {
            var pos = await _repository.GetPurchaseOrdersAsync(campusId, outletId);
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

        public async Task<PurchaseOrderDto> CreatePurchaseOrderAsync(CreatePurchaseOrderDto dto, int campusId, string performedBy)
        {
            var supplierName = dto.SupplierName;
            if (string.IsNullOrWhiteSpace(supplierName) && dto.SupplierId.HasValue)
            {
                var sup = await _repository.GetSupplierByIdAsync(dto.SupplierId.Value, campusId);
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
                CampusId = campusId,
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
                campusId,
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

        public async Task<PurchaseOrderDto> UpdatePurchaseOrderStatusAsync(int id, string status, int campusId, string performedBy)
        {
            var po = await _repository.GetPurchaseOrderByIdAsync(id, campusId);
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
                    var existingStockItems = (await _repository.GetItemsAsync(campusId, po.OutletId > 0 ? po.OutletId : null)).ToList();

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
                                CampusId = campusId,
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
                campusId,
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

        public async Task<IEnumerable<SupplierDto>> GetSuppliersAsync(int campusId)
        {
            var suppliers = await _repository.GetSuppliersAsync(campusId);
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

        public async Task<SupplierDto> CreateSupplierAsync(CreateSupplierDto dto, int campusId, string performedBy)
        {
            var supplier = new Supplier
            {
                CampusId = campusId,
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
                campusId,
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

        public async Task<SupplierDto?> UpdateSupplierAsync(int id, UpdateSupplierDto dto, int campusId, string performedBy)
        {
            var existing = await _repository.GetSupplierByIdAsync(id, campusId);
            if (existing == null) return null;

            existing.Name = dto.Name.Trim();
            existing.ContactPerson = dto.ContactPerson?.Trim();
            existing.Phone = dto.Phone?.Trim();
            existing.Email = dto.Email?.Trim();
            existing.Address = dto.Address?.Trim();
            existing.SuppliedCategories = dto.SuppliedCategories?.Trim();
            existing.Gstin = dto.Gstin?.Trim();
            existing.FssaiNumber = dto.FssaiNumber?.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Status))
            {
                existing.Status = dto.Status.Trim();
            }

            var updated = await _repository.UpdateSupplierAsync(existing);
            if (updated == null) return null;

            await _auditService.LogActionAsync(
                campusId,
                null,
                performedBy,
                "UPDATE_SUPPLIER",
                "Supplier",
                updated.SupplierId.ToString(),
                $"Updated supplier '{updated.Name}'."
            );

            return new SupplierDto
            {
                Id = updated.SupplierId,
                Name = updated.Name,
                ContactPerson = updated.ContactPerson,
                Phone = updated.Phone,
                Email = updated.Email,
                Address = updated.Address,
                SuppliedCategories = updated.SuppliedCategories,
                Gstin = updated.Gstin,
                FssaiNumber = updated.FssaiNumber,
                Status = updated.Status
            };
        }

        public async Task<SupplierDeleteResultDto> DeleteSupplierAsync(int id, int campusId, string performedBy)
        {
            var existing = await _repository.GetSupplierByIdAsync(id, campusId);
            if (existing == null)
            {
                return new SupplierDeleteResultDto
                {
                    Success = false,
                    ActionTaken = "NOT_FOUND",
                    LinkedPOCount = 0,
                    Message = $"Supplier with ID {id} not found."
                };
            }

            var (success, actionTaken, linkedPoCount) = await _repository.DeleteSupplierAsync(id, campusId);

            await _auditService.LogActionAsync(
                campusId,
                null,
                performedBy,
                actionTaken == "HARD_DELETED" ? "DELETE_SUPPLIER" : "DEACTIVATE_SUPPLIER",
                "Supplier",
                id.ToString(),
                actionTaken == "HARD_DELETED"
                    ? $"Permanently deleted supplier '{existing.Name}'."
                    : $"Supplier '{existing.Name}' has {linkedPoCount} linked purchase order(s). Marked status as 'Inactive'."
            );

            return new SupplierDeleteResultDto
            {
                Success = success,
                ActionTaken = actionTaken,
                LinkedPOCount = linkedPoCount,
                Message = actionTaken == "HARD_DELETED"
                    ? $"Supplier '{existing.Name}' deleted successfully."
                    : $"Supplier '{existing.Name}' has {linkedPoCount} purchase orders on record. Marked as Inactive for compliance."
            };
        }

        public async Task<SupplierDto?> UpdateSupplierStatusAsync(int id, string status, int campusId, string performedBy)
        {
            var existing = await _repository.GetSupplierByIdAsync(id, campusId);
            if (existing == null) return null;

            var updated = await _repository.ToggleSupplierStatusAsync(id, campusId, status);
            if (updated == null) return null;

            await _auditService.LogActionAsync(
                campusId,
                null,
                performedBy,
                "UPDATE_SUPPLIER_STATUS",
                "Supplier",
                id.ToString(),
                $"Changed status of supplier '{updated.Name}' to '{status}'."
            );

            return new SupplierDto
            {
                Id = updated.SupplierId,
                Name = updated.Name,
                ContactPerson = updated.ContactPerson,
                Phone = updated.Phone,
                Email = updated.Email,
                Address = updated.Address,
                SuppliedCategories = updated.SuppliedCategories,
                Gstin = updated.Gstin,
                FssaiNumber = updated.FssaiNumber,
                Status = updated.Status
            };
        }

        public async Task<IEnumerable<StockRequestDto>> GetStockRequestsAsync(int campusId, int? outletId = null, string? status = null)
        {
            var list = await _repository.GetStockRequestsAsync(campusId, outletId, status);
            return list.Select(MapToStockRequestDto).ToList();
        }

        public async Task<StockRequestDto> CreateStockRequestAsync(CreateStockRequestDto dto, int campusId, string requestedBy)
        {
            var req = new StockRequest
            {
                RequestId = $"REQ-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}",
                CampusId = campusId,
                OutletId = dto.OutletId,
                ItemId = dto.ItemId,
                ItemCode = dto.ItemCode ?? (dto.ItemId.HasValue ? $"ING-{dto.ItemId.Value:D3}" : "ING-REQ"),
                ItemName = dto.ItemName.Trim(),
                Category = string.IsNullOrWhiteSpace(dto.Category) ? "Groceries" : dto.Category.Trim(),
                RequestedQuantity = dto.RequestedQuantity,
                Unit = string.IsNullOrWhiteSpace(dto.Unit) ? "kg" : dto.Unit.Trim(),
                Urgency = string.IsNullOrWhiteSpace(dto.Urgency) ? "Normal" : dto.Urgency.Trim(),
                Status = "Pending Review",
                Notes = dto.Notes?.Trim(),
                RequiredByDate = dto.RequiredByDate,
                RequestedBy = !string.IsNullOrWhiteSpace(dto.RequestedBy) ? dto.RequestedBy : requestedBy,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _repository.CreateStockRequestAsync(req);

            await _auditService.LogActionAsync(
                campusId,
                dto.OutletId,
                requestedBy,
                "CREATE_STOCK_REQUEST",
                "StockRequest",
                created.RequestId,
                $"Kitchen requisition submitted for {created.RequestedQuantity} {created.Unit} of '{created.ItemName}' ({created.Urgency} urgency)."
            );

            var loaded = await _repository.GetStockRequestByIdAsync(created.RequestId, campusId);
            return MapToStockRequestDto(loaded ?? created);
        }

        public async Task<StockRequestDto> DispatchStockRequestAsync(string id, DispatchStockRequestDto dto, int campusId, string performedBy)
        {
            var req = await _repository.GetStockRequestByIdAsync(id, campusId);
            if (req == null)
            {
                throw new KeyNotFoundException($"Stock request with ID {id} was not found.");
            }

            if (req.Status == "Received")
            {
                throw new InvalidOperationException("Stock request has already been received and fulfilled.");
            }

            var issuedQty = dto.IssuedQuantity > 0 ? dto.IssuedQuantity : req.RequestedQuantity;

            // Find matching item in Central / Main Inventory (either ItemId match or Name match across campus)
            var centralItems = await _repository.GetItemsAsync(campusId);
            var centralItem = centralItems.FirstOrDefault(i =>
                (req.ItemId.HasValue && i.ItemId == req.ItemId.Value) ||
                string.Equals(i.IngredientName, req.ItemName, StringComparison.OrdinalIgnoreCase));

            if (centralItem != null)
            {
                if (centralItem.AvailableQuantity < issuedQty)
                {
                    throw new InvalidOperationException($"Insufficient central stock: Only {centralItem.AvailableQuantity} {centralItem.Unit} available in Main Inventory, cannot issue {issuedQty} {centralItem.Unit}.");
                }

                centralItem.AvailableQuantity -= issuedQty;
                if (centralItem.AvailableQuantity <= 0) centralItem.Status = "Out of Stock";
                else if (centralItem.AvailableQuantity <= centralItem.ReorderLevel) centralItem.Status = "Low Stock";
                else centralItem.Status = "In Stock";

                await _repository.UpdateItemAsync(centralItem);

                try
                {
                    await _repository.AddMovementAsync(new StockMovement
                    {
                        ItemId = centralItem.ItemId,
                        MovementType = "Stock Out",
                        Quantity = issuedQty,
                        BatchNumber = centralItem.BatchNumber,
                        ExpiryDate = centralItem.ExpiryDate,
                        Reference = $"INDENT-DISP-{req.RequestId}",
                        Reason = $"Dispatched {issuedQty} {centralItem.Unit} to {req.Outlet?.Name ?? $"Outlet #{req.OutletId}"} Kitchen (Req #{req.RequestId})",
                        PerformedBy = performedBy,
                        DateTime = DateTime.UtcNow
                    });
                }
                catch { }
            }

            req.IssuedQuantity = issuedQty;
            req.Status = "Dispatched";
            req.AdminNotes = dto.AdminNotes?.Trim();
            req.DispatchedBy = performedBy;
            req.DispatchedAt = DateTime.UtcNow;

            var updated = await _repository.UpdateStockRequestAsync(req);

            await _auditService.LogActionAsync(
                campusId,
                req.OutletId,
                performedBy,
                "DISPATCH_STOCK_REQUEST",
                "StockRequest",
                req.RequestId,
                $"Stock dispatched: {issuedQty} {req.Unit} of '{req.ItemName}' issued to {req.Outlet?.Name ?? $"Outlet #{req.OutletId}"} Kitchen."
            );

            return MapToStockRequestDto(updated);
        }

        public async Task<StockRequestDto> ReceiveStockRequestAsync(string id, int campusId, string performedBy)
        {
            var req = await _repository.GetStockRequestByIdAsync(id, campusId);
            if (req == null)
            {
                throw new KeyNotFoundException($"Stock request with ID {id} was not found.");
            }

            if (req.Status == "Received")
            {
                return MapToStockRequestDto(req);
            }

            var receivedQty = req.IssuedQuantity ?? req.RequestedQuantity;

            // Check if this outlet kitchen already has an inventory item for this ingredient
            var outletItems = await _repository.GetItemsAsync(campusId, req.OutletId);
            var kitchenItem = outletItems.FirstOrDefault(i =>
                string.Equals(i.IngredientName, req.ItemName, StringComparison.OrdinalIgnoreCase));

            if (kitchenItem != null)
            {
                kitchenItem.AvailableQuantity += receivedQty;
                if (kitchenItem.AvailableQuantity <= 0) kitchenItem.Status = "Out of Stock";
                else if (kitchenItem.AvailableQuantity <= kitchenItem.ReorderLevel) kitchenItem.Status = "Low Stock";
                else kitchenItem.Status = "In Stock";

                await _repository.UpdateItemAsync(kitchenItem);

                try
                {
                    await _repository.AddMovementAsync(new StockMovement
                    {
                        ItemId = kitchenItem.ItemId,
                        MovementType = "Stock In",
                        Quantity = receivedQty,
                        BatchNumber = kitchenItem.BatchNumber,
                        ExpiryDate = kitchenItem.ExpiryDate,
                        Reference = $"INDENT-RECV-{req.RequestId}",
                        Reason = $"Received from Main Inventory transfer (Req #{req.RequestId})",
                        PerformedBy = performedBy,
                        DateTime = DateTime.UtcNow
                    });
                }
                catch { }
            }
            else
            {
                var newItem = new InventoryItem
                {
                    CampusId = campusId,
                    OutletId = req.OutletId,
                    IngredientName = req.ItemName,
                    Category = req.Category,
                    AvailableQuantity = receivedQty,
                    Unit = req.Unit,
                    ReorderLevel = 10,
                    CostPerUnit = 0,
                    Status = "In Stock",
                    CreatedAt = DateTime.UtcNow
                };

                var createdItem = await _repository.AddItemAsync(newItem);

                try
                {
                    await _repository.AddMovementAsync(new StockMovement
                    {
                        ItemId = createdItem.ItemId,
                        MovementType = "Stock In",
                        Quantity = receivedQty,
                        BatchNumber = createdItem.BatchNumber,
                        ExpiryDate = createdItem.ExpiryDate,
                        Reference = $"INDENT-RECV-{req.RequestId}",
                        Reason = $"Initial kitchen stock received from Main Inventory transfer (Req #{req.RequestId})",
                        PerformedBy = performedBy,
                        DateTime = DateTime.UtcNow
                    });
                }
                catch { }
            }

            req.Status = "Received";
            req.ReceivedBy = performedBy;
            req.ReceivedAt = DateTime.UtcNow;

            var updated = await _repository.UpdateStockRequestAsync(req);

            await _auditService.LogActionAsync(
                campusId,
                req.OutletId,
                performedBy,
                "RECEIVE_STOCK_REQUEST",
                "StockRequest",
                req.RequestId,
                $"Stock receipt confirmed by {performedBy}: {receivedQty} {req.Unit} of '{req.ItemName}' added to kitchen inventory."
            );

            return MapToStockRequestDto(updated);
        }

        public async Task<StockRequestDto> RejectStockRequestAsync(string id, string reason, int campusId, string performedBy)
        {
            var req = await _repository.GetStockRequestByIdAsync(id, campusId);
            if (req == null)
            {
                throw new KeyNotFoundException($"Stock request with ID {id} was not found.");
            }

            req.Status = "Rejected";
            req.AdminNotes = reason;
            req.UpdatedAt = DateTime.UtcNow;

            var updated = await _repository.UpdateStockRequestAsync(req);

            await _auditService.LogActionAsync(
                campusId,
                req.OutletId,
                performedBy,
                "REJECT_STOCK_REQUEST",
                "StockRequest",
                req.RequestId,
                $"Stock request #{req.RequestId} rejected by {performedBy}. Reason: {reason}."
            );

            return MapToStockRequestDto(updated);
        }

        public async Task<bool> DeleteStockRequestAsync(string id, int campusId, string performedBy)
        {
            var req = await _repository.GetStockRequestByIdAsync(id, campusId);
            if (req == null) return false;

            var success = await _repository.DeleteStockRequestAsync(id, campusId);
            if (success)
            {
                await _auditService.LogActionAsync(
                    campusId,
                    req.OutletId,
                    performedBy,
                    "DELETE_STOCK_REQUEST",
                    "StockRequest",
                    id,
                    $"Deleted stock requisition #{id} ('{req.ItemName}')."
                );
            }
            return success;
        }

        private static StockRequestDto MapToStockRequestDto(StockRequest r) => new()
        {
            Id = r.RequestId,
            CampusId = r.CampusId,
            OutletId = r.OutletId,
            OutletName = r.Outlet?.Name ?? (r.OutletId == 1 ? "Main Canteen" : $"Outlet #{r.OutletId}"),
            SourceOutletId = r.SourceOutletId,
            ItemId = r.ItemId,
            ItemCode = r.ItemCode ?? (r.ItemId.HasValue ? $"ING-{r.ItemId.Value:D3}" : "ING-REQ"),
            ItemName = r.ItemName,
            Category = r.Category,
            RequestedQuantity = r.RequestedQuantity,
            IssuedQuantity = r.IssuedQuantity,
            Unit = r.Unit,
            Urgency = r.Urgency,
            Status = r.Status,
            Notes = r.Notes,
            AdminNotes = r.AdminNotes,
            RequiredByDate = r.RequiredByDate?.ToString("yyyy-MM-dd"),
            RequestedBy = r.RequestedBy,
            DispatchedBy = r.DispatchedBy,
            ReceivedBy = r.ReceivedBy,
            CreatedAt = r.CreatedAt,
            DispatchedAt = r.DispatchedAt,
            ReceivedAt = r.ReceivedAt
        };

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

