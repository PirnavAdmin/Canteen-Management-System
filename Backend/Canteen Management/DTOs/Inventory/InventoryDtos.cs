using System.ComponentModel.DataAnnotations;

namespace CanteenManagement.API.DTOs.Inventory
{
    public class InventoryItemDto
    {
        public int Id { get; set; }
        public int OutletId { get; set; }
        public string OutletName { get; set; } = "Main Canteen";
        public string ItemCode { get; set; } = string.Empty;
        public string IngredientName { get; set; } = string.Empty;
        public string Category { get; set; } = "Groceries";
        public decimal AvailableQuantity { get; set; }
        public string Unit { get; set; } = "kg";
        public decimal ReorderLevel { get; set; }
        public decimal CostPerUnit { get; set; }
        public string? BatchNumber { get; set; }
        public string? ExpiryDate { get; set; }
        public string? SupplierName { get; set; }
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

    public class PurchaseOrderItemDto
    {
        public string IngredientName { get; set; } = string.Empty;
        public decimal Qty { get; set; } = 1;
        public string Unit { get; set; } = "kg";
        public decimal UnitPrice { get; set; }
        public decimal Total { get; set; }
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
        public List<PurchaseOrderItemDto> Items { get; set; } = new();
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
        public List<PurchaseOrderItemDto>? Items { get; set; }
    }

    public class SupplierDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? ContactPerson { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string? SuppliedCategories { get; set; }
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
        public string? Address { get; set; }
        public string? SuppliedCategories { get; set; }
        public string? Gstin { get; set; }
        public string? FssaiNumber { get; set; }
    }

    public class UpdateSupplierDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        public string? ContactPerson { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string? SuppliedCategories { get; set; }
        public string? Gstin { get; set; }
        public string? FssaiNumber { get; set; }
        public string? Status { get; set; }
    }

    public class UpdateSupplierStatusDto
    {
        [Required]
        public string Status { get; set; } = "Active";
    }

    public class SupplierDeleteResultDto
    {
        public bool Success { get; set; }
        public string ActionTaken { get; set; } = "HARD_DELETED";
        public int LinkedPOCount { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class CreateInventoryItemDto
    {
        [Required]
        [MaxLength(100)]
        public string IngredientName { get; set; } = string.Empty;

        [MaxLength(50)]
        public string Category { get; set; } = "Groceries";

        public decimal AvailableQuantity { get; set; } = 0;

        [MaxLength(20)]
        public string Unit { get; set; } = "kg";

        public decimal ReorderLevel { get; set; } = 10;

        public decimal CostPerUnit { get; set; } = 0;

        public int? OutletId { get; set; } = 1;

        [MaxLength(50)]
        public string? BatchNumber { get; set; }

        public DateTime? ExpiryDate { get; set; }

        [MaxLength(30)]
        public string Status { get; set; } = "In Stock";
    }

    public class UpdateInventoryItemDto
    {
        [MaxLength(100)]
        public string? IngredientName { get; set; }

        [MaxLength(50)]
        public string? Category { get; set; }

        public decimal? AvailableQuantity { get; set; }

        [MaxLength(20)]
        public string? Unit { get; set; }

        public decimal? ReorderLevel { get; set; }

        public decimal? CostPerUnit { get; set; }

        public int? OutletId { get; set; }

        [MaxLength(50)]
        public string? BatchNumber { get; set; }

        public DateTime? ExpiryDate { get; set; }

        [MaxLength(30)]
        public string? Status { get; set; }
    }

    public class StockRequestDto
    {
        public string Id { get; set; } = string.Empty;
        public string RequestId
        {
            get => Id;
            set => Id = value;
        }
        public int CampusId { get; set; }
        public int OutletId { get; set; }
        public string OutletName { get; set; } = "Kitchen Outlet";
        public int? SourceOutletId { get; set; }
        public int? ItemId { get; set; }
        public string ItemCode { get; set; } = "ING-REQ";
        public string ItemName { get; set; } = string.Empty;
        public string IngredientName => ItemName;
        public string Category { get; set; } = "Groceries";
        public decimal RequestedQuantity { get; set; }
        public decimal Quantity => RequestedQuantity;
        public decimal? IssuedQuantity { get; set; }
        public string Unit { get; set; } = "kg";
        public string Urgency { get; set; } = "Normal";
        public string Status { get; set; } = "Pending Review";
        public string? Notes { get; set; }
        public string? AdminNotes { get; set; }
        public string? RequiredByDate { get; set; }
        public string RequestedBy { get; set; } = string.Empty;
        public string? DispatchedBy { get; set; }
        public string? ReceivedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? DispatchedAt { get; set; }
        public DateTime? ReceivedAt { get; set; }
    }

    public class CreateStockRequestDto
    {
        [Required]
        public int OutletId { get; set; }

        public int? ItemId { get; set; }

        public string? ItemCode { get; set; }

        [Required]
        [MaxLength(100)]
        public string ItemName { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? Category { get; set; } = "Groceries";

        [Required]
        public decimal RequestedQuantity { get; set; }

        [MaxLength(20)]
        public string? Unit { get; set; } = "kg";

        [MaxLength(20)]
        public string? Urgency { get; set; } = "Normal";

        public string? Notes { get; set; }

        public DateTime? RequiredByDate { get; set; }

        public string? RequestedBy { get; set; }
    }

    public class DispatchStockRequestDto
    {
        [Required]
        public decimal IssuedQuantity { get; set; }

        public string? AdminNotes { get; set; }
    }

    public class RejectStockRequestDto
    {
        [Required]
        public string Reason { get; set; } = string.Empty;
    }
}

