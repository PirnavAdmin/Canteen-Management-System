using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using CanteenManagement.API.Models.Outlets;

namespace CanteenManagement.API.Models.Inventory
{
    [Table("InventoryItems")]
    public class InventoryItem
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ItemId { get; set; }

        [Required]
        public int InstitutionId { get; set; } = 1;

        [Required]
        public int OutletId { get; set; }

        [Required]
        [MaxLength(100)]
        public string IngredientName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Category { get; set; } = "Groceries";

        [Column(TypeName = "decimal(10,2)")]
        public decimal AvailableQuantity { get; set; } = 0;

        [Required]
        [MaxLength(20)]
        public string Unit { get; set; } = "kg"; // kg, grams, liters, ml, packets, pcs, boxes

        [Column(TypeName = "decimal(10,2)")]
        public decimal ReorderLevel { get; set; } = 10;

        [Column(TypeName = "decimal(10,2)")]
        public decimal CostPerUnit { get; set; } = 0;

        [MaxLength(50)]
        public string? BatchNumber { get; set; }

        [Column(TypeName = "date")]
        public DateTime? ExpiryDate { get; set; }

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "In Stock"; // In Stock, Low Stock, Out of Stock

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        [ForeignKey("OutletId")]
        public virtual CanteenOutlet? Outlet { get; set; }

        public virtual ICollection<StockMovement> Movements { get; set; } = new List<StockMovement>();
    }

    [Table("StockMovements")]
    public class StockMovement
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int MovementId { get; set; }

        [Required]
        public int ItemId { get; set; }

        [Required]
        [MaxLength(30)]
        public string MovementType { get; set; } = "Stock In"; // Stock In, Stock Out, Wastage, Adjustment

        [Column(TypeName = "decimal(10,2)")]
        public decimal Quantity { get; set; }

        [MaxLength(50)]
        public string? BatchNumber { get; set; }

        [Column(TypeName = "date")]
        public DateTime? ExpiryDate { get; set; }

        [MaxLength(50)]
        public string? Reference { get; set; }

        [Required]
        [MaxLength(500)]
        public string Reason { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string PerformedBy { get; set; } = "Campus Inventory Incharge";

        public DateTime DateTime { get; set; } = DateTime.UtcNow;

        [ForeignKey("ItemId")]
        public virtual InventoryItem? Item { get; set; }
    }

    [Table("Suppliers")]
    public class Supplier
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int SupplierId { get; set; }

        [Required]
        public int InstitutionId { get; set; } = 1;

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? ContactPerson { get; set; }

        [MaxLength(20)]
        public string? Phone { get; set; }

        [MaxLength(100)]
        public string? Email { get; set; }

        [MaxLength(50)]
        public string? Gstin { get; set; }

        [MaxLength(50)]
        public string? FssaiNumber { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Active";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    [Table("PurchaseOrders")]
    public class PurchaseOrder
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int PurchaseOrderId { get; set; }

        [Required]
        public int InstitutionId { get; set; } = 1;

        [Required]
        public int OutletId { get; set; }

        [Required]
        [MaxLength(50)]
        public string PoNumber { get; set; } = string.Empty; // e.g. PO-2026-104

        public int? SupplierId { get; set; }

        [MaxLength(100)]
        public string? SupplierName { get; set; }

        [Column(TypeName = "date")]
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "date")]
        public DateTime? ExpectedDelivery { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalAmount { get; set; }

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "Submitted"; // Draft, Submitted, Received, Cancelled

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        [ForeignKey("SupplierId")]
        public virtual Supplier? Supplier { get; set; }
    }
}

