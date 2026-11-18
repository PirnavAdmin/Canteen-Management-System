using CanteenManagement.API.Models.Auth;

namespace CanteenManagement.API.Repositories.Interfaces.Auth
{
    public interface IAuthRepository
    {
        Task<User?> GetByUsernameOrEmailAsync(string usernameOrEmail, int campusId);
        Task<User?> GetByIdAsync(int userId);
        Task<bool> ExistsByUsernameAsync(string username, int campusId);
        Task<bool> ExistsByEmailAsync(string email, int campusId);
        Task<User> CreateAsync(User user);
        Task<bool> UpdateAsync(User user);
    }
}

