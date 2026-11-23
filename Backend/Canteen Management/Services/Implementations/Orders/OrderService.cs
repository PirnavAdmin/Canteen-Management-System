using CanteenManagement.API.DTOs.Orders;
using CanteenManagement.API.Helpers;
using CanteenManagement.API.Models.Orders;
using CanteenManagement.API.Models.Outlets;
using CanteenManagement.API.Repositories.Interfaces.Menu;
using CanteenManagement.API.Repositories.Interfaces.Orders;
using CanteenManagement.API.Services.Interfaces.Common;
using CanteenManagement.API.Services.Interfaces.Orders;
using CanteenManagement.API.Services.Interfaces.Settings;

namespace CanteenManagement.API.Services.Implementations.Orders
{
    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _repository;
        private readonly IMenuRepository _menuRepository;
        private readonly IAuditLoggingService _auditService;
        private readonly ISettingsService _settingsService;

        private static readonly Dictionary<string, string[]> PermittedNextStates = new()
        {
            ["Placed"] = new[] { "Accepted", "Cancelled" },
            ["Accepted"] = new[] { "Preparing", "Cancelled" },
            ["Preparing"] = new[] { "Ready for Pickup", "Cancelled" },
            ["Ready for Pickup"] = new[] { "Collected", "Completed", "Cancelled" },
            ["Collected"] = Array.Empty<string>(),
            ["Completed"] = Array.Empty<string>(),
            ["Cancelled"] = new[] { "Refunded" },
            ["Refunded"] = Array.Empty<string>()
        };

        public OrderService(
            IOrderRepository repository,
            IMenuRepository menuRepository,
            IAuditLoggingService auditService,
            ISettingsService settingsService)
        {
            _repository = repository;
            _menuRepository = menuRepository;
            _auditService = auditService;
            _settingsService = settingsService;
        }

        public async Task<IEnumerable<OrderDto>> GetAllAsync(int campusId, int? outletId = null, string? status = null, string? searchTerm = null, string? dateFilter = null)
        {
            var orders = await _repository.GetAllAsync(campusId, outletId, status, searchTerm);
            if (!string.IsNullOrWhiteSpace(dateFilter))
            {
                var todayIst = IndianTime.Today;
                if (dateFilter.Equals("today", StringComparison.OrdinalIgnoreCase))
                {
                    orders = orders.Where(o => IndianTime.ToIst(o.OrderDate).Date == todayIst);
                }
                else if (dateFilter.Equals("yesterday", StringComparison.OrdinalIgnoreCase))
                {
                    orders = orders.Where(o => IndianTime.ToIst(o.OrderDate).Date == todayIst.AddDays(-1));
                }
                else if (dateFilter.Equals("last7days", StringComparison.OrdinalIgnoreCase))
                {
                    orders = orders.Where(o => IndianTime.ToIst(o.OrderDate).Date >= todayIst.AddDays(-7));
                }
            }
            return orders.Select(MapToDto).ToList();
        }

        public async Task<OrderDto?> GetByIdAsync(string id, int campusId)
        {
            var order = await _repository.GetByIdAsync(id, campusId);
            return order == null ? null : MapToDto(order);
        }

