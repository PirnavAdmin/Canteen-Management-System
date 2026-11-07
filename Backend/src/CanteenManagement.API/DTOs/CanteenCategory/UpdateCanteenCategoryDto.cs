using System.ComponentModel.DataAnnotations;

namespace CanteenManagement.API.DTOs.CanteenCategory
{
    public class UpdateCanteenCategoryDto
    {
        [Required(ErrorMessage = "Category name is required.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Category name must be between 2 and 100 characters.")]
        public string Name { get; set; } = string.Empty;

        [StringLength(255, ErrorMessage = "Description cannot exceed 255 characters.")]
        public string? Description { get; set; }

        [Range(0, 9999, ErrorMessage = "DisplayOrder must be a positive integer.")]
        public int DisplayOrder { get; set; } = 0;
    }
}
