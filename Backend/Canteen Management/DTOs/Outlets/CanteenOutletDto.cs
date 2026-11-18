namespace CanteenManagement.API.DTOs.Outlets
{
    public class CanteenOutletDto
    {
        public int OutletId { get; set; }
        public int InstitutionId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Location { get; set; }
        public string OpenTime { get; set; } = "08:00";
        public string CloseTime { get; set; } = "16:30";
        public string? FssaiLicenseNo { get; set; }
        public string? ContactNumber { get; set; }
        public string Status { get; set; } = "Active";
        public bool IsOrderAcceptanceEnabled { get; set; } = true;
        public string? WorkingDays { get; set; }
        public string? AdminContactJson { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public CanteenOutletSettingDto? Settings { get; set; }
    }

    public class CanteenOutletSettingDto
    {
        public int SettingId { get; set; }
        public int OutletId { get; set; }
        public int AutoExpireUnpaidMinutes { get; set; } = 10;
        public int PickupHoldMinutes { get; set; } = 30;
        public string CancellationPolicy { get; set; } = "UntilAccepted";
        public bool AllowUpi { get; set; } = true;
        public bool AllowCards { get; set; } = true;
        public bool AllowWallet { get; set; } = true;
        public bool AllowCash { get; set; } = true;
        public DateTime UpdatedAt { get; set; }
    }

    public class CanteenOutletStatsDto
    {
        public int TotalOutlets { get; set; }
        public int ActiveOutlets { get; set; }
        public int InactiveOutlets { get; set; }
        public int TotalMenuItems { get; set; }
        public int OrdersToday { get; set; }
        public decimal RevenueToday { get; set; }
    }
}

