using System.ComponentModel.DataAnnotations;

namespace CanteenManagement.API.DTOs.Settings
{
    public class SystemSettingsResponseDto
    {
        public PaymentSettingsDto Payments { get; set; } = new();
        public OrderRulesDto OrderRules { get; set; } = new();
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

}

