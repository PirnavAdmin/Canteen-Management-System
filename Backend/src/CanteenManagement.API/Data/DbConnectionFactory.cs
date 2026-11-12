using System.Data;
using MySqlConnector;

namespace CanteenManagement.API.Data
{
    public class DbConnectionFactory : IDbConnectionFactory
    {
        private readonly string _connectionString;

        public DbConnectionFactory(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? "Server=srv1061.hstgr.io;Port=3306;Database=u819242402_canteendb;User=u819242402_canteendbuser;Password=Pirnav@2026;SslMode=None;";
        }

        public IDbConnection CreateConnection()
        {
            return new MySqlConnection(_connectionString);
        }
    }
}
