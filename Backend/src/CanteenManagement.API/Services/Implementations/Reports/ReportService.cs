using CanteenManagement.API.DTOs.Reports;
using CanteenManagement.API.Repositories.Interfaces.Reports;
using CanteenManagement.API.Services.Interfaces.Reports;

namespace CanteenManagement.API.Services.Implementations.Reports
{
    public class ReportService : IReportService
    {
        private readonly IReportRepository _repository;

        public ReportService(IReportRepository repository)
        {
            _repository = repository;
        }

        public async Task<ReportResultDto> GetReportDataAsync(int institutionId, ReportFilterDto filter)
        {
            return await _repository.GetReportDataAsync(institutionId, filter);
        }
    }
}
