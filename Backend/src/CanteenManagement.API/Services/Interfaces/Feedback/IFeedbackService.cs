using CanteenManagement.API.DTOs.Feedback;

namespace CanteenManagement.API.Services.Interfaces.Feedback
{
    public interface IFeedbackService
    {
        Task<IEnumerable<FeedbackDto>> GetAllAsync(int campusId, int? outletId = null, string? status = null, int? rating = null);
        Task<FeedbackDto?> GetByIdAsync(string id, int campusId);
        Task<FeedbackDto> CreateAsync(CreateFeedbackDto dto, int campusId, string performedBy);
        Task<FeedbackDto> ResolveTicketAsync(string id, ResolveFeedbackDto dto, int campusId, string performedBy);
    }
}

