using CanteenManagement.API.DTOs.Dashboard;

namespace CanteenManagement.API.Services.Interfaces.Dashboard
{
    public interface IDashboardService
    {
        Task<DashboardSummaryDto> GetSummaryAsync(int institutionId, int? outletId = null);
        Task<IEnumerable<HourlySalesDto>> GetHourlySalesAsync(int institutionId, int? outletId = null);
        Task<IEnumerable<LiveOrderDto>> GetLiveOrdersAsync(int institutionId, int? outletId = null);
        Task<IEnumerable<TopSellingItemDto>> GetTopSellingItemsAsync(int institutionId, int? outletId = null);
        Task<IEnumerable<StockAlertDto>> GetStockAlertsAsync(int institutionId);
        Task<IEnumerable<OutletSalesDto>> GetOutletSalesAsync(int institutionId);
    }
}

