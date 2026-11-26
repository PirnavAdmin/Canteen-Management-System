using CanteenManagement.API.DTOs.Dashboard;

namespace CanteenManagement.API.Repositories.Interfaces.Dashboard
{
    public interface IDashboardRepository
    {
        Task<DashboardSummaryDto> GetSummaryAsync(int campusId, int? outletId = null);
        Task<IEnumerable<HourlySalesDto>> GetHourlySalesAsync(int campusId, int? outletId = null);
        Task<IEnumerable<LiveOrderDto>> GetLiveOrdersAsync(int campusId, int? outletId = null);
        Task<IEnumerable<TopSellingItemDto>> GetTopSellingItemsAsync(int campusId, int? outletId = null);
        Task<IEnumerable<StockAlertDto>> GetStockAlertsAsync(int campusId, int? outletId = null);
        Task<IEnumerable<OutletSalesDto>> GetOutletSalesAsync(int campusId);
    }
}

