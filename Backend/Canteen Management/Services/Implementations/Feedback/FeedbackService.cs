using CanteenManagement.API.DTOs.Feedback;
using CanteenManagement.API.Models.Feedback;
using CanteenManagement.API.Repositories.Interfaces.Feedback;
using CanteenManagement.API.Services.Interfaces.Common;
using CanteenManagement.API.Services.Interfaces.Feedback;

namespace CanteenManagement.API.Services.Implementations.Feedback
{
    public class FeedbackService : IFeedbackService
    {
        private readonly IFeedbackRepository _repository;
        private readonly IAuditLoggingService _auditService;

        public FeedbackService(IFeedbackRepository repository, IAuditLoggingService auditService)
        {
            _repository = repository;
            _auditService = auditService;
        }

        public async Task<IEnumerable<FeedbackDto>> GetAllAsync(int institutionId, int? outletId = null, string? status = null, int? rating = null)
        {
            var tickets = await _repository.GetAllAsync(institutionId, outletId, status, rating);
            return tickets.Select(MapToDto).ToList();
        }

        public async Task<FeedbackDto?> GetByIdAsync(string id, int institutionId)
        {
            var ticket = await _repository.GetByIdAsync(id, institutionId);
            return ticket == null ? null : MapToDto(ticket);
        }

        public async Task<FeedbackDto> CreateAsync(CreateFeedbackDto dto, int institutionId, string performedBy)
        {
            var ticketId = $"FB-{DateTime.UtcNow.Year}-{Random.Shared.Next(100, 999)}";
            var now = DateTime.UtcNow;

            var ticket = new FeedbackTicket
            {
                TicketId = ticketId,
                InstitutionId = institutionId,
                OutletId = dto.OutletId,
                CustomerName = dto.CustomerName.Trim(),
                CustomerRole = dto.CustomerRole,
                CustomerEmail = dto.CustomerEmail,
                OrderId = dto.OrderId,
                OrderToken = dto.OrderToken,
                Rating = dto.Rating,
                ComplaintCategory = dto.ComplaintCategory,
                Comments = dto.Comments.Trim(),
                Status = "New",
                CreatedAt = now,
                History = new List<FeedbackHistory>
                {
                    new()
                    {
                        TicketId = ticketId,
                        Status = "New",
                        Note = "Grievance ticket created",
                        Timestamp = now
                    }
                }
            };

            var created = await _repository.CreateAsync(ticket);

            await _auditService.LogActionAsync(
                institutionId,
                null,
                performedBy,
                "CREATE_FEEDBACK",
                "FeedbackTicket",
                created.TicketId,
                $"Feedback ticket {created.TicketId} logged for {created.ComplaintCategory} (Rating: {created.Rating})."
            );

            return MapToDto(created);
        }

        public async Task<FeedbackDto> ResolveTicketAsync(string id, ResolveFeedbackDto dto, int institutionId, string performedBy)
        {
            var ticket = await _repository.GetByIdAsync(id, institutionId);
            if (ticket == null)
            {
                throw new KeyNotFoundException($"Feedback ticket with ID {id} was not found.");
            }

            var now = DateTime.UtcNow;
            ticket.Status = dto.Status;
            ticket.ResolutionNotes = dto.Notes;
            ticket.ResolvedBy = dto.ResolvedBy ?? performedBy;
            ticket.ResolvedAt = now;

            ticket.History.Add(new FeedbackHistory
            {
                TicketId = ticket.TicketId,
                Status = dto.Status,
                Note = dto.Notes,
                Timestamp = now
            });

            var updated = await _repository.UpdateAsync(ticket);

            await _auditService.LogActionAsync(
                institutionId,
                null,
                performedBy,
                "RESOLVE_FEEDBACK",
                "FeedbackTicket",
                updated.TicketId,
                $"Feedback ticket {updated.TicketId} resolved with status {dto.Status}."
            );

            return MapToDto(updated);
        }

        private static FeedbackDto MapToDto(FeedbackTicket f) => new()
        {
            Id = f.TicketId,
            CustomerName = f.CustomerName,
            CustomerRole = f.CustomerRole,
            CustomerEmail = f.CustomerEmail,
            OutletId = f.OutletId,
            OutletName = f.Outlet?.Name ?? string.Empty,
            OrderId = f.OrderId,
            OrderToken = f.OrderToken,
            Rating = f.Rating,
            ComplaintCategory = f.ComplaintCategory,
            Comments = f.Comments,
            Status = f.Status,
            CreatedAt = f.CreatedAt,
            ResolutionNotes = f.ResolutionNotes,
            ResolvedBy = f.ResolvedBy,
            ResolvedAt = f.ResolvedAt,
            History = f.History.Select(h => new FeedbackHistoryDto
            {
                Status = h.Status,
                Timestamp = h.Timestamp.ToString("hh:mm tt"),
                Note = h.Note
            }).ToList()
        };
    }
}

