using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CanteenManagement.API.Models.Outlets
{
    [Table("CanteenStaffAssignments")]
    public class CanteenStaffAssignment
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int AssignmentId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public int OutletId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Role { get; set; } = "Cashier";

        public bool IsActive { get; set; } = true;

        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation property
        [ForeignKey(nameof(OutletId))]
        public virtual CanteenOutlet? Outlet { get; set; }
    }
}
