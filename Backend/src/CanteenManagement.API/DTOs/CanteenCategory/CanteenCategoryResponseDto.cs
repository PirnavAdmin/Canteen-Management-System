namespace CanteenManagement.API.DTOs.CanteenCategory
{
    public class CanteenCategoryResponseDto
    {
        public int CategoryId { get; set; }
        public int InstitutionId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
