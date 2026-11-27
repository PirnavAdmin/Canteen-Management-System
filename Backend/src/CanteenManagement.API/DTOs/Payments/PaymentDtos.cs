using System.ComponentModel.DataAnnotations;

namespace CanteenManagement.API.DTOs.Payments
{
    public class CreatePaymentIntentRequestDto
    {
        [Required]
        public string OrderId { get; set; } = string.Empty;

        [Required]
        [Range(1, 100000)]
        public decimal Amount { get; set; }

        [Required]
        public string Method { get; set; } = "UPI"; // UPI, CARD, WALLET, CASH

        public string? Vpa { get; set; }
    }

    public class PaymentIntentResponseDto
    {
        public string OrderId { get; set; } = string.Empty;
        public string TransactionId { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending"; // Pending, Paid
        public decimal Amount { get; set; }
        public string Method { get; set; } = string.Empty;
        public string? UpiIntentUri { get; set; }
        public string? GatewayOrderId { get; set; }
        public string? KeyId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class VerifyPaymentRequestDto
    {
        [Required]
        public string OrderId { get; set; } = string.Empty;

        public string? TransactionId { get; set; }
        public string? GatewayPaymentId { get; set; }
        public string? GatewayOrderId { get; set; }
        public string? GatewaySignature { get; set; }
    }

    public class PaymentStatusResponseDto
    {
        public string OrderId { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending"; // Pending, Paid, Failed, Cancelled
        public string Method { get; set; } = string.Empty;
        public string? TransactionId { get; set; }
        public DateTime? PaidAt { get; set; }
        public string? Token { get; set; }
        public decimal Amount { get; set; }
    }
}
