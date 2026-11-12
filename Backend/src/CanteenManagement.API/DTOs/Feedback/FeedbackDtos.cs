using System.ComponentModel.DataAnnotations;

namespace CanteenManagement.API.DTOs.Feedback
{
    public class FeedbackDto
    {
        public string Id { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string? CustomerRole { get; set; }
        public string? CustomerEmail { get; set; }
        public int OutletId { get; set; }
        public string OutletName { get; set; } = string.Empty;
        public string? OrderId { get; set; }
        public string? OrderToken { get; set; }
        public int Rating { get; set; }
        public string ComplaintCategory { get; set; } = string.Empty;
        public string Comments { get; set; } = string.Empty;
        public string Status { get; set; } = "New";
        public DateTime CreatedAt { get; set; }
        public string? ResolutionNotes { get; set; }
        public string? ResolvedBy { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public List<FeedbackHistoryDto> History { get; set; } = new();
    }

    public class FeedbackHistoryDto
    {
        public string Status { get; set; } = string.Empty;
        public string Timestamp { get; set; } = string.Empty;
        public string? Note { get; set; }
    }

    public class CreateFeedbackDto
    {
        [Required]
        public int OutletId { get; set; }
        [Required]
        public string CustomerName { get; set; } = string.Empty;
        public string? CustomerRole { get; set; }
        public string? CustomerEmail { get; set; }
        public string? OrderId { get; set; }
        public string? OrderToken { get; set; }
        [Range(1, 5)]
        public int Rating { get; set; } = 5;
        [Required]
        public string ComplaintCategory { get; set; } = "Food Quality & Taste";
        [Required]
        public string Comments { get; set; } = string.Empty;
    }

    public class ResolveFeedbackDto
    {
        [Required]
        [RegularExpression("^(New|Under Review|Resolved|Dismissed)$")]
        public string Status { get; set; } = "Resolved";

        [Required(ErrorMessage = "Resolution notes are required.")]
        public string Notes { get; set; } = string.Empty;

        public string? ResolvedBy { get; set; }
    }
}
