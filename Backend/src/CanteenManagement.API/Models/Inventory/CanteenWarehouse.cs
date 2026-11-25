using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CanteenManagement.API.Models.Inventory
{
    [Table("CanteenWarehouses")]
    public class CanteenWarehouse
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int WarehouseId { get; set; }

        [Required]
        public int CampusId { get; set; } = 1;

        [Required]
        [MaxLength(30)]
        public string Code { get; set; } = "WH-CENTRAL";

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = "Central Procurement Warehouse";

        [MaxLength(200)]
        public string? Location { get; set; } = "Campus Central Logistics Block, Ground Floor";

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}
