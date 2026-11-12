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

        public async Task<DashboardSummaryDto> GetSummaryAsync(int institutionId, int? outletId = null)
        {
            return await _repository.GetSummaryAsync(institutionId, outletId);
        }

        public async Task<IEnumerable<HourlySalesDto>> GetHourlySalesAsync(int institutionId, int? outletId = null)
        {
            return await _repository.GetHourlySalesAsync(institutionId, outletId);
        }

        public async Task<IEnumerable<LiveOrderDto>> GetLiveOrdersAsync(int institutionId, int? outletId = null)
        {
            return await _repository.GetLiveOrdersAsync(institutionId, outletId);
        }

        public async Task<IEnumerable<TopSellingItemDto>> GetTopSellingItemsAsync(int institutionId, int? outletId = null)
        {
            return await _repository.GetTopSellingItemsAsync(institutionId, outletId);
        }

        public async Task<IEnumerable<StockAlertDto>> GetStockAlertsAsync(int institutionId)
        {
            return await _repository.GetStockAlertsAsync(institutionId);
        }

        public async Task<IEnumerable<OutletSalesDto>> GetOutletSalesAsync(int institutionId)
        {
            return await _repository.GetOutletSalesAsync(institutionId);
        }
    }
}
