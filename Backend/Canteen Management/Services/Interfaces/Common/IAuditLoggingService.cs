namespace CanteenManagement.API.Services.Interfaces.Common
{
    public interface IAuditLoggingService
    {
        Task LogAsync(string action, string entityName, string? entityId = null, string? details = null, int? userId = null, string? userName = null, int institutionId = 1, string? ipAddress = null);
        Task LogActionAsync(int institutionId, int? userId, string userName, string action, string entityName, string? entityId = null, string? details = null, string? ipAddress = null);
    }
}