        public async Task<OrderDto> CreateAsync(CreateOrderDto dto, int campusId, string performedBy)
        {
            var now = DateTime.UtcNow;
            var orderId = $"ORD-{now:yyyy}-{Random.Shared.Next(1000, 9999)}";
            var token = await _repository.GenerateNextDailyTokenAsync(dto.OutletId, IndianTime.Today);

            decimal subtotal = 0;
            var orderItems = new List<OrderItem>();
            string outletName = "Main Canteen";

            foreach (var itemDto in dto.Items)
            {
                var menuItem = await _menuRepository.GetByIdAsync(itemDto.MenuItemId, campusId);
                if (menuItem == null)
                {
                    throw new KeyNotFoundException($"Menu item {itemDto.MenuItemId} not found.");
                }

                if (menuItem.Outlet != null && !string.IsNullOrWhiteSpace(menuItem.Outlet.Name))
                {
                    outletName = menuItem.Outlet.Name;
                }

                if (menuItem.Availability == "SoldOut" || menuItem.RemainingCapacity <= 0)
                {
                    throw new InvalidOperationException($"Cannot order '{menuItem.Name}'. It is currently Sold Out.");
                }

                if (menuItem.RemainingCapacity < itemDto.Quantity)
                {
                    throw new InvalidOperationException($"Cannot order {itemDto.Quantity} portions of '{menuItem.Name}'. Only {menuItem.RemainingCapacity} remaining for today.");
                }

                decimal unitPrice = menuItem.Price;
                if (!string.IsNullOrWhiteSpace(itemDto.VariantName))
                {
                    var variant = menuItem.Variants.FirstOrDefault(v => v.Name.Equals(itemDto.VariantName, StringComparison.OrdinalIgnoreCase));
                    if (variant != null) unitPrice = variant.Price;
                }
                if (menuItem.DiscountPercent > 0)
                {
                    unitPrice = Math.Round(unitPrice * (1 - (menuItem.DiscountPercent / 100m)), 2);
                }

                decimal itemTotal = unitPrice * itemDto.Quantity;
                subtotal += itemTotal;

                orderItems.Add(new OrderItem
                {
                    OrderId = orderId,
                    MenuItemId = menuItem.MenuItemId,
                    ItemName = menuItem.Name,
                    VariantName = itemDto.VariantName,
                    UnitPrice = unitPrice,
                    Quantity = itemDto.Quantity,
                    TotalPrice = itemTotal
                });

                // Deduct menu remaining capacity atomically via Stored Procedure
                await _menuRepository.DeductCapacityAsync(menuItem.MenuItemId, itemDto.Quantity);
            }

            var settings = await _settingsService.GetSettingsAsync(campusId);
            decimal gstPercent = settings?.OrderRules?.GstPercent ?? settings?.Payments?.GstPercent ?? 5.0m;
            decimal packagingFee = 0m;
            bool packagingEnabled = settings?.OrderRules?.EnablePackagingFee ?? true;
            if (packagingEnabled)
            {
                decimal configuredFee = settings?.OrderRules?.PackagingFee ?? 5.0m;
                if (dto.PackagingFee.HasValue)
                {
                    packagingFee = dto.PackagingFee.Value;
                }
                else
                {
                    packagingFee = subtotal > 200 || subtotal == 0 ? 0 : configuredFee;
                }
            }

            decimal taxAmount = Math.Round(subtotal * (gstPercent / 100m), 2);
            decimal totalAmount = subtotal + taxAmount + packagingFee;

            var order = new Order
            {
                OrderId = orderId,
                CampusId = campusId,
                OutletId = dto.OutletId,
                Token = token,
                CustomerName = dto.CustomerName.Trim(),
                CustomerRole = dto.CustomerRole,
                RollNo = dto.RollNo,
                Department = dto.Department,
                CustomerPhone = dto.Phone,
                CustomerEmail = dto.Email,
                Notes = dto.Notes?.Trim(),
                Subtotal = subtotal,
                TaxAmount = taxAmount,
                PackagingFee = packagingFee,
                TotalAmount = totalAmount,
                Status = "Placed",
                OrderDate = now,
                Items = orderItems,
                Timeline = new List<OrderTimeline>
                {
                    new()
                    {
                        OrderId = orderId,
                        Status = "Placed",
                        Note = string.IsNullOrWhiteSpace(dto.Notes)
                            ? "Order placed via portal"
                            : $"Order placed via portal [Notes: {dto.Notes.Trim()}]",
                        Timestamp = now
                    }
                },
                Payments = new List<PaymentTransaction>
                {
                    new()
                    {
                        TransactionId = $"TXN-{Guid.NewGuid().ToString("N")[..10].ToUpper()}",
                        OrderId = orderId,
                        Method = dto.PaymentMethod,
                        Status = "Paid",
                        Amount = totalAmount,
                        PaidAt = now
                    }
                }
            };

            var created = await _repository.CreateAsync(order);

            try
            {
                await _auditService.LogActionAsync(
                    campusId,
                    null,
                    performedBy,
                    "CREATE_ORDER",
                    "Order",
                    created.OrderId,
                    $"Order {created.OrderId} placed with token {created.Token}. Total: {created.TotalAmount}."
                );
            }
            catch
            {
                // Non-blocking audit failure
            }

            created.Outlet = new CanteenOutlet
            {
                OutletId = dto.OutletId,
                Name = outletName
            };

            return MapToDto(created);
        }

