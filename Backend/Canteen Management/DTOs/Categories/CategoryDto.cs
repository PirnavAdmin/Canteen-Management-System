using System.ComponentModel.DataAnnotations;

namespace CanteenManagement.API.DTOs.Categories
{
    public class CategoryDto
    {
        public int Id { get; set; }
        public int InstitutionId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int DisplayOrder { get; set; }
        public string Status { get; set; } = "Active";
        public int LinkedItemCount { get; set; }
        public int HistoricalOrderCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateCategoryDto
    {
        [Required(ErrorMessage = "Category name is required.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Category name must be between 2 and 100 characters.")]
        public string Name { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters.")]
        public string? Description { get; set; }

        [Range(1, 9999, ErrorMessage = "Display order must be a positive integer.")]
        public int DisplayOrder { get; set; } = 1;

        [RegularExpression("^(Active|Inactive)$", ErrorMessage = "Status must be 'Active' or 'Inactive'.")]
        public string Status { get; set; } = "Active";
    }

    public class UpdateCategoryDto : CreateCategoryDto
    {
    }
}

