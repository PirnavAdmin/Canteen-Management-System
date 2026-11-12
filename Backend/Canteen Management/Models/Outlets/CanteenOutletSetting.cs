using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CanteenManagement.API.Models.Outlets
{
    [Table("CanteenOutletSettings")]
    public class CanteenOutletSetting
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int SettingId { get; set; }

        [Required]
        public int OutletId { get; set; }

        public int AutoExpireUnpaidMinutes { get; set; } = 10;

        public int PickupHoldMinutes { get; set; } = 30;

        [MaxLength(50)]
        public string CancellationPolicy { get; set; } = "UntilAccepted";

        public bool AllowUpi { get; set; } = true;

        public bool AllowCards { get; set; } = true;

        public bool AllowWallet { get; set; } = true;

        public bool AllowCash { get; set; } = true;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("OutletId")]
        public virtual CanteenOutlet? Outlet { get; set; }
    }
}

