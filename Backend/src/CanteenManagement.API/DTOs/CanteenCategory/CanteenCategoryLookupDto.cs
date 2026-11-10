namespace CanteenManagement.API.DTOs.CanteenCategory
{
    public class CanteenCategoryLookupDto
    {
        public int CategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
    }
}
