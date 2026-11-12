using CanteenManagement.API.DTOs.Slots;

namespace CanteenManagement.API.Services.Interfaces.Slots
{
    public interface ISlotService
    {
        Task<IEnumerable<SlotDto>> GetAllAsync(int institutionId, int? outletId = null, string? date = null, string? session = null);
        Task<SlotDto?> GetByIdAsync(int id, int institutionId);
        Task<SlotDto> CreateAsync(CreateSlotDto dto, int institutionId, string performedBy);
        Task<SlotDto> UpdateCapacityAsync(int id, int newCapacity, int institutionId, string performedBy);
        Task<SlotDto> ToggleStatusAsync(int id, int institutionId, string performedBy);
        Task<bool> DeleteAsync(int id, int institutionId, string performedBy);
    }
}
