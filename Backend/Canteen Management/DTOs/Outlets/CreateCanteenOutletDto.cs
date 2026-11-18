using System.ComponentModel.DataAnnotations;

namespace CanteenManagement.API.DTOs.Outlets
{
    public class CreateCanteenOutletDto
    {
        [Required(ErrorMessage = "Outlet Code is required (e.g. MC-01).")]
        [StringLength(20, MinimumLength = 2, ErrorMessage = "Code must be between 2 and 20 characters.")]
        public string Code { get; set; } = string.Empty;

        [Required(ErrorMessage = "Outlet Name is required (e.g. Main Canteen).")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "Name must be between 3 and 100 characters.")]
        public string Name { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? Location { get; set; }

        [Required(ErrorMessage = "Open time is required.")]
        [RegularExpression(@"^([01]?[0-9]|2[0-3]):[0-5][0-9]$", ErrorMessage = "Open time must be in HH:mm format.")]
        public string OpenTime { get; set; } = "08:00";

        [Required(ErrorMessage = "Close time is required.")]
        [RegularExpression(@"^([01]?[0-9]|2[0-3]):[0-5][0-9]$", ErrorMessage = "Close time must be in HH:mm format.")]
        public string CloseTime { get; set; } = "16:30";

        [MaxLength(50)]
        public string? FssaiLicenseNo { get; set; }

        [Phone(ErrorMessage = "Invalid contact phone number.")]
        public string? ContactNumber { get; set; }

        [Required]
        [RegularExpression("^(Active|Inactive)$", ErrorMessage = "Status must be Active or Inactive.")]
        public string Status { get; set; } = "Active";

        public bool IsOrderAcceptanceEnabled { get; set; } = true;

        public string? WorkingDays { get; set; } = "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday";

        public string? AdminContactJson { get; set; }
    }

    public class UpdateCanteenOutletDto
    {
        [Required(ErrorMessage = "Outlet Name is required.")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "Name must be between 3 and 100 characters.")]
        public string Name { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? Location { get; set; }

        [Required(ErrorMessage = "Open time is required.")]
        [RegularExpression(@"^([01]?[0-9]|2[0-3]):[0-5][0-9]$", ErrorMessage = "Open time must be in HH:mm format.")]
        public string OpenTime { get; set; } = "08:00";

        [Required(ErrorMessage = "Close time is required.")]
        [RegularExpression(@"^([01]?[0-9]|2[0-3]):[0-5][0-9]$", ErrorMessage = "Close time must be in HH:mm format.")]
        public string CloseTime { get; set; } = "16:30";

        [MaxLength(50)]
        public string? FssaiLicenseNo { get; set; }

        [Phone(ErrorMessage = "Invalid contact phone number.")]
        public string? ContactNumber { get; set; }

        [Required]
        [RegularExpression("^(Active|Inactive)$", ErrorMessage = "Status must be Active or Inactive.")]
        public string Status { get; set; } = "Active";

        public bool IsOrderAcceptanceEnabled { get; set; } = true;

        public string? WorkingDays { get; set; }

        public string? AdminContactJson { get; set; }
    }

    public class ToggleOutletStatusDto
    {
        [Required]
        [RegularExpression("^(Active|Inactive)$", ErrorMessage = "Status must be Active or Inactive.")]
        public string Status { get; set; } = "Active";
    }

    public class UpdateOutletSettingsDto
    {
        [Range(1, 120, ErrorMessage = "Auto expire timer must be between 1 and 120 minutes.")]
        public int AutoExpireUnpaidMinutes { get; set; } = 10;

        [Range(5, 240, ErrorMessage = "Pickup hold time must be between 5 and 240 minutes.")]
        public int PickupHoldMinutes { get; set; } = 30;

        [Required]
        public string CancellationPolicy { get; set; } = "UntilAccepted";

        public bool AllowUpi { get; set; } = true;
        public bool AllowCards { get; set; } = true;
        public bool AllowWallet { get; set; } = true;
        public bool AllowCash { get; set; } = true;
    }
}

