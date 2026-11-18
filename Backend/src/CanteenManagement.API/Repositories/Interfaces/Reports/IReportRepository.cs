using CanteenManagement.API.DTOs.Reports;

namespace CanteenManagement.API.Repositories.Interfaces.Reports
{
    public interface IReportRepository
    {
        Task<ReportResultDto> GetReportDataAsync(int campusId, ReportFilterDto filter);
    }
}

