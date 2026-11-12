using CanteenManagement.API.DTOs.Slots;
using CanteenManagement.API.Models.Slots;
using CanteenManagement.API.Repositories.Interfaces.Slots;
using CanteenManagement.API.Services.Interfaces.Common;
using CanteenManagement.API.Services.Interfaces.Slots;

namespace CanteenManagement.API.Services.Implementations.Slots
{
    public class SlotService : ISlotService
    {
        private readonly ISlotRepository _repository;
        private readonly IAuditLoggingService _auditService;

        public SlotService(ISlotRepository repository, IAuditLoggingService auditService)
        {
            _repository = repository;
            _auditService = auditService;
        }

        public async Task<IEnumerable<SlotDto>> GetAllAsync(int institutionId, int? outletId = null, string? date = null, string? session = null)
        {
            var slots = await _repository.GetAllAsync(institutionId, outletId, date, session);
            return slots.Select(MapToDto).ToList();
        }

        public async Task<SlotDto?> GetByIdAsync(int id, int institutionId)
        {
            var slot = await _repository.GetByIdAsync(id, institutionId);
            return slot == null ? null : MapToDto(slot);
        }

        public async Task<SlotDto> CreateAsync(CreateSlotDto dto, int institutionId, string performedBy)
        {
            var conflict = await _repository.FindOverlappingSlotAsync(dto.OutletId, dto.Date, dto.StartTime, dto.EndTime);
            if (conflict != null)
            {
                throw new InvalidOperationException($"Schedule Conflict: An active slot ({conflict.StartTime} - {conflict.EndTime}) already exists for this outlet on {dto.Date:yyyy-MM-dd}.");
            }

            var slot = new Slot
            {
                InstitutionId = institutionId,
                OutletId = dto.OutletId,
                Session = dto.Session,
                Date = dto.Date.Date,
                StartTime = dto.StartTime.Trim(),
                EndTime = dto.EndTime.Trim(),
                MaxCapacity = dto.MaxCapacity,
                BookedOrders = 0,
                Status = "Open",
                CreatedAt = DateTime.UtcNow
            };

            var created = await _repository.CreateAsync(slot);

            await _auditService.LogActionAsync(
                institutionId,
                null,
                performedBy,
                "CREATE_SLOT",
                "Slot",
                created.SlotId.ToString(),
                $"Created slot {created.StartTime}-{created.EndTime} ({created.Session}) for outlet {created.OutletId} with capacity {created.MaxCapacity}."
            );

            var loaded = await _repository.GetByIdAsync(created.SlotId, institutionId);
            return MapToDto(loaded ?? created);
        }

        public async Task<SlotDto> UpdateCapacityAsync(int id, int newCapacity, int institutionId, string performedBy)
        {
            var slot = await _repository.GetByIdAsync(id, institutionId);
            if (slot == null)
            {
                throw new KeyNotFoundException($"Slot with ID {id} was not found.");
            }

            // Institutional Business Rule: Do not reduce capacity below existing confirmed bookings
            if (newCapacity < slot.BookedOrders)
            {
                throw new InvalidOperationException($"Validation Error: Cannot reduce capacity to {newCapacity} because {slot.BookedOrders} confirmed orders are already booked for this slot. Institutional policy protects existing confirmed bookings.");
            }

            slot.MaxCapacity = newCapacity;

            // Recalculate dynamic status
            var remaining = slot.MaxCapacity - slot.BookedOrders;
            if (slot.Status != "Paused" && slot.Status != "Closed")
            {
                if (remaining <= 0) slot.Status = "Full";
                else if (remaining <= 10) slot.Status = "Fast Filling";
                else slot.Status = "Open";
            }

            var updated = await _repository.UpdateAsync(slot);

            await _auditService.LogActionAsync(
                institutionId,
                null,
                performedBy,
                "UPDATE_SLOT_CAPACITY",
                "Slot",
                updated.SlotId.ToString(),
                $"Adjusted slot capacity to {updated.MaxCapacity} (Booked: {updated.BookedOrders})."
            );

            return MapToDto(updated);
        }

        public async Task<SlotDto> ToggleStatusAsync(int id, int institutionId, string performedBy)
        {
            var slot = await _repository.GetByIdAsync(id, institutionId);
            if (slot == null)
            {
                throw new KeyNotFoundException($"Slot with ID {id} was not found.");
            }

            slot.Status = slot.Status == "Paused" ? "Open" : "Paused";
            var updated = await _repository.UpdateAsync(slot);

            await _auditService.LogActionAsync(
                institutionId,
                null,
                performedBy,
                "TOGGLE_SLOT_STATUS",
                "Slot",
                updated.SlotId.ToString(),
                $"Toggled status to '{updated.Status}' for slot {updated.SlotId}."
            );

            return MapToDto(updated);
        }

        public async Task<bool> DeleteAsync(int id, int institutionId, string performedBy)
        {
            var slot = await _repository.GetByIdAsync(id, institutionId);
            if (slot == null) return false;

            if (slot.BookedOrders > 0)
            {
                throw new InvalidOperationException($"Cannot delete slot {id} because it has {slot.BookedOrders} booked orders. Please pause or close the slot instead.");
            }

            var deleted = await _repository.DeleteAsync(id, institutionId);
            if (deleted)
            {
                await _auditService.LogActionAsync(
                    institutionId,
                    null,
                    performedBy,
                    "DELETE_SLOT",
                    "Slot",
                    id.ToString(),
                    $"Deleted slot {id}."
                );
            }

            return deleted;
        }

        private static SlotDto MapToDto(Slot s) => new()
        {
            Id = s.SlotId,
            OutletId = s.OutletId,
            OutletName = s.Outlet?.Name ?? string.Empty,
            Session = s.Session,
            Date = s.Date.ToString("yyyy-MM-dd"),
            StartTime = s.StartTime,
            EndTime = s.EndTime,
            MaxCapacity = s.MaxCapacity,
            BookedOrders = s.BookedOrders,
            RemainingCapacity = Math.Max(0, s.MaxCapacity - s.BookedOrders),
            Status = s.Status,
            CreatedAt = s.CreatedAt
        };
    }
}

