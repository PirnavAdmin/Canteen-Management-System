using System.Data;
using CanteenManagement.API.Data;
using CanteenManagement.API.DTOs.Outlets;
using CanteenManagement.API.Models.Outlets;
using CanteenManagement.API.Repositories.Interfaces.Outlets;
using Dapper;
using Microsoft.EntityFrameworkCore;

namespace CanteenManagement.API.Repositories.Implementations.Outlets
{
    public class CanteenOutletRepository : ICanteenOutletRepository
    {
        private readonly AppDbContext _context;
        private readonly IDbConnectionFactory _dbConnectionFactory;

        public CanteenOutletRepository(AppDbContext context, IDbConnectionFactory dbConnectionFactory)
        {
            _context = context;
            _dbConnectionFactory = dbConnectionFactory;
        }

        public async Task<IEnumerable<CanteenOutlet>> GetAllAsync(int campusId, string? status = null, string? search = null)
        {
            var query = _context.CanteenOutlets
                .Include(o => o.Settings)
                .Where(o => o.CampusId == campusId)
                .AsNoTracking();

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(o => o.Status.ToLower() == status.Trim().ToLower());
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.Trim().ToLower();
                query = query.Where(o => o.Name.ToLower().Contains(searchLower) ||
                                         o.Code.ToLower().Contains(searchLower) ||
                                         (o.Location != null && o.Location.ToLower().Contains(searchLower)));
            }

            return await query.OrderByDescending(o => o.OutletId).ToListAsync();
        }

        public async Task<CanteenOutlet?> GetByIdAsync(int outletId, int campusId)
        {
            return await _context.CanteenOutlets
                .Include(o => o.Settings)
                .FirstOrDefaultAsync(o => o.OutletId == outletId && o.CampusId == campusId);
        }

        public async Task<CanteenOutlet?> GetByCodeAsync(string code, int campusId)
        {
            var upperCode = code.Trim().ToUpper();
            return await _context.CanteenOutlets
                .Include(o => o.Settings)
                .FirstOrDefaultAsync(o => o.CampusId == campusId && o.Code.ToUpper() == upperCode);
        }

        public async Task<bool> ExistsByCodeAsync(string code, int campusId, int? excludeOutletId = null)
        {
            var upperCode = code.Trim().ToUpper();
            return await _context.CanteenOutlets
                .AnyAsync(o => o.CampusId == campusId &&
                               o.Code.ToUpper() == upperCode &&
                               (excludeOutletId == null || o.OutletId != excludeOutletId));
        }

        public async Task<CanteenOutlet> CreateAsync(CanteenOutlet outlet)
        {
            // Default outlet settings if not set
            if (outlet.Settings == null)
            {
                outlet.Settings = new CanteenOutletSetting
                {
                    AutoExpireUnpaidMinutes = 10,
                    PickupHoldMinutes = 30,
                    CancellationPolicy = "UntilAccepted",
                    AllowUpi = true,
                    AllowCards = true,
                    AllowWallet = true,
                    AllowCash = true,
                    UpdatedAt = DateTime.UtcNow
                };
            }

            _context.CanteenOutlets.Add(outlet);
            await _context.SaveChangesAsync();
            return outlet;
        }

        public async Task<bool> UpdateAsync(CanteenOutlet outlet)
        {
            _context.CanteenOutlets.Update(outlet);
            var affected = await _context.SaveChangesAsync();
            return affected > 0;
        }

        public async Task<bool> DeleteAsync(int outletId, int campusId)
        {
            var outlet = await _context.CanteenOutlets.FirstOrDefaultAsync(o => o.OutletId == outletId && o.CampusId == campusId);
            if (outlet == null) return false;

            _context.CanteenOutlets.Remove(outlet);
            var affected = await _context.SaveChangesAsync();
            return affected > 0;
        }

        /// <summary>
        /// Dual ORM demonstration: Using Dapper for high-performance aggregate stats query
        /// </summary>
        public async Task<CanteenOutletStatsDto> GetStatsAsync(int campusId)
        {
            try
            {
                using var connection = _dbConnectionFactory.CreateConnection();
                var stats = await connection.QueryFirstOrDefaultAsync<CanteenOutletStatsDto>(
                    "sp_GetCanteenOutletStats",
                    new { p_CampusId = campusId },
                    commandType: CommandType.StoredProcedure);
                return stats ?? new CanteenOutletStatsDto();
            }
            catch
            {
                // Resilient fallback to EF Core query if direct connection has local driver constraints
                var total = await _context.CanteenOutlets.CountAsync(o => o.CampusId == campusId);
                var active = await _context.CanteenOutlets.CountAsync(o => o.CampusId == campusId && o.Status == "Active");
                return new CanteenOutletStatsDto
                {
                    TotalOutlets = total,
                    ActiveOutlets = active,
                    InactiveOutlets = total - active
                };
            }
        }

        public async Task<CanteenOutletSetting?> GetSettingsAsync(int outletId)
        {
            return await _context.CanteenOutletSettings
                .FirstOrDefaultAsync(s => s.OutletId == outletId);
        }

        public async Task<bool> UpdateSettingsAsync(CanteenOutletSetting settings)
        {
            settings.UpdatedAt = DateTime.UtcNow;
            _context.CanteenOutletSettings.Update(settings);
            var affected = await _context.SaveChangesAsync();
            return affected > 0;
        }
    }
}

