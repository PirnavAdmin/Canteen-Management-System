using System.ComponentModel.DataAnnotations;

namespace CanteenManagement.API.DTOs.Slots
{
    public class SlotDto
    {
        public int Id { get; set; }
        public int OutletId { get; set; }
        public string OutletName { get; set; } = string.Empty;
        public string Session { get; set; } = "Lunch";
        public string Date { get; set; } = string.Empty; // YYYY-MM-DD
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public int MaxCapacity { get; set; }
        public int BookedOrders { get; set; }
        public int RemainingCapacity { get; set; }
        public string Status { get; set; } = "Open";
        public DateTime CreatedAt { get; set; }
    }

    public class CreateSlotDto
    {
        [Required(ErrorMessage = "Outlet ID is required.")]
        public int OutletId { get; set; }

        [Required(ErrorMessage = "Meal session is required.")]
        [RegularExpression("^(Breakfast|Lunch|Evening Snacks|Dinner)$", ErrorMessage = "Session must be Breakfast, Lunch, Evening Snacks, or Dinner.")]
        public string Session { get; set; } = "Lunch";

        [Required(ErrorMessage = "Date is required.")]
        public DateTime Date { get; set; }

        [Required(ErrorMessage = "Start time is required.")]
        public string StartTime { get; set; } = string.Empty;

        [Required(ErrorMessage = "End time is required.")]
        public string EndTime { get; set; } = string.Empty;

        [Range(1, 10000, ErrorMessage = "Max capacity must be at least 1.")]
        public int MaxCapacity { get; set; } = 50;
    }

    public class AdjustCapacityDto
    {
        [Required]
        [Range(1, 10000, ErrorMessage = "Capacity must be a positive number.")]
        public int MaxCapacity { get; set; }
    }
}

