using CanteenManagement.API.DTOs.Feedback;

namespace CanteenManagement.API.Services.Interfaces.Feedback
{
    public interface IFeedbackService
    {
        Task<IEnumerable<FeedbackDto>> GetAllAsync(int institutionId, int? outletId = null, string? status = null, int? rating = null);
        Task<FeedbackDto?> GetByIdAsync(string id, int institutionId);
        Task<FeedbackDto> CreateAsync(CreateFeedbackDto dto, int institutionId, string performedBy);
        Task<FeedbackDto> ResolveTicketAsync(string id, ResolveFeedbackDto dto, int institutionId, string performedBy);
    }
}

