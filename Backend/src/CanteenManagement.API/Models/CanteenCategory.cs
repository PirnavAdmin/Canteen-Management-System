namespace CanteenManagement.API.Models
{
    public class CanteenCategory
    {
        public int CategoryId { get; set; }
        public int InstitutionId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
