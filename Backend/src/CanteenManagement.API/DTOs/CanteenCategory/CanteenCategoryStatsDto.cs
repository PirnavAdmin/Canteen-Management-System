namespace CanteenManagement.API.DTOs.CanteenCategory
{
    public class CanteenCategoryStatsDto
    {
        public int TotalCategories { get; set; }
        public int ActiveCategories { get; set; }
        public int LinkedFoodItems { get; set; }
        public int DisplayOrderDepth { get; set; }
    }
}
