using CanteenManagement.API.DTOs.Dashboard;
using CanteenManagement.API.Repositories.Interfaces.Dashboard;
using CanteenManagement.API.Services.Interfaces.Dashboard;

namespace CanteenManagement.API.Services.Implementations.Dashboard
{
    public class DashboardService : IDashboardService
    {
        private readonly IDashboardRepository _repository;

        public DashboardService(IDashboardRepository repository)
        {
            _repository = repository;
        }

        public async Task<DashboardSummaryDto> GetSummaryAsync(int campusId, int? outletId = null)
        {
            return await _repository.GetSummaryAsync(campusId, outletId);
        }

        public async Task<IEnumerable<HourlySalesDto>> GetHourlySalesAsync(int campusId, int? outletId = null)
        {
            return await _repository.GetHourlySalesAsync(campusId, outletId);
        }

        public async Task<IEnumerable<LiveOrderDto>> GetLiveOrdersAsync(int campusId, int? outletId = null)
        {
            return await _repository.GetLiveOrdersAsync(campusId, outletId);
        }

        public async Task<IEnumerable<TopSellingItemDto>> GetTopSellingItemsAsync(int campusId, int? outletId = null)
        {
            return await _repository.GetTopSellingItemsAsync(campusId, outletId);
        }

        public async Task<IEnumerable<StockAlertDto>> GetStockAlertsAsync(int campusId)
        {
            return await _repository.GetStockAlertsAsync(campusId);
        }

        public async Task<IEnumerable<OutletSalesDto>> GetOutletSalesAsync(int campusId)
        {
            return await _repository.GetOutletSalesAsync(campusId);
        }
    }
}

