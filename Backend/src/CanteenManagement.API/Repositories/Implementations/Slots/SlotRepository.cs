using CanteenManagement.API.Data;
using CanteenManagement.API.Models.Slots;
using CanteenManagement.API.Repositories.Interfaces.Slots;
using Microsoft.EntityFrameworkCore;

namespace CanteenManagement.API.Repositories.Implementations.Slots
{
    public class SlotRepository : ISlotRepository
    {
        private readonly AppDbContext _dbContext;

        public SlotRepository(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<IEnumerable<Slot>> GetAllAsync(int institutionId, int? outletId = null, string? date = null, string? session = null)
        {
            var query = _dbContext.Slots
                .Include(s => s.Outlet)
                .Where(s => s.InstitutionId == institutionId);

            if (outletId.HasValue && outletId.Value > 0)
            {
                query = query.Where(s => s.OutletId == outletId.Value);
            }

            if (!string.IsNullOrWhiteSpace(date) && DateTime.TryParse(date, out var parsedDate))
            {
                query = query.Where(s => s.Date.Date == parsedDate.Date);
            }

            if (!string.IsNullOrWhiteSpace(session) && session != "ALL")
            {
                query = query.Where(s => s.Session == session);
            }

            return await query.OrderBy(s => s.Date).ThenBy(s => s.StartTime).AsNoTracking().ToListAsync();
        }

        public async Task<Slot?> GetByIdAsync(int id, int institutionId)
        {
            return await _dbContext.Slots
                .Include(s => s.Outlet)
                .FirstOrDefaultAsync(s => s.SlotId == id && s.InstitutionId == institutionId);
        }

        public async Task<Slot?> FindOverlappingSlotAsync(int outletId, DateTime date, string startTime, string endTime, int? excludeId = null)
        {
            var query = _dbContext.Slots
                .Where(s => s.OutletId == outletId && s.Date.Date == date.Date && s.Status != "Closed");

            if (excludeId.HasValue)
            {
                query = query.Where(s => s.SlotId != excludeId.Value);
            }

            var activeSlots = await query.ToListAsync();

            return activeSlots.FirstOrDefault(s =>
                (string.Compare(startTime, s.StartTime) >= 0 && string.Compare(startTime, s.EndTime) < 0) ||
                (string.Compare(endTime, s.StartTime) > 0 && string.Compare(endTime, s.EndTime) <= 0)
            );
        }

        public async Task<Slot> CreateAsync(Slot slot)
        {
            await _dbContext.Slots.AddAsync(slot);
            await _dbContext.SaveChangesAsync();
            return slot;
        }

        public async Task<Slot> UpdateAsync(Slot slot)
        {
            _dbContext.Slots.Update(slot);
            await _dbContext.SaveChangesAsync();
            return slot;
        }

        public async Task<bool> DeleteAsync(int id, int institutionId)
        {
            var slot = await GetByIdAsync(id, institutionId);
            if (slot == null) return false;

            _dbContext.Slots.Remove(slot);
            await _dbContext.SaveChangesAsync();
            return true;
        }
    }
}

