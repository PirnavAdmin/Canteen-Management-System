using CanteenManagement.API.DTOs.Orders;

namespace CanteenManagement.API.Services.Interfaces.Orders
{
    public interface IOrderService
    {
        Task<IEnumerable<OrderDto>> GetAllAsync(int campusId, int? outletId = null, string? status = null, string? searchTerm = null, string? dateFilter = null);
        Task<OrderDto?> GetByIdAsync(string id, int campusId);
        Task<OrderDto> CreateAsync(CreateOrderDto dto, int campusId, string performedBy);
        Task<OrderDto> UpdateStatusAsync(string id, UpdateOrderStatusDto dto, int campusId, string performedBy);
        Task<OrderDto> CancelOrderAsync(string id, CancelOrderDto dto, int campusId, string performedBy);
        Task<OrderDto> ProcessRefundAsync(string id, int campusId, string performedBy);
    }
}

