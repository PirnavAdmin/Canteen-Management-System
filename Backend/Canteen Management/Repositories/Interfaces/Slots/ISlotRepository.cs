using CanteenManagement.API.Models.Slots;

namespace CanteenManagement.API.Repositories.Interfaces.Slots
{
    public interface ISlotRepository
    {
        Task<IEnumerable<Slot>> GetAllAsync(int institutionId, int? outletId = null, string? date = null, string? session = null);
        Task<Slot?> GetByIdAsync(int id, int institutionId);
        Task<Slot?> FindOverlappingSlotAsync(int outletId, DateTime date, string startTime, string endTime, int? excludeId = null);
        Task<Slot> CreateAsync(Slot slot);
        Task<Slot> UpdateAsync(Slot slot);
        Task<bool> DeleteAsync(int id, int institutionId);
    }
}

