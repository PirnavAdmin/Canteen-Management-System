using System.Data;
using CanteenManagement.API.Data;
using CanteenManagement.API.DTOs.CanteenCategory;
using CanteenManagement.API.Repositories.Interfaces;
using Dapper;

namespace CanteenManagement.API.Repositories.Implementations
{
    public class CanteenCategoryRepository : ICanteenCategoryRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public CanteenCategoryRepository(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<IEnumerable<CanteenCategoryResponseDto>> GetAllAsync(int institutionId, bool? isActive = null)
        {
            using var connection = _connectionFactory.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_InstitutionId", institutionId);
            parameters.Add("p_IsActive", isActive.HasValue ? (isActive.Value ? 1 : 0) : null);

            return await connection.QueryAsync<CanteenCategoryResponseDto>(
                "sp_GetCanteenCategories",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<CanteenCategoryResponseDto?> GetByIdAsync(int categoryId, int institutionId)
        {
            using var connection = _connectionFactory.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_CategoryId", categoryId);
            parameters.Add("p_InstitutionId", institutionId);

            return await connection.QueryFirstOrDefaultAsync<CanteenCategoryResponseDto>(
                "sp_GetCanteenCategoryById",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<int> CreateAsync(int institutionId, CreateCanteenCategoryDto dto)
        {
            using var connection = _connectionFactory.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_InstitutionId", institutionId);
            parameters.Add("p_Name", dto.Name);
            parameters.Add("p_Description", dto.Description);
            parameters.Add("p_DisplayOrder", dto.DisplayOrder);

            return await connection.ExecuteScalarAsync<int>(
                "sp_CreateCanteenCategory",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> UpdateAsync(int categoryId, int institutionId, UpdateCanteenCategoryDto dto)
        {
            using var connection = _connectionFactory.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_CategoryId", categoryId);
            parameters.Add("p_InstitutionId", institutionId);
            parameters.Add("p_Name", dto.Name);
            parameters.Add("p_Description", dto.Description);
            parameters.Add("p_DisplayOrder", dto.DisplayOrder);

            var rows = await connection.ExecuteScalarAsync<int>(
                "sp_UpdateCanteenCategory",
                parameters,
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }

        public async Task<bool> ToggleStatusAsync(int categoryId, int institutionId, bool isActive)
        {
            using var connection = _connectionFactory.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_CategoryId", categoryId);
            parameters.Add("p_InstitutionId", institutionId);
            parameters.Add("p_IsActive", isActive ? 1 : 0);

            var rows = await connection.ExecuteScalarAsync<int>(
                "sp_ToggleCanteenCategoryStatus",
                parameters,
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }

        public async Task<bool> ExistsByNameAsync(int institutionId, string name, int? excludeCategoryId = null)
        {
            using var connection = _connectionFactory.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_InstitutionId", institutionId);
            parameters.Add("p_Name", name.Trim());
            parameters.Add("p_ExcludeCategoryId", excludeCategoryId);

            var count = await connection.ExecuteScalarAsync<int>(
                "sp_CheckCanteenCategoryNameExists",
                parameters,
                commandType: CommandType.StoredProcedure);

            return count > 0;
        }
    }
}
