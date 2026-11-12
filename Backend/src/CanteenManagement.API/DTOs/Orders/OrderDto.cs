using System.ComponentModel.DataAnnotations;

namespace CanteenManagement.API.DTOs.Orders
{
    public class OrderDto
    {
        public string Id { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public int OutletId { get; set; }
        public string OutletName { get; set; } = string.Empty;
        public CustomerSummaryDto Customer { get; set; } = new();
        public List<OrderItemDto> Items { get; set; } = new();
        public decimal Subtotal { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public SlotSummaryDto? Slot { get; set; }
        public DateTime OrderDate { get; set; }
        public string Status { get; set; } = "Placed";
        public string? CancellationReason { get; set; }
        public PaymentSummaryDto Payment { get; set; } = new();
        public List<TimelineEntryDto> Timeline { get; set; } = new();
    }

    public class CustomerSummaryDto
    {
        public int? UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = "Student";
        public string? RollNo { get; set; }
        public string? Department { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
    }

    public class OrderItemDto
    {
        public int Id { get; set; }
        public int MenuItemId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Variant { get; set; }
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        public decimal Total { get; set; }
    }

    public class SlotSummaryDto
    {
        public int Id { get; set; }
        public string Session { get; set; } = string.Empty;
        public string TimeWindow { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
    }

    public class PaymentSummaryDto
    {
        public string Method { get; set; } = "UPI";
        public string Status { get; set; } = "Paid";
        public string? TransactionId { get; set; }
        public DateTime? PaidAt { get; set; }
    }

    public class TimelineEntryDto
    {
        public string Status { get; set; } = string.Empty;
        public string Timestamp { get; set; } = string.Empty;
        public string? Note { get; set; }
    }

    public class CreateOrderDto
    {
        [Required]
        public int OutletId { get; set; }

        public int? SlotId { get; set; }

        [Required]
        public string CustomerName { get; set; } = string.Empty;

        [Required]
        public string CustomerRole { get; set; } = "Student";

        public string? RollNo { get; set; }
        public string? Department { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }

        [Required]
        [MinLength(1, ErrorMessage = "At least one order item is required.")]
        public List<CreateOrderItemDto> Items { get; set; } = new();

        [Required]
        public string PaymentMethod { get; set; } = "UPI";
    }

    public class CreateOrderItemDto
    {
        [Required]
        public int MenuItemId { get; set; }
        public string? VariantName { get; set; }
        [Range(1, 100)]
        public int Quantity { get; set; } = 1;
    }

    public class UpdateOrderStatusDto
    {
        [Required]
        public string Status { get; set; } = string.Empty;
        public string? Note { get; set; }
        public string? Reason { get; set; }
    }

    public class CancelOrderDto
    {
        [Required(ErrorMessage = "Cancellation reason is required.")]
        [StringLength(500, MinimumLength = 5)]
        public string Reason { get; set; } = string.Empty;
    }
}
