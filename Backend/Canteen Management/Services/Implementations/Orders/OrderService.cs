using CanteenManagement.API.DTOs.Orders;
using CanteenManagement.API.Models.Orders;
using CanteenManagement.API.Repositories.Interfaces.Menu;
using CanteenManagement.API.Repositories.Interfaces.Orders;
using CanteenManagement.API.Repositories.Interfaces.Slots;
using CanteenManagement.API.Services.Interfaces.Common;
using CanteenManagement.API.Services.Interfaces.Orders;

namespace CanteenManagement.API.Services.Implementations.Orders
{
    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _repository;
        private readonly IMenuRepository _menuRepository;
        private readonly ISlotRepository _slotRepository;
        private readonly IAuditLoggingService _auditService;

        private static readonly Dictionary<string, string[]> PermittedNextStates = new()
        {
            ["Placed"] = new[] { "Accepted", "Cancelled" },
            ["Accepted"] = new[] { "Preparing", "Cancelled" },
            ["Preparing"] = new[] { "Ready for Pickup", "Cancelled" },
            ["Ready for Pickup"] = new[] { "Collected", "Cancelled" },
            ["Collected"] = Array.Empty<string>(),
            ["Cancelled"] = new[] { "Refunded" },
            ["Refunded"] = Array.Empty<string>()
        };

        public OrderService(
            IOrderRepository repository,
            IMenuRepository menuRepository,
            ISlotRepository slotRepository,
            IAuditLoggingService auditService)
        {
            _repository = repository;
            _menuRepository = menuRepository;
            _slotRepository = slotRepository;
            _auditService = auditService;
        }

        public async Task<IEnumerable<OrderDto>> GetAllAsync(int institutionId, int? outletId = null, string? status = null, string? searchTerm = null)
        {
            var orders = await _repository.GetAllAsync(institutionId, outletId, status, searchTerm);
            return orders.Select(MapToDto).ToList();
        }

        public async Task<OrderDto?> GetByIdAsync(string id, int institutionId)
        {
            var order = await _repository.GetByIdAsync(id, institutionId);
            return order == null ? null : MapToDto(order);
        }

