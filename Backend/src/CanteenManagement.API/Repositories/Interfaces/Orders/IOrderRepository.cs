using CanteenManagement.API.Models.Orders;

namespace CanteenManagement.API.Repositories.Interfaces.Orders
{
    public interface IOrderRepository
    {
        Task<IEnumerable<Order>> GetAllAsync(int campusId, int? outletId = null, string? status = null, string? searchTerm = null);
        Task<Order?> GetByIdAsync(string id, int campusId);
        Task<string> GenerateNextDailyTokenAsync(int outletId, DateTime date);
        Task<Order> CreateAsync(Order order);
        Task<Order> UpdateAsync(Order order);
        Task<bool> UpdatePaymentTransactionAsync(PaymentTransaction payment);
        Task<bool> DeleteAsync(string id, int campusId);
    }
}
