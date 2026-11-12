using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using CanteenManagement.API.Models.Categories;
using CanteenManagement.API.Models.Outlets;

namespace CanteenManagement.API.Models.Menu
{
    [Table("MenuItems")]
    public class MenuItem
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int MenuItemId { get; set; }

        [Required]
        public int InstitutionId { get; set; } = 1;

        [Required]
        public int OutletId { get; set; }

        [Required]
        public int CategoryId { get; set; }

        [Required]
        [MaxLength(30)]
        public string Code { get; set; } = string.Empty; // e.g. PBM-01

        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        [Required]
        [MaxLength(20)]
        public string FoodType { get; set; } = "Veg"; // Veg, Non-veg, Egg, Vegan

        [Column(TypeName = "decimal(10,2)")]
        public decimal Price { get; set; }

        public int DailyCapacity { get; set; } = 100;

        public int RemainingCapacity { get; set; } = 100;

        [Required]
        [MaxLength(20)]
        public string Availability { get; set; } = "Available"; // Available, Unavailable, SoldOut

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Active"; // Active, Inactive

        [Required]
        [MaxLength(20)]
        public string PublicationStatus { get; set; } = "Published"; // Published, Draft

        [MaxLength(50)]
        public string? ServingSize { get; set; }

        [MaxLength(50)]
        public string? Calories { get; set; }

        [MaxLength(500)]
        public string? ImageUrl { get; set; }

        public string? AllergensJson { get; set; } // JSON array of string e.g. ["Dairy", "Nuts"]

        public string? WorkingDaysJson { get; set; } // JSON array of string

        [MaxLength(10)]
        public string? StartTime { get; set; } // e.g. 11:30

        [MaxLength(10)]
        public string? EndTime { get; set; } // e.g. 15:30

        public int HistoricalOrderCount { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation Properties
        [ForeignKey("OutletId")]
        public virtual CanteenOutlet? Outlet { get; set; }

        [ForeignKey("CategoryId")]
        public virtual Category? Category { get; set; }

        public virtual ICollection<MenuItemVariant> Variants { get; set; } = new List<MenuItemVariant>();
        public virtual ICollection<MenuItemAddon> AddOns { get; set; } = new List<MenuItemAddon>();
    }

    [Table("MenuItemVariants")]
    public class MenuItemVariant
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int VariantId { get; set; }

        [Required]
        public int MenuItemId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Column(TypeName = "decimal(10,2)")]
        public decimal Price { get; set; }

        [ForeignKey("MenuItemId")]
        public virtual MenuItem? MenuItem { get; set; }
    }

    [Table("MenuItemAddons")]
    public class MenuItemAddon
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int AddonId { get; set; }

        [Required]
        public int MenuItemId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Column(TypeName = "decimal(10,2)")]
        public decimal Price { get; set; }

        [ForeignKey("MenuItemId")]
        public virtual MenuItem? MenuItem { get; set; }
    }
}
