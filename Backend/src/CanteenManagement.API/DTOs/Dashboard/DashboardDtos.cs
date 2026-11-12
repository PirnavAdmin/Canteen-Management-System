namespace CanteenManagement.API.DTOs.Dashboard
{
    public class DashboardSummaryDto
    {
        public decimal TodayRevenue { get; set; }
        public int ActiveOrders { get; set; }
        public string AvgPrepTime { get; set; } = "14 mins";
        public int ActiveOutlets { get; set; }
        public decimal RevenueGrowthPercent { get; set; }
    }

    public class HourlySalesDto
    {
        public string Hour { get; set; } = string.Empty; // e.g. "09:00", "12:00"
        public decimal Sales { get; set; }
        public int Orders { get; set; }
    }

    public class LiveOrderDto
    {
        public string OrderId { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string OutletName { get; set; } = string.Empty;
        public int ItemCount { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = "Preparing";
        public string ElapsedTime { get; set; } = "5m";
    }

    public class TopSellingItemDto
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int QtySold { get; set; }
        public decimal Revenue { get; set; }
    }

    public class StockAlertDto
    {
        public int ItemId { get; set; }
        public string IngredientName { get; set; } = string.Empty;
        public decimal AvailableQuantity { get; set; }
        public string Unit { get; set; } = "kg";
        public decimal ReorderLevel { get; set; }
        public string Status { get; set; } = "Low Stock";
    }

    public class OutletSalesDto
    {
        public int OutletId { get; set; }
        public string OutletName { get; set; } = string.Empty;
        public int Orders { get; set; }
        public decimal GrossSales { get; set; }
        public decimal NetSales { get; set; }
    }
}
