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

        public async Task<User?> GetByUsernameOrEmailAsync(string usernameOrEmail, int institutionId)
        {
            var lowerQuery = usernameOrEmail.Trim().ToLower();
            return await _context.Users
                .FirstOrDefaultAsync(u => u.InstitutionId == institutionId &&
                                         (u.Username.ToLower() == lowerQuery || u.Email.ToLower() == lowerQuery));
        }

        public async Task<User?> GetByIdAsync(int userId)
        {
            return await _context.Users.FindAsync(userId);
        }

        public async Task<bool> ExistsByUsernameAsync(string username, int institutionId)
        {
            var lower = username.Trim().ToLower();
            return await _context.Users
                .AnyAsync(u => u.InstitutionId == institutionId && u.Username.ToLower() == lower);
        }

        public async Task<bool> ExistsByEmailAsync(string email, int institutionId)
        {
            var lower = email.Trim().ToLower();
            return await _context.Users
                .AnyAsync(u => u.InstitutionId == institutionId && u.Email.ToLower() == lower);
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

