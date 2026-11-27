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
        // UPI Fast Pay
        public bool UpiEnabled { get; set; } = true;
        public bool AllowUpi { get => UpiEnabled; set => UpiEnabled = value; }
        public string UpiVpa { get; set; } = "canteen.apex@icici";
        public string UpiMerchantName { get; set; } = "Apex Institute Canteen";

        // Cards & Institutional Net Banking
        public bool CardNetBankingEnabled { get; set; } = false;
        public bool AllowCards { get => CardNetBankingEnabled; set => CardNetBankingEnabled = value; }
        public string GatewayProvider { get; set; } = "Razorpay"; // Razorpay, Cashfree, PineLabs
        public string? GatewayKeyId { get; set; }
        public string? GatewayKeySecret { get; set; }

        // Campus Smart ID / Student Wallet
        public bool CampusWalletEnabled { get; set; } = true;
        public bool AllowWallet { get => CampusWalletEnabled; set => CampusWalletEnabled = value; }
        public decimal CampusWalletMaxBalance { get; set; } = 2000.00m;

        // Cash Settlement at Counter
        public bool CashOnCounterEnabled { get; set; } = true;
        public bool AllowCash { get => CashOnCounterEnabled; set => CashOnCounterEnabled = value; }

        // General Financials
        public decimal MinOrderAmount { get; set; } = 10.00m;
        public decimal GstPercent { get; set; } = 5.0m;
    }

    public class PublicPaymentConfigDto
    {
        public bool UpiEnabled { get; set; } = true;
        public string UpiVpa { get; set; } = "canteen.apex@icici";
        public string UpiMerchantName { get; set; } = "Apex Institute Canteen";
        public bool CardNetBankingEnabled { get; set; } = false;
        public string GatewayProvider { get; set; } = "Razorpay";
        public string? GatewayKeyId { get; set; }
        public bool CampusWalletEnabled { get; set; } = true;
        public decimal CampusWalletMaxBalance { get; set; } = 2000.00m;
        public bool CashOnCounterEnabled { get; set; } = true;
        public decimal MinOrderAmount { get; set; } = 10.00m;
        public decimal GstPercent { get; set; } = 5.0m;
    }

    public class OrderRulesDto
    {
        public decimal GstPercent { get; set; } = 5.0m;
        public decimal PackagingFee { get; set; } = 5.0m;
        public bool EnablePackagingFee { get; set; } = true;
        public int MaxItemsPerOrder { get; set; } = 8;
        public int MaxQuantityPerItem { get; set; } = 4;
        public int PreOrderWindowHours { get; set; } = 24;
        public bool RestrictDuringClassHours { get; set; } = false;
    }
}
