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

        public async Task<IEnumerable<CanteenOutlet>> GetAllAsync(int institutionId, string? status = null, string? search = null)
        {
            var query = _context.CanteenOutlets
                .Include(o => o.Settings)
                .Where(o => o.InstitutionId == institutionId)
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

            return await query.OrderBy(o => o.Code).ToListAsync();
        }

        public async Task<CanteenOutlet?> GetByIdAsync(int outletId, int institutionId)
        {
            return await _context.CanteenOutlets
                .Include(o => o.Settings)
                .FirstOrDefaultAsync(o => o.OutletId == outletId && o.InstitutionId == institutionId);
        }

        public async Task<CanteenOutlet?> GetByCodeAsync(string code, int institutionId)
        {
            var upperCode = code.Trim().ToUpper();
            return await _context.CanteenOutlets
                .Include(o => o.Settings)
                .FirstOrDefaultAsync(o => o.InstitutionId == institutionId && o.Code.ToUpper() == upperCode);
        }

        public async Task<bool> ExistsByCodeAsync(string code, int institutionId, int? excludeOutletId = null)
        {
            var upperCode = code.Trim().ToUpper();
            return await _context.CanteenOutlets
                .AnyAsync(o => o.InstitutionId == institutionId &&
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

        public async Task<bool> DeleteAsync(int outletId, int institutionId)
        {
            var outlet = await _context.CanteenOutlets.FirstOrDefaultAsync(o => o.OutletId == outletId && o.InstitutionId == institutionId);
            if (outlet == null) return false;

            _context.CanteenOutlets.Remove(outlet);
            var affected = await _context.SaveChangesAsync();
            return affected > 0;
        }

        /// <summary>
        /// Dual ORM demonstration: Using Dapper for high-performance aggregate stats query
        /// </summary>
        public async Task<CanteenOutletStatsDto> GetStatsAsync(int institutionId)
        {
            try
            {
                using var connection = _dbConnectionFactory.CreateConnection();
                const string sql = @"
                    SELECT 
                        COUNT(*) AS TotalOutlets,
                        SUM(CASE WHEN Status = 'Active' THEN 1 ELSE 0 END) AS ActiveOutlets,
                        SUM(CASE WHEN Status != 'Active' THEN 1 ELSE 0 END) AS InactiveOutlets,
                        0 AS TotalMenuItems,
                        0 AS OrdersToday,
                        0.00 AS RevenueToday
                    FROM CanteenOutlets
                    WHERE InstitutionId = @InstitutionId;";

                var stats = await connection.QueryFirstOrDefaultAsync<CanteenOutletStatsDto>(sql, new { InstitutionId = institutionId });
                return stats ?? new CanteenOutletStatsDto();
            }
            catch
            {
                // Resilient fallback to EF Core query if direct connection has local driver constraints
                var total = await _context.CanteenOutlets.CountAsync(o => o.InstitutionId == institutionId);
                var active = await _context.CanteenOutlets.CountAsync(o => o.InstitutionId == institutionId && o.Status == "Active");
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

