using System.ComponentModel.DataAnnotations;

namespace CanteenManagement.API.DTOs.Settings
{
    public class SystemSettingsResponseDto
    {
        public OutletSettingsDto Outlet { get; set; } = new();
        public PaymentSettingsDto Payments { get; set; } = new();
        public OrderRulesDto OrderRules { get; set; } = new();
        public PrivacySettingsDto Privacy { get; set; } = new();
    }

    public class OutletSettingsDto
    {
        public int AutoExpireUnpaidMinutes { get; set; } = 10;
        public int PickupHoldMinutes { get; set; } = 30;
        public string CancellationPolicy { get; set; } = "UntilAccepted";
        public string OperatingHoursStart { get; set; } = "07:30";
        public string OperatingHoursEnd { get; set; } = "21:30";
        public bool MaintenanceMode { get; set; } = false;
    }

    public class PaymentSettingsDto
    {
        public bool AllowUpi { get; set; } = true;
        public bool AllowCards { get; set; } = true;
        public bool AllowWallet { get; set; } = true;
        public bool AllowCash { get; set; } = true;
        public decimal MinOrderAmount { get; set; } = 10.00m;
        public decimal GstPercent { get; set; } = 5.0m;
    }

    public class OrderRulesDto
    {
        public int MaxItemsPerOrder { get; set; } = 8;
        public int MaxQuantityPerItem { get; set; } = 4;
        public int PreOrderWindowHours { get; set; } = 24;
        public bool RestrictDuringClassHours { get; set; } = false;
    }

    public class PrivacySettingsDto
    {
        public int RetentionPeriodDays { get; set; } = 2555; // 7 years statutory financial retention
        public bool AnonymizeOnErasure { get; set; } = true;
        public List<DsarRequestDto> DsarRequests { get; set; } = new();
    }

    public class DsarRequestDto
    {
        public string Id { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string? UserRole { get; set; }
        public string Email { get; set; } = string.Empty;
        public string RequestType { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending";
        public string? Notes { get; set; }
        public DateTime RequestedAt { get; set; }
        public DateTime? FulfilledAt { get; set; }
    }

    public class UpdateDsarStatusDto
    {
        [Required]
        [RegularExpression("^(Pending|In Progress|Fulfilled|Rejected)$")]
        public string Status { get; set; } = "Fulfilled";
        public string? Notes { get; set; }
    }
}
