using System.Data;
using CanteenManagement.API.Data;
using CanteenManagement.API.DTOs.Menu;
using CanteenManagement.API.Models.Categories;
using CanteenManagement.API.Models.Menu;
using CanteenManagement.API.Models.Outlets;
using CanteenManagement.API.Repositories.Interfaces.Menu;
using Dapper;
using Microsoft.EntityFrameworkCore;

namespace CanteenManagement.API.Repositories.Implementations.Menu
{
    public class MenuRepository : IMenuRepository
    {
        private readonly AppDbContext _dbContext;
        private readonly IDbConnectionFactory _connectionFactory;

        public MenuRepository(AppDbContext dbContext, IDbConnectionFactory connectionFactory)
        {
            _dbContext = dbContext;
            _connectionFactory = connectionFactory;
        }

        public async Task<IEnumerable<MenuItem>> GetAllAsync(int institutionId, MenuItemFilterDto? filter = null)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                var items = await connection.QueryAsync<MenuItem, Category, CanteenOutlet, MenuItem>(
                    "sp_GetAllMenuItems",
                    (item, category, outlet) =>
                    {
                        item.Category = category;
                        item.Outlet = outlet;
                        return item;
                    },
                    new
                    {
                        p_InstitutionId = institutionId,
                        p_OutletId = filter?.OutletId ?? 0,
                        p_CategoryId = filter?.CategoryId ?? 0,
                        p_FoodType = filter?.FoodType,
                        p_Status = filter?.Status,
                        p_SearchTerm = filter?.SearchTerm
                    },
                    splitOn: "CategoryId,OutletId",
                    commandType: CommandType.StoredProcedure);

