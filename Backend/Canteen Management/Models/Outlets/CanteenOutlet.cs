using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CanteenManagement.API.Models.Outlets
{
    [Table("CanteenOutlets")]
    public class CanteenOutlet
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int OutletId { get; set; }

        [Required]
        public int InstitutionId { get; set; } = 1;

        [Required]
        [MaxLength(20)]
        public string Code { get; set; } = string.Empty; // e.g. MC-01, FC-02

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty; // e.g. Main Canteen

        [MaxLength(200)]
        public string? Location { get; set; } // e.g. Student Center, Ground Floor

        [MaxLength(10)]
        public string OpenTime { get; set; } = "08:00";

        [MaxLength(10)]
        public string CloseTime { get; set; } = "16:30";

        [MaxLength(50)]
        public string? FssaiLicenseNo { get; set; } // Mandatory printed on bills

        [MaxLength(20)]
        public string? ContactNumber { get; set; }

        [MaxLength(20)]
        public string Status { get; set; } = "Active"; // Active, Inactive

        public bool IsOrderAcceptanceEnabled { get; set; } = true;

        [Column(TypeName = "TEXT")]
        public string? WorkingDays { get; set; } = "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday";

        [Column(TypeName = "TEXT")]
        public string? AdminContactJson { get; set; } // Stores admin name, email, phone

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation property
        public virtual CanteenOutletSetting? Settings { get; set; }
    }
}

