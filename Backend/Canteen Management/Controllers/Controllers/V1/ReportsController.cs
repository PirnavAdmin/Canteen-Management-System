using Asp.Versioning;
using CanteenManagement.API.DTOs.Reports;
using CanteenManagement.API.Helpers;
using CanteenManagement.API.Services.Interfaces.Reports;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CanteenManagement.API.Controllers.V1
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/canteen-reports")]
    [Authorize(Policy = "RequireAdmin")]
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _reportService;

        public ReportsController(IReportService reportService)
        {
            _reportService = reportService;
        }

        [HttpGet("sales")]
        public async Task<IActionResult> GetSalesReport([FromQuery] ReportFilterDto filter)
        {
            var institutionId = User.ResolveInstitutionId();
            filter.ReportType = "sales_summary";
            var result = await _reportService.GetReportDataAsync(institutionId, filter);
            return Ok(ApiResponse<ReportResultDto>.SuccessResponse(result));
        }

        [HttpGet("items")]
        public async Task<IActionResult> GetItemWiseReport([FromQuery] ReportFilterDto filter)
        {
            var institutionId = User.ResolveInstitutionId();
            filter.ReportType = "item_wise";
            var result = await _reportService.GetReportDataAsync(institutionId, filter);
            return Ok(ApiResponse<ReportResultDto>.SuccessResponse(result));
        }

        [HttpGet("export")]
        public async Task<IActionResult> ExportReport([FromQuery] ReportFilterDto filter)
        {
            var institutionId = User.ResolveInstitutionId();
            var result = await _reportService.GetReportDataAsync(institutionId, filter);

            if (filter.Format?.ToLower() == "csv")
            {
                var csv = new System.Text.StringBuilder();
                csv.AppendLine(string.Join(",", result.Columns.Select(c => $"\"{c.Header}\"")));

                foreach (var row in result.Rows)
                {
                    var values = result.Columns.Select(c =>
                    {
                        var val = row.GetValueOrDefault(c.Key)?.ToString() ?? "";
                        return $"\"{val.Replace("\"", "\"\"")}\"";
                    });
                    csv.AppendLine(string.Join(",", values));
                }

                var bytes = System.Text.Encoding.UTF8.GetBytes(csv.ToString());
                return File(bytes, "text/csv", $"{filter.ReportType}_{DateTime.UtcNow:yyyyMMdd}.csv");
            }

            return Ok(ApiResponse<ReportResultDto>.SuccessResponse(result));
        }
    }
}

