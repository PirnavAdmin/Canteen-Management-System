using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using CanteenManagement.API.Models.Outlets;

namespace CanteenManagement.API.Models.Inventory
{
    [Table("StockRequests")]
    public class StockRequest
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int RequestId { get; set; }

        [Required]
        public int CampusId { get; set; } = 1;

        [Required]
        public int OutletId { get; set; }

        public int? SourceOutletId { get; set; }

        public int? ItemId { get; set; }

        [MaxLength(50)]
        public string? ItemCode { get; set; }

        [Required]
        [MaxLength(100)]
        public string ItemName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Category { get; set; } = "Groceries";

        [Column(TypeName = "decimal(10,2)")]
        public decimal RequestedQuantity { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? IssuedQuantity { get; set; }

        [Required]
        [MaxLength(20)]
        public string Unit { get; set; } = "kg";

        [Required]
        [MaxLength(20)]
        public string Urgency { get; set; } = "Normal"; // Normal, High, Emergency

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "Pending Review"; // Pending Review, Dispatched, Received, Rejected

        public string? Notes { get; set; }

        public string? AdminNotes { get; set; }

        [Column(TypeName = "date")]
        public DateTime? RequiredByDate { get; set; }

        [Required]
        [MaxLength(100)]
        public string RequestedBy { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? DispatchedBy { get; set; }

        [MaxLength(100)]
        public string? ReceivedBy { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? DispatchedAt { get; set; }

        public DateTime? ReceivedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        [ForeignKey("OutletId")]
        public virtual CanteenOutlet? Outlet { get; set; }

        [ForeignKey("ItemId")]
        public virtual InventoryItem? Item { get; set; }
    }
}