                return items;
            }
            catch
            {
                var query = _dbContext.MenuItems
                    .Include(m => m.Category)
                    .Include(m => m.Outlet)
                    .Include(m => m.Variants)
                    .Include(m => m.AddOns)
                    .Where(m => m.InstitutionId == institutionId);

                if (filter != null)
                {
                    if (filter.OutletId.HasValue && filter.OutletId.Value > 0)
                    {
                        query = query.Where(m => m.OutletId == filter.OutletId.Value);
                    }
                    if (filter.CategoryId.HasValue && filter.CategoryId.Value > 0)
                    {
                        query = query.Where(m => m.CategoryId == filter.CategoryId.Value);
                    }
                    if (!string.IsNullOrWhiteSpace(filter.FoodType) && filter.FoodType != "ALL")
                    {
                        query = query.Where(m => m.FoodType == filter.FoodType);
                    }
                    if (!string.IsNullOrWhiteSpace(filter.Status) && filter.Status != "ALL")
                    {
                        query = query.Where(m => m.Status == filter.Status);
                    }
                    if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
                    {
                        var term = filter.SearchTerm.Trim().ToLower();
                        query = query.Where(m => m.Name.ToLower().Contains(term) || m.Code.ToLower().Contains(term));
                    }
                }

                return await query.OrderBy(m => m.Code).AsNoTracking().ToListAsync();
            }
        }

        public async Task<MenuItem?> GetByIdAsync(int id, int institutionId)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                using var multi = await connection.QueryMultipleAsync(
                    "sp_GetMenuItemById",
                    new { p_MenuItemId = id, p_InstitutionId = institutionId },
                    commandType: CommandType.StoredProcedure);

                var menuItem = await multi.ReadFirstOrDefaultAsync<MenuItem>();
                if (menuItem != null)
                {
                    menuItem.Variants = (await multi.ReadAsync<MenuItemVariant>()).ToList();
                    menuItem.AddOns = (await multi.ReadAsync<MenuItemAddon>()).ToList();

                    var cat = await _dbContext.Categories.FindAsync(menuItem.CategoryId);
                    var outlet = await _dbContext.CanteenOutlets.FindAsync(menuItem.OutletId);
                    menuItem.Category = cat;
                    menuItem.Outlet = outlet;
                }

                return menuItem;
            }
            catch
            {
                return await _dbContext.MenuItems
                    .Include(m => m.Category)
                    .Include(m => m.Outlet)
                    .Include(m => m.Variants)
                    .Include(m => m.AddOns)
                    .FirstOrDefaultAsync(m => m.MenuItemId == id && m.InstitutionId == institutionId);
            }
        }

        public async Task<bool> ExistsByCodeAsync(string code, int institutionId, int? excludeId = null)
        {
            var query = _dbContext.MenuItems
                .Where(m => m.InstitutionId == institutionId && m.Code.ToLower() == code.Trim().ToLower());

            if (excludeId.HasValue)
            {
                query = query.Where(m => m.MenuItemId != excludeId.Value);
            }

            return await query.AnyAsync();
        }

        public async Task<MenuItem> CreateAsync(MenuItem item)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                var created = await connection.QueryFirstOrDefaultAsync<MenuItem>(
                    "sp_CreateMenuItem",
                    new
                    {
                        p_InstitutionId = item.InstitutionId,
                        p_OutletId = item.OutletId,
                        p_CategoryId = item.CategoryId,
                        p_Code = item.Code,
                        p_Name = item.Name,
                        p_Description = item.Description,
                        p_FoodType = item.FoodType,
                        p_Price = item.Price,
                        p_DailyCapacity = item.DailyCapacity,
                        p_RemainingCapacity = item.RemainingCapacity,
                        p_Availability = item.Availability,
                        p_Status = item.Status,
                        p_PublicationStatus = item.PublicationStatus,
                        p_ServingSize = item.ServingSize,
                        p_Calories = item.Calories,
                        p_ImageUrl = item.ImageUrl,
                        p_AllergensJson = item.AllergensJson,
                        p_WorkingDaysJson = item.WorkingDaysJson,
                        p_StartTime = item.StartTime,
                        p_EndTime = item.EndTime
                    },
                    commandType: CommandType.StoredProcedure);

                return created ?? item;
            }
            catch
            {
                await _dbContext.MenuItems.AddAsync(item);
                await _dbContext.SaveChangesAsync();
                return item;
            }
        }

        public async Task<MenuItem> UpdateAsync(MenuItem item)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                var updated = await connection.QueryFirstOrDefaultAsync<MenuItem>(
                    "sp_UpdateMenuItem",
                    new
                    {
                        p_MenuItemId = item.MenuItemId,
                        p_InstitutionId = item.InstitutionId,
                        p_OutletId = item.OutletId,
                        p_CategoryId = item.CategoryId,
                        p_Code = item.Code,
                        p_Name = item.Name,
                        p_Description = item.Description,
                        p_FoodType = item.FoodType,
                        p_Price = item.Price,
                        p_DailyCapacity = item.DailyCapacity,
                        p_RemainingCapacity = item.RemainingCapacity,
                        p_Availability = item.Availability,
                        p_Status = item.Status,
                        p_PublicationStatus = item.PublicationStatus,
                        p_ServingSize = item.ServingSize,
                        p_Calories = item.Calories,
                        p_ImageUrl = item.ImageUrl,
                        p_AllergensJson = item.AllergensJson,
                        p_WorkingDaysJson = item.WorkingDaysJson,
                        p_StartTime = item.StartTime,
                        p_EndTime = item.EndTime
                    },
                    commandType: CommandType.StoredProcedure);

                return updated ?? item;
            }
            catch
            {
                item.UpdatedAt = DateTime.UtcNow;
                _dbContext.MenuItems.Update(item);
                await _dbContext.SaveChangesAsync();
                return item;
            }
        }

        public async Task<bool> DeleteAsync(int id, int institutionId)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                var rows = await connection.ExecuteScalarAsync<int>(
                    "sp_DeleteMenuItem",
                    new { p_MenuItemId = id, p_InstitutionId = institutionId },
                    commandType: CommandType.StoredProcedure);

                return rows > 0;
            }
            catch
            {
                var item = await _dbContext.MenuItems.FirstOrDefaultAsync(m => m.MenuItemId == id && m.InstitutionId == institutionId);
                if (item == null) return false;

                _dbContext.MenuItems.Remove(item);
                await _dbContext.SaveChangesAsync();
                return true;
            }
        }

        public async Task<int> GetHistoricalOrderCountAsync(int menuItemId)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                return await connection.ExecuteScalarAsync<int>(
                    "sp_GetMenuItemHistoricalOrderCount",
                    new { p_MenuItemId = menuItemId },
                    commandType: CommandType.StoredProcedure);
            }
            catch
            {
                return 0;
            }
        }
    }
}
