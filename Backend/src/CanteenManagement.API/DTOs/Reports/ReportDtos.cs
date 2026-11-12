namespace CanteenManagement.API.DTOs.Reports
{
    public class ReportFilterDto
    {
        public string ReportType { get; set; } = "sales_summary";
        public string? DateRange { get; set; }
        public int? OutletId { get; set; }
        public string? Format { get; set; } = "json"; // json, csv
    }

    public class ReportResultDto
    {
        public string ReportType { get; set; } = string.Empty;
        public Dictionary<string, object> SummaryMetrics { get; set; } = new();
        public List<Dictionary<string, object>> Rows { get; set; } = new();
        public List<ReportColumnDto> Columns { get; set; } = new();
    }

    public class ReportColumnDto
    {
        public string Key { get; set; } = string.Empty;
        public string Header { get; set; } = string.Empty;
    }
}
