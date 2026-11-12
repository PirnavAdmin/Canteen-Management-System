using CanteenManagement.API.Data;
using CanteenManagement.API.Models.Common;
using CanteenManagement.API.Services.Interfaces.Common;

namespace CanteenManagement.API.Services.Implementations.Common
{
    public class AuditLoggingService : IAuditLoggingService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<AuditLoggingService> _logger;

        public AuditLoggingService(AppDbContext context, ILogger<AuditLoggingService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task LogAsync(
            string action,
            string entityName,
            string? entityId = null,
            string? details = null,
            int? userId = null,
            string? userName = null,
            int institutionId = 1,
            string? ipAddress = null)
        {
            try
            {
                var log = new AuditLog
                {
                    InstitutionId = institutionId,
                    UserId = userId,
                    UserName = string.IsNullOrWhiteSpace(userName) ? "System" : userName,
                    Action = action,
                    EntityName = entityName,
                    EntityId = entityId,
                    Details = details,
                    IpAddress = ipAddress,
                    Timestamp = DateTime.UtcNow
                };

                _context.AuditLogs.Add(log);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to persist audit log for Action: {Action}, Entity: {EntityName}", action, entityName);
            }
        }
    }
}

