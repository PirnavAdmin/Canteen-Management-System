using Asp.Versioning;
using CanteenManagement.API.DTOs.Dashboard;
using CanteenManagement.API.Helpers;
using CanteenManagement.API.Services.Interfaces.Dashboard;
using Microsoft.AspNetCore.Mvc;

namespace CanteenManagement.API.Controllers.V1
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/canteen-dashboard")]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary([FromQuery] int? outletId)
        {
            var institutionId = User.ResolveInstitutionId();
            var summary = await _dashboardService.GetSummaryAsync(institutionId, outletId);
            return Ok(ApiResponse<DashboardSummaryDto>.SuccessResponse(summary));
        }

        [HttpGet("hourly-sales")]
        public async Task<IActionResult> GetHourlySales([FromQuery] int? outletId)
        {
            var institutionId = User.ResolveInstitutionId();
            var sales = await _dashboardService.GetHourlySalesAsync(institutionId, outletId);
            return Ok(ApiResponse<IEnumerable<HourlySalesDto>>.SuccessResponse(sales));
        }

        [HttpGet("live-orders")]
        public async Task<IActionResult> GetLiveOrders([FromQuery] int? outletId)
        {
            var institutionId = User.ResolveInstitutionId();
            var orders = await _dashboardService.GetLiveOrdersAsync(institutionId, outletId);
            return Ok(ApiResponse<IEnumerable<LiveOrderDto>>.SuccessResponse(orders));
        }

        [HttpGet("top-selling")]
        public async Task<IActionResult> GetTopSelling([FromQuery] int? outletId)
        {
            var institutionId = User.ResolveInstitutionId();
            var items = await _dashboardService.GetTopSellingItemsAsync(institutionId, outletId);
            return Ok(ApiResponse<IEnumerable<TopSellingItemDto>>.SuccessResponse(items));
        }

        [HttpGet("stock-alerts")]
        public async Task<IActionResult> GetStockAlerts()
        {
            var institutionId = User.ResolveInstitutionId();
            var alerts = await _dashboardService.GetStockAlertsAsync(institutionId);
            return Ok(ApiResponse<IEnumerable<StockAlertDto>>.SuccessResponse(alerts));
        }

        [HttpGet("outlet-sales")]
        public async Task<IActionResult> GetOutletSales()
        {
            var institutionId = User.ResolveInstitutionId();
            var sales = await _dashboardService.GetOutletSalesAsync(institutionId);
            return Ok(ApiResponse<IEnumerable<OutletSalesDto>>.SuccessResponse(sales));
        }
    }
}