        public async Task<OrderDto> CreateAsync(CreateOrderDto dto, int institutionId, string performedBy)
        {
            var now = DateTime.UtcNow;
            var orderId = $"ORD-{now:yyyy}-{Random.Shared.Next(1000, 9999)}";
            var token = await _repository.GenerateNextDailyTokenAsync(dto.OutletId, now);

            decimal subtotal = 0;
            var orderItems = new List<OrderItem>();

            foreach (var itemDto in dto.Items)
            {
                var menuItem = await _menuRepository.GetByIdAsync(itemDto.MenuItemId, institutionId);
                if (menuItem == null)
                {
                    throw new KeyNotFoundException($"Menu item {itemDto.MenuItemId} not found.");
                }

                decimal unitPrice = menuItem.Price;
                if (!string.IsNullOrWhiteSpace(itemDto.VariantName))
                {
                    var variant = menuItem.Variants.FirstOrDefault(v => v.Name.Equals(itemDto.VariantName, StringComparison.OrdinalIgnoreCase));
                    if (variant != null) unitPrice = variant.Price;
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

                // Deduct menu remaining capacity
                if (menuItem.RemainingCapacity >= itemDto.Quantity)
                {
                    menuItem.RemainingCapacity -= itemDto.Quantity;
                }
                menuItem.HistoricalOrderCount++;
                await _menuRepository.UpdateAsync(menuItem);
            }

            decimal taxAmount = Math.Round(subtotal * 0.05m, 2); // 5% GST
            decimal totalAmount = subtotal + taxAmount;

            // Increment slot count if specified
            if (dto.SlotId.HasValue)
            {
                var slot = await _slotRepository.GetByIdAsync(dto.SlotId.Value, institutionId);
                if (slot != null)
                {
                    slot.BookedOrders++;
                    await _slotRepository.UpdateAsync(slot);
                }
            }

            var order = new Order
            {
                OrderId = orderId,
                InstitutionId = institutionId,
                OutletId = dto.OutletId,
                SlotId = dto.SlotId,
                Token = token,
                CustomerName = dto.CustomerName.Trim(),
                CustomerRole = dto.CustomerRole,
                RollNo = dto.RollNo,
                Department = dto.Department,
                CustomerPhone = dto.Phone,
                CustomerEmail = dto.Email,
                Subtotal = subtotal,
                TaxAmount = taxAmount,
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
                        Note = "Order placed via portal",
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

            await _auditService.LogActionAsync(
                institutionId,
                null,
                performedBy,
                "CREATE_ORDER",
                "Order",
                created.OrderId,
                $"Order {created.OrderId} placed with token {created.Token}. Total: {created.TotalAmount}."
            );

            var loaded = await _repository.GetByIdAsync(created.OrderId, institutionId);
            return MapToDto(loaded ?? created);
        }

        public async Task<OrderDto> UpdateStatusAsync(string id, UpdateOrderStatusDto dto, int institutionId, string performedBy)
        {
            var order = await _repository.GetByIdAsync(id, institutionId);
            if (order == null)
            {
                throw new KeyNotFoundException($"Order with ID {id} was not found.");
            }

            var allowed = PermittedNextStates.GetValueOrDefault(order.Status, Array.Empty<string>());
            if (!allowed.Contains(dto.Status))
            {
                throw new InvalidOperationException($"Invalid status transition from '{order.Status}' to '{dto.Status}'. Permitted next states: {string.Join(", ", allowed)}.");
            }

            order.Status = dto.Status;
            var now = DateTime.UtcNow;

            order.Timeline.Add(new OrderTimeline
            {
                OrderId = order.OrderId,
                Status = dto.Status,
                Note = dto.Note ?? $"Order transitioned to {dto.Status}",
                Timestamp = now
            });

            var updated = await _repository.UpdateAsync(order);

            await _auditService.LogActionAsync(
                institutionId,
                null,
                performedBy,
                "UPDATE_ORDER_STATUS",
                "Order",
                updated.OrderId,
                $"Order status transitioned from '{order.Status}' to '{dto.Status}'."
            );

            return MapToDto(updated);
        }

        public async Task<OrderDto> CancelOrderAsync(string id, CancelOrderDto dto, int institutionId, string performedBy)
        {
            var order = await _repository.GetByIdAsync(id, institutionId);
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

            await _auditService.LogActionAsync(
                institutionId,
                null,
                performedBy,
                "CANCEL_ORDER",
                "Order",
                updated.OrderId,
                $"Order cancelled. Reason: {dto.Reason}."
            );

            return MapToDto(updated);
        }

        public async Task<OrderDto> ProcessRefundAsync(string id, int institutionId, string performedBy)
        {
            var order = await _repository.GetByIdAsync(id, institutionId);
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
                institutionId,
                null,
                performedBy,
                "REFUND_ORDER",
                "Order",
                updated.OrderId,
                $"Refund settled for amount ₹{updated.TotalAmount}."
            );

            return MapToDto(updated);
        }

        private static OrderDto MapToDto(Order o)
        {
            var payment = o.Payments.FirstOrDefault();
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
                TotalAmount = o.TotalAmount,
                Slot = o.Slot != null ? new SlotSummaryDto
                {
                    Id = o.Slot.SlotId,
                    Session = o.Slot.Session,
                    TimeWindow = $"{o.Slot.StartTime} - {o.Slot.EndTime}",
                    Date = o.Slot.Date.ToString("yyyy-MM-dd")
                } : null,
                OrderDate = o.OrderDate,
                Status = o.Status,
                CancellationReason = o.CancellationReason,
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
                    Timestamp = t.Timestamp.ToString("hh:mm tt"),
                    Note = t.Note
                }).ToList()
            };
        }
    }
}
