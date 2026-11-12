using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CanteenManagement.API.Models.Settings
{
    [Table("SystemSettings")]
    public class SystemSetting
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int SettingId { get; set; }

        [Required]
        public int InstitutionId { get; set; } = 1;

        [Required]
        [MaxLength(50)]
        public string Category { get; set; } = "General"; // Outlet, Payment, OrderRules, Privacy

        [Required]
        [MaxLength(100)]
        public string SettingKey { get; set; } = string.Empty;

        [Required]
        public string SettingValueJson { get; set; } = "{}";

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    [Table("DsarRequests")]
    public class DsarRequest
    {
        [Key]
        [MaxLength(50)]
        public string RequestId { get; set; } = string.Empty; // e.g. DSAR-2026-081

        [Required]
        public int InstitutionId { get; set; } = 1;

        [Required]
        [MaxLength(100)]
        public string UserName { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? UserRole { get; set; }

        [Required]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string RequestType { get; set; } = "Data Export (Portability)"; // Data Export, Erasure / Right to be Forgotten, Rectification

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "Pending"; // Pending, In Progress, Fulfilled, Rejected

        [MaxLength(1000)]
        public string? Notes { get; set; }

        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

        public DateTime? FulfilledAt { get; set; }
    }
}
