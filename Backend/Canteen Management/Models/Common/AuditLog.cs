using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CanteenManagement.API.Models.Common
{
    [Table("AuditLogs")]
    public class AuditLog
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long AuditLogId { get; set; }

        public int InstitutionId { get; set; } = 1;

        public int? UserId { get; set; }

        [MaxLength(100)]
        public string UserName { get; set; } = "System";

        [Required]
        [MaxLength(50)]
        public string Action { get; set; } = string.Empty; // Create, Update, Delete, Login, Payment, StatusChange

        [Required]
        [MaxLength(100)]
        public string EntityName { get; set; } = string.Empty; // User, CanteenOutlet, MenuItem, Order

        [MaxLength(100)]
        public string? EntityId { get; set; }

        [Column(TypeName = "TEXT")]
        public string? Details { get; set; }

        [MaxLength(50)]
        public string? IpAddress { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}