        public async Task<OrderDto> UpdateStatusAsync(string id, UpdateOrderStatusDto dto, int campusId, string performedBy)
        {
            var order = await _repository.GetByIdAsync(id, campusId);
            if (order == null)
            {
                throw new KeyNotFoundException($"Order with ID {id} was not found.");
            }

            var targetStatus = dto.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase) ? "Collected" : dto.Status;
            var allowed = PermittedNextStates.GetValueOrDefault(order.Status, Array.Empty<string>());
            if (!allowed.Contains(dto.Status) && !allowed.Contains(targetStatus))
            {
                throw new InvalidOperationException($"Invalid status transition from '{order.Status}' to '{dto.Status}'. Permitted next states: {string.Join(", ", allowed)}.");
            }

            order.Status = targetStatus;
            var now = DateTime.UtcNow;

            order.Timeline.Add(new OrderTimeline
            {
                OrderId = order.OrderId,
                Status = targetStatus,
                Note = dto.Note ?? $"Order transitioned to {targetStatus}",
                Timestamp = now
            });

            var updated = await _repository.UpdateAsync(order);

            // Restore menu remaining capacity if transitioned to Cancelled
            if (dto.Status == "Cancelled" && order.Items != null)
            {
                foreach (var item in order.Items)
                {
                    await _menuRepository.RestoreCapacityAsync(item.MenuItemId, item.Quantity);
                }
            }

            await _auditService.LogActionAsync(
                campusId,
                null,
                performedBy,
                "UPDATE_ORDER_STATUS",
                "Order",
                updated.OrderId,
                $"Order status transitioned from '{order.Status}' to '{dto.Status}'."
            );

