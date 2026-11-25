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

        public async Task<IEnumerable<MenuItem>> GetAllAsync(int campusId, MenuItemFilterDto? filter = null)
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
                        p_CampusId = campusId,
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
                    .Where(m => m.CampusId == campusId);

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

        public async Task<MenuItem?> GetByIdAsync(int id, int campusId)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                using var multi = await connection.QueryMultipleAsync(
                    "sp_GetMenuItemById",
                    new { p_MenuItemId = id, p_CampusId = campusId },
                    commandType: CommandType.StoredProcedure);

                var menuItem = await multi.ReadFirstOrDefaultAsync<MenuItem>();
                if (menuItem != null)
                {
                    menuItem.Variants = (await multi.ReadAsync<MenuItemVariant>()).ToList();
                    menuItem.AddOns = (await multi.ReadAsync<MenuItemAddon>()).ToList();

                    if (menuItem.CategoryId > 0)
                    {
                        menuItem.Category = await _dbContext.Categories.AsNoTracking().FirstOrDefaultAsync(c => c.CategoryId == menuItem.CategoryId);
                    }
                    if (menuItem.OutletId > 0)
                    {
                        menuItem.Outlet = await _dbContext.CanteenOutlets.AsNoTracking().FirstOrDefaultAsync(o => o.OutletId == menuItem.OutletId);
                    }
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
                    .FirstOrDefaultAsync(m => m.MenuItemId == id && m.CampusId == campusId);
            }
        }

        public async Task<bool> ExistsByCodeAsync(string code, int campusId, int? excludeId = null)
        {
            var query = _dbContext.MenuItems
                .Where(m => m.CampusId == campusId && m.Code.ToLower() == code.Trim().ToLower());

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
                        p_CampusId = item.CampusId,
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

                var targetId = created?.MenuItemId ?? item.MenuItemId;
                if (targetId > 0)
                {
                    if (item.Variants != null && item.Variants.Any())
                    {
                        foreach (var v in item.Variants)
                        {
                            await connection.ExecuteAsync(
                                "sp_AddMenuItemVariant",
                                new { p_MenuItemId = targetId, p_Name = v.Name, p_Price = v.Price },
                                commandType: CommandType.StoredProcedure);
                        }
                    }

                    if (item.AddOns != null && item.AddOns.Any())
                    {
                        foreach (var a in item.AddOns)
                        {
                            await connection.ExecuteAsync(
                                "sp_AddMenuItemAddon",
                                new { p_MenuItemId = targetId, p_Name = a.Name, p_Price = a.Price },
                                commandType: CommandType.StoredProcedure);
                        }
                    }
                }

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
                        p_CampusId = item.CampusId,
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

                if (item.Variants != null)
                {
                    await connection.ExecuteAsync(
                        "sp_ClearMenuItemVariants",
                        new { p_MenuItemId = item.MenuItemId },
                        commandType: CommandType.StoredProcedure);

                    foreach (var v in item.Variants)
                    {
                        await connection.ExecuteAsync(
                            "sp_AddMenuItemVariant",
                            new { p_MenuItemId = item.MenuItemId, p_Name = v.Name, p_Price = v.Price },
                            commandType: CommandType.StoredProcedure);
                    }
                }

                if (item.AddOns != null)
                {
                    await connection.ExecuteAsync(
                        "sp_ClearMenuItemAddons",
                        new { p_MenuItemId = item.MenuItemId },
                        commandType: CommandType.StoredProcedure);

                    foreach (var a in item.AddOns)
                    {
                        await connection.ExecuteAsync(
                            "sp_AddMenuItemAddon",
                            new { p_MenuItemId = item.MenuItemId, p_Name = a.Name, p_Price = a.Price },
                            commandType: CommandType.StoredProcedure);
                    }
                }

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

        public async Task<bool> DeleteAsync(int id, int campusId)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                var rows = await connection.ExecuteScalarAsync<int>(
                    "sp_DeleteMenuItem",
                    new { p_MenuItemId = id, p_CampusId = campusId },
                    commandType: CommandType.StoredProcedure);

                return rows > 0;
            }
            catch
            {
                var item = await _dbContext.MenuItems.FirstOrDefaultAsync(m => m.MenuItemId == id && m.CampusId == campusId);
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

        public async Task<bool> DeductCapacityAsync(int menuItemId, int quantity)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                var result = await connection.QueryFirstOrDefaultAsync(
                    "sp_DeductMenuItemCapacity",
                    new { p_MenuItemId = menuItemId, p_Quantity = quantity },
                    commandType: CommandType.StoredProcedure);
                return result != null;
            }
            catch
            {
                var item = await _dbContext.MenuItems.FindAsync(menuItemId);
                if (item == null) return false;

                if (item.LastResetDate == null || item.LastResetDate < DateTime.UtcNow.Date)
                {
                    item.RemainingCapacity = item.DailyCapacity;
                    if (item.Availability == "SoldOut") item.Availability = "Available";
                    item.LastResetDate = DateTime.UtcNow.Date;
                }

                item.RemainingCapacity = Math.Max(0, item.RemainingCapacity - quantity);
                item.HistoricalOrderCount += quantity;
                if (item.RemainingCapacity <= 0) item.Availability = "SoldOut";
                item.UpdatedAt = DateTime.UtcNow;

                await _dbContext.SaveChangesAsync();
                return true;
            }
        }

        public async Task<bool> RestoreCapacityAsync(int menuItemId, int quantity)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                var result = await connection.QueryFirstOrDefaultAsync(
                    "sp_RestoreMenuItemCapacity",
                    new { p_MenuItemId = menuItemId, p_Quantity = quantity },
                    commandType: CommandType.StoredProcedure);
                return result != null;
            }
            catch
            {
                var item = await _dbContext.MenuItems.FindAsync(menuItemId);
                if (item == null) return false;

                item.RemainingCapacity = Math.Min(item.DailyCapacity, item.RemainingCapacity + quantity);
                item.HistoricalOrderCount = Math.Max(0, item.HistoricalOrderCount - quantity);
                if (item.Availability == "SoldOut" && item.RemainingCapacity > 0) item.Availability = "Available";
                item.UpdatedAt = DateTime.UtcNow;

                await _dbContext.SaveChangesAsync();
                return true;
            }
        }

        public async Task<int> ResetDailyCapacityAsync(int campusId, bool force = false)
        {
            try
            {
                using var connection = _connectionFactory.CreateConnection();
                return await connection.ExecuteScalarAsync<int>(
                    "sp_ResetDailyMenuCapacity",
                    new { p_CampusId = campusId, p_Force = force },
                    commandType: CommandType.StoredProcedure);
            }
            catch
            {
                var query = _dbContext.MenuItems.Where(m => campusId <= 0 || m.CampusId == campusId);
                if (!force)
                {
                    var today = DateTime.UtcNow.Date;
                    query = query.Where(m => m.LastResetDate == null || m.LastResetDate < today);
                }

                var items = await query.ToListAsync();
                foreach (var item in items)
                {
                    item.RemainingCapacity = item.DailyCapacity;
                    if (item.Availability == "SoldOut") item.Availability = "Available";
                    item.LastResetDate = DateTime.UtcNow.Date;
                    item.UpdatedAt = DateTime.UtcNow;
                }

                return await _dbContext.SaveChangesAsync();
            }
        }
    }
}
