using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using CanteenManagement.API.Models.Auth;
using CanteenManagement.API.Models.Outlets;
using CanteenManagement.API.Models.Slots;

namespace CanteenManagement.API.Models.Orders
{
    [Table("Orders")]
    public class Order
    {
        [Key]
        [MaxLength(50)]
        public string OrderId { get; set; } = string.Empty; // e.g. ORD-2026-8910

        [Required]
        public int InstitutionId { get; set; } = 1;

        [Required]
        public int OutletId { get; set; }

        public int? UserId { get; set; }

        public int? SlotId { get; set; }

        [Required]
        [MaxLength(20)]
        public string Token { get; set; } = string.Empty; // e.g. T-101

        [Required]
        [MaxLength(100)]
        public string CustomerName { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        public string CustomerRole { get; set; } = "Student"; // Student, Faculty, Staff

        [MaxLength(50)]
        public string? RollNo { get; set; }

        [MaxLength(100)]
        public string? Department { get; set; }

        [MaxLength(20)]
        public string? CustomerPhone { get; set; }

        [MaxLength(100)]
        public string? CustomerEmail { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal Subtotal { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal TaxAmount { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalAmount { get; set; }

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "Placed"; // Placed, Accepted, Preparing, Ready for Pickup, Collected, Cancelled, Refunded

        public string? CancellationReason { get; set; }

        public DateTime OrderDate { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation Properties
        [ForeignKey("OutletId")]
        public virtual CanteenOutlet? Outlet { get; set; }

        [ForeignKey("UserId")]
        public virtual User? User { get; set; }

        [ForeignKey("SlotId")]
        public virtual Slot? Slot { get; set; }

        public virtual ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
        public virtual ICollection<OrderTimeline> Timeline { get; set; } = new List<OrderTimeline>();
        public virtual ICollection<PaymentTransaction> Payments { get; set; } = new List<PaymentTransaction>();
    }

    [Table("OrderItems")]
    public class OrderItem
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int OrderItemId { get; set; }

        [Required]
        [MaxLength(50)]
        public string OrderId { get; set; } = string.Empty;

        [Required]
        public int MenuItemId { get; set; }

        [Required]
        [MaxLength(150)]
        public string ItemName { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? VariantName { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal UnitPrice { get; set; }

        public int Quantity { get; set; } = 1;

        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalPrice { get; set; }

        [ForeignKey("OrderId")]
        public virtual Order? Order { get; set; }
    }

    [Table("OrderTimelines")]
    public class OrderTimeline
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int TimelineId { get; set; }

        [Required]
        [MaxLength(50)]
        public string OrderId { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Note { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [ForeignKey("OrderId")]
        public virtual Order? Order { get; set; }
    }

    [Table("PaymentTransactions")]
    public class PaymentTransaction
    {
        [Key]
        [MaxLength(60)]
        public string TransactionId { get; set; } = string.Empty; // e.g. TXN-WAL-994102

        [Required]
        [MaxLength(50)]
        public string OrderId { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        public string Method { get; set; } = "UPI"; // UPI, Card / Net Banking, Campus Wallet, Counter Cash

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Paid"; // Paid, Pending, Refunded, Failed

        [Column(TypeName = "decimal(10,2)")]
        public decimal Amount { get; set; }

        public DateTime? PaidAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("OrderId")]
        public virtual Order? Order { get; set; }
    }
}
