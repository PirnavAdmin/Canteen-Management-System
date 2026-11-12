using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using CanteenManagement.API.Models.Outlets;

namespace CanteenManagement.API.Models.Feedback
{
    [Table("FeedbackTickets")]
    public class FeedbackTicket
    {
        [Key]
        [MaxLength(50)]
        public string TicketId { get; set; } = string.Empty; // e.g. FB-2026-041

        [Required]
        public int InstitutionId { get; set; } = 1;

        [Required]
        public int OutletId { get; set; }

        [Required]
        [MaxLength(100)]
        public string CustomerName { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? CustomerRole { get; set; }

        [MaxLength(100)]
        public string? CustomerEmail { get; set; }

        [MaxLength(50)]
        public string? OrderId { get; set; }

        [MaxLength(20)]
        public string? OrderToken { get; set; }

        [Range(1, 5)]
        public int Rating { get; set; } = 5;

        [Required]
        [MaxLength(100)]
        public string ComplaintCategory { get; set; } = "Food Quality & Taste";

        [Required]
        [MaxLength(2000)]
        public string Comments { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "New"; // New, Under Review, Resolved, Dismissed

        public string? ResolutionNotes { get; set; }

        [MaxLength(100)]
        public string? ResolvedBy { get; set; }

        public DateTime? ResolvedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("OutletId")]
        public virtual CanteenOutlet? Outlet { get; set; }

        public virtual ICollection<FeedbackHistory> History { get; set; } = new List<FeedbackHistory>();
    }

    [Table("FeedbackHistories")]
    public class FeedbackHistory
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int HistoryId { get; set; }

        [Required]
        [MaxLength(50)]
        public string TicketId { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Note { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [ForeignKey("TicketId")]
        public virtual FeedbackTicket? Ticket { get; set; }
    }
}