            return MapToDto(updated);
        }

        public async Task<OrderDto> CancelOrderAsync(string id, CancelOrderDto dto, int campusId, string performedBy)
        {
            var order = await _repository.GetByIdAsync(id, campusId);
            if (order == null)
            {
                throw new KeyNotFoundException($"Order with ID {id} was not found.");
            }

            if (order.Status == "Collected")
            {
                throw new InvalidOperationException("Completed/Collected orders cannot be cancelled.");
            }

            order.Status = "Cancelled";
            order.CancellationReason = dto.Reason;
            var now = DateTime.UtcNow;

            order.Timeline.Add(new OrderTimeline
            {
                OrderId = order.OrderId,
                Status = "Cancelled",
                Note = $"Cancelled: {dto.Reason}",
                Timestamp = now
            });

            var updated = await _repository.UpdateAsync(order);

            // Restore menu remaining capacity for cancelled items atomically via Stored Procedure
            if (order.Items != null)
            {
                foreach (var item in order.Items)
                {
                    await _menuRepository.RestoreCapacityAsync(item.MenuItemId, item.Quantity);
                }
            }

            await _auditService.LogActionAsync(
                campusId,
                null,
                performedBy,
                "CANCEL_ORDER",
                "Order",
                updated.OrderId,
                $"Order cancelled. Reason: {dto.Reason}."
            );

            return MapToDto(updated);
        }

        public async Task<OrderDto> ProcessRefundAsync(string id, int campusId, string performedBy)
        {
            var order = await _repository.GetByIdAsync(id, campusId);
            if (order == null)
            {
                throw new KeyNotFoundException($"Order with ID {id} was not found.");
            }

            if (order.Status != "Cancelled")
            {
                throw new InvalidOperationException("Only cancelled orders can be processed for refund.");
            }

            order.Status = "Refunded";
            var now = DateTime.UtcNow;

            var payment = order.Payments.FirstOrDefault();
            if (payment != null)
            {
                payment.Status = "Refunded";
            }

            order.Timeline.Add(new OrderTimeline
            {
                OrderId = order.OrderId,
                Status = "Refunded",
                Note = $"Refund of ₹{order.TotalAmount} processed successfully.",
                Timestamp = now
            });

            var updated = await _repository.UpdateAsync(order);

            await _auditService.LogActionAsync(
                campusId,
                null,
                performedBy,
                "REFUND_ORDER",
                "Order",
                updated.OrderId,
                $"Refund settled for amount ₹{updated.TotalAmount}."
            );

            return MapToDto(updated);
        }

        public async Task<bool> DeleteAsync(string id, int campusId)
        {
            var order = await _repository.GetByIdAsync(id, campusId);
            if (order == null) return false;

            // Restore capacity if order was active
            if (order.Status != "Cancelled" && order.Status != "Collected" && order.Status != "Completed" && order.Items != null)
            {
                foreach (var item in order.Items)
                {
                    try { await _menuRepository.RestoreCapacityAsync(item.MenuItemId, item.Quantity); } catch { }
                }
            }

            return await _repository.DeleteAsync(id, campusId);
        }

        public async Task<int> DeleteTestOrdersAsync(int campusId)
        {
            var testOrderIds = new[]
            {
                "ORD-2026-3125",
                "ORD-2026-4631",
                "ORD-2026-2743",
                "ORD-2026-4291",
                "ORD-2026-7142",
                "ORD-2026-8399",
                "ORD-2026-6972",
                "ORD-2026-6343",
                "ORD-2026-7469",
                "ORD-2026-5951"
            };

            int count = 0;
            foreach (var id in testOrderIds)
            {
                if (await DeleteAsync(id, campusId))
                {
                    count++;
                }
            }
            return count;
        }

        private static OrderDto MapToDto(Order o)
        {
            var payment = o.Payments.FirstOrDefault();
            string? specialNotes = !string.IsNullOrWhiteSpace(o.Notes)
                ? o.Notes
                : (o.Timeline?.FirstOrDefault(t => t.Note != null && t.Note.Contains("[Notes:"))?.Note is string noteStr
                    ? noteStr.Substring(noteStr.IndexOf("[Notes:") + 7).TrimEnd(']').Trim()
                    : null);

            return new OrderDto
            {
                Id = o.OrderId,
                Token = o.Token,
                OutletId = o.OutletId,
                OutletName = o.Outlet?.Name ?? string.Empty,
                Customer = new CustomerSummaryDto
                {
                    UserId = o.UserId,
                    Name = o.CustomerName,
                    Role = o.CustomerRole,
                    RollNo = o.RollNo,
                    Department = o.Department,
                    Phone = o.CustomerPhone,
                    Email = o.CustomerEmail
                },
                Items = o.Items.Select(i => new OrderItemDto
                {
                    Id = i.OrderItemId,
                    MenuItemId = i.MenuItemId,
                    Name = i.ItemName,
                    Variant = i.VariantName,
                    Price = i.UnitPrice,
                    Quantity = i.Quantity,
                    Total = i.TotalPrice
                }).ToList(),
                Subtotal = o.Subtotal,
                TaxAmount = o.TaxAmount,
                PackagingFee = o.PackagingFee,
                TotalAmount = o.TotalAmount,
                OrderDate = o.OrderDate,
                Status = o.Status,
                CancellationReason = o.CancellationReason,
                Notes = specialNotes,
                Payment = new PaymentSummaryDto
                {
                    Method = payment?.Method ?? "UPI",
                    Status = payment?.Status ?? "Paid",
                    TransactionId = payment?.TransactionId,
                    PaidAt = payment?.PaidAt
                },
                Timeline = o.Timeline.Select(t => new TimelineEntryDto
                {
                    Status = t.Status,
                    Timestamp = IndianTime.ToIst(t.Timestamp).ToString("hh:mm tt"),
                    Note = t.Note
                }).ToList()
            };
        }
    }
}
