using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using CanteenManagement.API.Models.Outlets;

namespace CanteenManagement.API.Models.Slots
{
    [Table("Slots")]
    public class Slot
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int SlotId { get; set; }

        [Required]
        public int InstitutionId { get; set; } = 1;

        [Required]
        public int OutletId { get; set; }

        [Required]
        [MaxLength(30)]
        public string Session { get; set; } = "Lunch"; // Breakfast, Lunch, Evening Snacks, Dinner

        [Required]
        [Column(TypeName = "date")]
        public DateTime Date { get; set; }

        [Required]
        [MaxLength(20)]
        public string StartTime { get; set; } = "12:30"; // e.g. 12:30 PM or 12:30

        [Required]
        [MaxLength(20)]
        public string EndTime { get; set; } = "13:00"; // e.g. 01:00 PM or 13:00

        public int MaxCapacity { get; set; } = 50;

        public int BookedOrders { get; set; } = 0;

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "Open"; // Open, Fast Filling, Full, Paused, Closed

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("OutletId")]
        public virtual CanteenOutlet? Outlet { get; set; }
    }
}
