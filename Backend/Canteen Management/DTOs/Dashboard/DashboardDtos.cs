namespace CanteenManagement.API.DTOs.Dashboard
{
    public class DashboardSummaryDto
    {
        public decimal TodayRevenue { get; set; }
        public decimal TotalSales { get; set; }
        public int ActiveOrders { get; set; }
        public int TotalOrders { get; set; }
        public int PendingOrders { get; set; }
        public int AcceptedOrders { get; set; }
        public int PreparingOrders { get; set; }
        public int ReadyForPickup { get; set; }
        public int CompletedOrders { get; set; }
        public int CancelledOrders { get; set; }
        public string AvgPrepTime { get; set; } = "14 mins";
        public string AveragePreparationTime { get; set; } = "14 mins";
        public int ActiveOutlets { get; set; }
        public decimal RevenueGrowthPercent { get; set; } = 12.4m;
        public string HourlyPeakTime { get; set; } = "12:30 PM - 01:45 PM";
    }

    public class HourlySalesDto
    {
        public string Hour { get; set; } = string.Empty; // e.g. "09:00", "12:00"
        public decimal Sales { get; set; }
        public int Orders { get; set; }
    }

    public class LiveOrderItemDto
    {
        public string Name { get; set; } = string.Empty;
        public int Qty { get; set; } = 1;
        public decimal Price { get; set; }
    }

    public class LiveOrderDto
    {
        public string Id { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public string Customer { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerRole { get; set; } = "Student";
        public string OutletName { get; set; } = string.Empty;
        public string OutletCode { get; set; } = string.Empty;
        public List<LiveOrderItemDto> Items { get; set; } = new();
        public int ItemCount { get; set; }
        public decimal Total { get; set; }
        public decimal TotalAmount { get; set; }
        public string Slot { get; set; } = "General";
        public string Status { get; set; } = "Preparing";
        public string ElapsedTime { get; set; } = "5m";
        public string OrderTime { get; set; } = string.Empty;
    }

    public class TopSellingItemDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string FoodType { get; set; } = "Veg";
        public int Count { get; set; }
        public int QtySold { get; set; }
        public decimal Revenue { get; set; }
    }

    public class StockAlertDto
    {
        public int Id { get; set; }
        public int ItemId { get; set; }
        public string Ingredient { get; set; } = string.Empty;
        public string IngredientName { get; set; } = string.Empty;
        public string Outlet { get; set; } = "Main Canteen";
        public decimal AvailableQuantity { get; set; }
        public string Available { get; set; } = string.Empty;
        public string Unit { get; set; } = "kg";
        public decimal ReorderLevel { get; set; }
        public string Status { get; set; } = "Low Stock";
    }

    public class OutletSalesDto
    {
        public int OutletId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string OutletName { get; set; } = string.Empty;
        public int Orders { get; set; }
        public decimal Revenue { get; set; }
        public decimal GrossSales { get; set; }
        public decimal NetSales { get; set; }
        public int Percentage { get; set; } = 100;
    }
}
