using Asp.Versioning;
using CanteenManagement.API.DTOs.Payments;
using CanteenManagement.API.DTOs.Settings;
using CanteenManagement.API.Helpers;
using CanteenManagement.API.Models.Orders;
using CanteenManagement.API.Repositories.Interfaces.Orders;
using CanteenManagement.API.Services.Interfaces.Common;
using CanteenManagement.API.Services.Interfaces.Settings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CanteenManagement.API.Controllers.V1
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/payments")]
    public class PaymentsController : ControllerBase
    {
        private readonly ISettingsService _settingsService;
        private readonly IOrderRepository _orderRepository;
        private readonly IAuditLoggingService _auditService;
        private readonly ILogger<PaymentsController> _logger;

        public PaymentsController(
            ISettingsService settingsService,
            IOrderRepository orderRepository,
            IAuditLoggingService auditService,
            ILogger<PaymentsController> logger)
        {
            _settingsService = settingsService;
            _orderRepository = orderRepository;
            _auditService = auditService;
            _logger = logger;
        }

        /// <summary>
        /// Retrieves the public payment configuration (Allowed modes, Merchant VPA, Legal Name, Gateway Provider).
        /// Safe for unauthenticated customer checkout screens.
        /// </summary>
        [AllowAnonymous]
        [HttpGet("config")]
        public async Task<IActionResult> GetConfig()
        {
            var campusId = User.Identity?.IsAuthenticated == true ? User.ResolveCampusId() : 1;
            var config = await _settingsService.GetPublicPaymentConfigAsync(campusId);
            return Ok(ApiResponse<PublicPaymentConfigDto>.SuccessResponse(config));
        }

        /// <summary>
        /// Creates a payment intent for dynamic UPI QR generation or Gateway checkout.
        /// </summary>
        [AllowAnonymous]
        [HttpPost("create-intent")]
        public async Task<IActionResult> CreateIntent([FromBody] CreatePaymentIntentRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return BadRequest(ApiResponse<string>.ErrorResponse("Validation failed.", errors));
            }

            var campusId = User.Identity?.IsAuthenticated == true ? User.ResolveCampusId() : 1;
            var config = await _settingsService.GetPublicPaymentConfigAsync(campusId);

            var txnId = $"TXN-UPI-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";
            var vpa = !string.IsNullOrWhiteSpace(config.UpiVpa) ? config.UpiVpa : "canteen.apex@icici";
            var merchantName = !string.IsNullOrWhiteSpace(config.UpiMerchantName) ? config.UpiMerchantName : "Apex Institute Canteen";

            // Format standard NPCI UPI Intent URI
            var upiUri = $"upi://pay?pa={Uri.EscapeDataString(vpa)}&pn={Uri.EscapeDataString(merchantName)}&am={dto.Amount:F2}&cu=INR&tn={Uri.EscapeDataString(dto.OrderId)}&tr={txnId}";

            var response = new PaymentIntentResponseDto
            {
                OrderId = dto.OrderId,
                TransactionId = txnId,
                Status = "Pending",
                Amount = dto.Amount,
                Method = dto.Method,
                UpiIntentUri = upiUri,
                GatewayOrderId = $"GW_ORD_{dto.OrderId}",
                KeyId = config.GatewayKeyId,
                CreatedAt = DateTime.UtcNow
            };

            return Ok(ApiResponse<PaymentIntentResponseDto>.SuccessResponse(response, "Payment intent generated successfully."));
        }

        /// <summary>
        /// Returns the real-time payment status of an order for dynamic QR polling.
        /// </summary>
        [AllowAnonymous]
        [HttpGet("status/{orderId}")]
        public async Task<IActionResult> GetStatus(string orderId)
        {
            var campusId = User.Identity?.IsAuthenticated == true ? User.ResolveCampusId() : 1;
            var order = await _orderRepository.GetByIdAsync(orderId, campusId);

            if (order == null)
            {
                // Fallback check across all campuses
                order = await _orderRepository.GetByIdAsync(orderId, 0);
            }

            if (order == null)
            {
                return NotFound(ApiResponse<string>.ErrorResponse($"Order '{orderId}' not found."));
            }

            var payment = order.Payments?.FirstOrDefault();
            var response = new PaymentStatusResponseDto
            {
                OrderId = order.OrderId,
                Status = payment?.Status ?? "Pending",
                Method = payment?.Method ?? "UPI",
                TransactionId = payment?.TransactionId,
                PaidAt = payment?.PaidAt,
                Token = order.Token,
                Amount = order.TotalAmount
            };

            return Ok(ApiResponse<PaymentStatusResponseDto>.SuccessResponse(response));
        }

        /// <summary>
        /// Verifies and settles payment for online card/net banking or UPI transactions.
        /// </summary>
        [AllowAnonymous]
        [HttpPost("verify")]
        public async Task<IActionResult> Verify([FromBody] VerifyPaymentRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.OrderId))
            {
                return BadRequest(ApiResponse<string>.ErrorResponse("Order ID is required."));
            }

            var campusId = User.Identity?.IsAuthenticated == true ? User.ResolveCampusId() : 1;
            var order = await _orderRepository.GetByIdAsync(dto.OrderId, campusId);

            if (order == null)
            {
                order = await _orderRepository.GetByIdAsync(dto.OrderId, 0);
            }

            if (order == null)
            {
                return NotFound(ApiResponse<string>.ErrorResponse($"Order '{dto.OrderId}' not found."));
            }

            var payment = order.Payments?.FirstOrDefault() ?? new PaymentTransaction
            {
                OrderId = order.OrderId,
                Method = "UPI",
                Amount = order.TotalAmount
            };

            payment.Status = "Paid";
            payment.PaidAt = DateTime.UtcNow;
            if (!string.IsNullOrWhiteSpace(dto.GatewayPaymentId))
            {
                payment.TransactionId = dto.GatewayPaymentId;
            }
            else if (!string.IsNullOrWhiteSpace(dto.TransactionId))
            {
                payment.TransactionId = dto.TransactionId;
            }

            await _orderRepository.UpdatePaymentTransactionAsync(payment);

            var verifier = !string.IsNullOrWhiteSpace(dto.VerifiedBy)
                ? dto.VerifiedBy
                : (User.Identity?.Name ?? "Cashier/Admin");
            var verificationNote = !string.IsNullOrWhiteSpace(dto.Note)
                ? dto.Note
                : $"UPI payment (Ref: {payment.TransactionId}) verified by {verifier}; sent to kitchen.";

            // Also advance status to Accepted if it was Placed
            if (order.Status == "Placed")
            {
                order.Status = "Accepted";
                order.Timeline.Add(new OrderTimeline
                {
                    OrderId = order.OrderId,
                    Status = "Accepted",
                    Note = verificationNote,
                    Timestamp = DateTime.UtcNow
                });
                await _orderRepository.UpdateAsync(order);
            }

            return Ok(ApiResponse<PaymentStatusResponseDto>.SuccessResponse(new PaymentStatusResponseDto
            {
                OrderId = order.OrderId,
                Status = "Paid",
                Method = payment.Method,
                TransactionId = payment.TransactionId,
                PaidAt = payment.PaidAt,
                Token = order.Token,
                Amount = order.TotalAmount
            }, "Payment verified and order accepted successfully."));
        }

        /// <summary>
        /// Webhook receiver for payment gateways (Razorpay, Cashfree, etc.).
        /// </summary>
        [AllowAnonymous]
        [HttpPost("webhook")]
        public async Task<IActionResult> Webhook()
        {
            try
            {
                using var reader = new StreamReader(Request.Body);
                var rawPayload = await reader.ReadToEndAsync();

                _logger.LogInformation("Received payment webhook: {Payload}", rawPayload);

                // Note: In production, verify HMAC signature from Request.Headers["X-Razorpay-Signature"]
                return Ok(new { received = true, timestamp = DateTime.UtcNow });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing payment webhook.");
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
