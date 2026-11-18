using CanteenManagement.API.Data;
using CanteenManagement.API.Models.Auth;
using CanteenManagement.API.Repositories.Interfaces.Auth;
using Microsoft.EntityFrameworkCore;

namespace CanteenManagement.API.Repositories.Implementations.Auth
{
    public class AuthRepository : IAuthRepository
    {
        private readonly AppDbContext _context;

        public AuthRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<User?> GetByUsernameOrEmailAsync(string usernameOrEmail, int campusId)
        {
            var lowerQuery = usernameOrEmail.Trim().ToLower();
            return await _context.Users
                .FirstOrDefaultAsync(u => u.CampusId == campusId &&
                                         (u.Username.ToLower() == lowerQuery || u.Email.ToLower() == lowerQuery));
        }

        public async Task<User?> GetByIdAsync(int userId)
        {
            return await _context.Users.FindAsync(userId);
        }

        public async Task<bool> ExistsByUsernameAsync(string username, int campusId)
        {
            var lower = username.Trim().ToLower();
            return await _context.Users
                .AnyAsync(u => u.CampusId == campusId && u.Username.ToLower() == lower);
        }

        public async Task<bool> ExistsByEmailAsync(string email, int campusId)
        {
            var lower = email.Trim().ToLower();
            return await _context.Users
                .AnyAsync(u => u.CampusId == campusId && u.Email.ToLower() == lower);
        }

        public async Task<User> CreateAsync(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<bool> UpdateAsync(User user)
        {
            _context.Users.Update(user);
            var affected = await _context.SaveChangesAsync();
            return affected > 0;
        }
    }
}

