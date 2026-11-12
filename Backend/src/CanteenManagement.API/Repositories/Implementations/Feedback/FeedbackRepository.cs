using CanteenManagement.API.Data;
using CanteenManagement.API.Models.Feedback;
using CanteenManagement.API.Repositories.Interfaces.Feedback;
using Microsoft.EntityFrameworkCore;

namespace CanteenManagement.API.Repositories.Implementations.Feedback
{
    public class FeedbackRepository : IFeedbackRepository
    {
        private readonly AppDbContext _dbContext;

        public FeedbackRepository(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<IEnumerable<FeedbackTicket>> GetAllAsync(int institutionId, int? outletId = null, string? status = null, int? rating = null)
        {
            var query = _dbContext.FeedbackTickets
                .Include(f => f.Outlet)
                .Include(f => f.History)
                .Where(f => f.InstitutionId == institutionId);

            if (outletId.HasValue && outletId.Value > 0)
            {
                query = query.Where(f => f.OutletId == outletId.Value);
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
            {
                query = query.Where(f => f.Status == status);
            }

            if (rating.HasValue && rating.Value > 0)
            {
                query = query.Where(f => f.Rating == rating.Value);
            }

            return await query.OrderByDescending(f => f.CreatedAt).AsNoTracking().ToListAsync();
        }

        public async Task<FeedbackTicket?> GetByIdAsync(string id, int institutionId)
        {
            return await _dbContext.FeedbackTickets
                .Include(f => f.Outlet)
                .Include(f => f.History)
                .FirstOrDefaultAsync(f => f.TicketId == id && f.InstitutionId == institutionId);
        }

        public async Task<FeedbackTicket> CreateAsync(FeedbackTicket ticket)
        {
            await _dbContext.FeedbackTickets.AddAsync(ticket);
            await _dbContext.SaveChangesAsync();
            return ticket;
        }

        public async Task<FeedbackTicket> UpdateAsync(FeedbackTicket ticket)
        {
            _dbContext.FeedbackTickets.Update(ticket);
            await _dbContext.SaveChangesAsync();
            return ticket;
        }
    }
}
