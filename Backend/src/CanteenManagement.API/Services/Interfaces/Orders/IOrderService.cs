using CanteenManagement.API.DTOs.Orders;

namespace CanteenManagement.API.Services.Interfaces.Orders
{
    public interface IOrderService
    {
        Task<IEnumerable<OrderDto>> GetAllAsync(int institutionId, int? outletId = null, string? status = null, string? searchTerm = null);
        Task<OrderDto?> GetByIdAsync(string id, int institutionId);
        Task<OrderDto> CreateAsync(CreateOrderDto dto, int institutionId, string performedBy);
        Task<OrderDto> UpdateStatusAsync(string id, UpdateOrderStatusDto dto, int institutionId, string performedBy);
        Task<OrderDto> CancelOrderAsync(string id, CancelOrderDto dto, int institutionId, string performedBy);
        Task<OrderDto> ProcessRefundAsync(string id, int institutionId, string performedBy);
    }
}
