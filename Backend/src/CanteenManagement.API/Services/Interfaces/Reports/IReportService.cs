using CanteenManagement.API.DTOs.Reports;

namespace CanteenManagement.API.Services.Interfaces.Reports
{
    public interface IReportService
    {
        Task<ReportResultDto> GetReportDataAsync(int institutionId, ReportFilterDto filter);
    }
}
