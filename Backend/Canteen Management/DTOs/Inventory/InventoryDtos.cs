using System.ComponentModel.DataAnnotations;

namespace CanteenManagement.API.DTOs.Inventory
{
    public class InventoryItemDto
    {
        public int Id { get; set; }
        public int OutletId { get; set; }
        public string IngredientName { get; set; } = string.Empty;
        public string Category { get; set; } = "Groceries";
        public decimal AvailableQuantity { get; set; }
        public string Unit { get; set; } = "kg";
        public decimal ReorderLevel { get; set; }
        public decimal CostPerUnit { get; set; }
        public string? BatchNumber { get; set; }
        public string? ExpiryDate { get; set; }
        public string Status { get; set; } = "In Stock";
        public DateTime? UpdatedAt { get; set; }
    }

    public class RecordStockMovementDto
    {
        [Required]
        public int IngredientId { get; set; }

        [Required]
        [RegularExpression("^(Stock In|Stock Out|Wastage|Adjustment)$")]
        public string MovementType { get; set; } = "Stock In";

        [Required]
        public decimal Quantity { get; set; }

        public string? BatchNumber { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public string? Reference { get; set; }

        [Required(ErrorMessage = "Reason is mandatory for inventory audit trail.")]
        public string Reason { get; set; } = string.Empty;

        public string? PerformedBy { get; set; }
    }

    public class StockMovementLedgerDto
    {
        public int Id { get; set; }
        public int IngredientId { get; set; }
        public string IngredientName { get; set; } = string.Empty;
        public string MovementType { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = "kg";
        public string? BatchNumber { get; set; }
        public string? ExpiryDate { get; set; }
        public string? Reference { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string PerformedBy { get; set; } = string.Empty;
        public DateTime DateTime { get; set; }
    }

    public class PurchaseOrderDto
    {
        public int Id { get; set; }
        public int OutletId { get; set; }
        public string PoNumber { get; set; } = string.Empty;
        public int? SupplierId { get; set; }
        public string? SupplierName { get; set; }
        public string OrderDate { get; set; } = string.Empty;
        public string? ExpectedDelivery { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = "Submitted";
        public DateTime CreatedAt { get; set; }
    }

    public class CreatePurchaseOrderDto
    {
        [Required]
        public int OutletId { get; set; }
        public int? SupplierId { get; set; }
        public string? SupplierName { get; set; }
        public DateTime? ExpectedDelivery { get; set; }
        public decimal TotalAmount { get; set; }
    }

    public class SupplierDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? ContactPerson { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Gstin { get; set; }
        public string? FssaiNumber { get; set; }
        public string Status { get; set; } = "Active";
    }

    public class CreateSupplierDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        public string? ContactPerson { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Gstin { get; set; }
        public string? FssaiNumber { get; set; }
    }
}

