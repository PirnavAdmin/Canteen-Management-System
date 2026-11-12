using System.ComponentModel.DataAnnotations;

namespace CanteenManagement.API.DTOs.Menu
{
    public class MenuItemDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int CategoryId { get; set; }
        public string Category { get; set; } = string.Empty;
        public int OutletId { get; set; }
        public string OutletName { get; set; } = string.Empty;
        public string FoodType { get; set; } = "Veg";
        public decimal Price { get; set; }
        public int DailyCapacity { get; set; }
        public int RemainingCapacity { get; set; }
        public string Availability { get; set; } = "Available";
        public string Status { get; set; } = "Active";
        public string PublicationStatus { get; set; } = "Published";
        public string? ServingSize { get; set; }
        public string? Calories { get; set; }
        public string? ImageUrl { get; set; }
        public List<string> Allergens { get; set; } = new();
        public List<string> WorkingDays { get; set; } = new();
        public string? StartTime { get; set; }
        public string? EndTime { get; set; }
        public int HistoricalOrderCount { get; set; }
        public List<MenuItemVariantDto> Variants { get; set; } = new();
        public List<MenuItemAddonDto> AddOns { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class MenuItemVariantDto
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
        [Range(0, 99999)]
        public decimal Price { get; set; }
    }

    public class MenuItemAddonDto
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
        [Range(0, 99999)]
        public decimal Price { get; set; }
    }

    public class CreateMenuItemDto
    {
        [Required(ErrorMessage = "Outlet ID is required.")]
        public int OutletId { get; set; }

        [Required(ErrorMessage = "Category ID is required.")]
        public int CategoryId { get; set; }

        [Required(ErrorMessage = "Menu item code is required.")]
        [StringLength(30, ErrorMessage = "Code cannot exceed 30 characters.")]
        public string Code { get; set; } = string.Empty;

        [Required(ErrorMessage = "Menu item name is required.")]
        [StringLength(150, ErrorMessage = "Name cannot exceed 150 characters.")]
        public string Name { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Description { get; set; }

        [Required]
        [RegularExpression("^(Veg|Non-veg|Egg|Vegan)$", ErrorMessage = "FoodType must be 'Veg', 'Non-veg', 'Egg', or 'Vegan'.")]
        public string FoodType { get; set; } = "Veg";

        [Required]
        [Range(0.01, 99999.00, ErrorMessage = "Price must be greater than 0.")]
        public decimal Price { get; set; }

        [Range(1, 99999, ErrorMessage = "Daily capacity must be at least 1.")]
        public int DailyCapacity { get; set; } = 100;

        public string Availability { get; set; } = "Available";
        public string Status { get; set; } = "Active";
        public string PublicationStatus { get; set; } = "Published";

        public string? ServingSize { get; set; }
        public string? Calories { get; set; }
        public string? ImageUrl { get; set; }

        public List<string>? Allergens { get; set; }
        public List<string>? WorkingDays { get; set; }

        public string? StartTime { get; set; }
        public string? EndTime { get; set; }

        public List<MenuItemVariantDto>? Variants { get; set; }
        public List<MenuItemAddonDto>? AddOns { get; set; }
    }

    public class UpdateMenuItemDto : CreateMenuItemDto
    {
    }

    public class MenuItemFilterDto
    {
        public int? OutletId { get; set; }
        public int? CategoryId { get; set; }
        public string? FoodType { get; set; }
        public string? Status { get; set; }
        public string? SearchTerm { get; set; }
    }
}

