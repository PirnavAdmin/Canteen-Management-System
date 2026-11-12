using CanteenManagement.API.Models.Feedback;

namespace CanteenManagement.API.Repositories.Interfaces.Feedback
{
    public interface IFeedbackRepository
    {
        Task<IEnumerable<FeedbackTicket>> GetAllAsync(int institutionId, int? outletId = null, string? status = null, int? rating = null);
        Task<FeedbackTicket?> GetByIdAsync(string id, int institutionId);
        Task<FeedbackTicket> CreateAsync(FeedbackTicket ticket);
        Task<FeedbackTicket> UpdateAsync(FeedbackTicket ticket);
    }
}
