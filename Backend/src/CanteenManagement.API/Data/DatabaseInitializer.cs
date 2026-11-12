using System.Data;
using CanteenManagement.API.Helpers;
using Dapper;
using MySqlConnector;

namespace CanteenManagement.API.Data
{
    public static class DatabaseInitializer
    {
        public static string WorkingConnectionString { get; private set; } = string.Empty;

        public static async Task<string> FindWorkingConnectionStringAsync(string defaultCs, ILogger logger)
        {
            var candidates = new List<string>
            {
                defaultCs,
                "Server=localhost;Port=3306;Database=canteen_db;User=root;Password=root;AllowUserVariables=True;",
                "Server=localhost;Port=3306;Database=canteen_db;User=root;Password=admin;AllowUserVariables=True;",
                "Server=localhost;Port=3306;Database=canteen_db;User=root;Password=Clm@2026;AllowUserVariables=True;",
                "Server=localhost;Port=3306;Database=canteen_db;User=root;Password=;AllowUserVariables=True;",
                "Server=localhost;Port=3307;Database=canteen_db;User=root;Password=;AllowUserVariables=True;",
                "Server=localhost;Port=3307;Database=canteen_db;User=root;Password=root;AllowUserVariables=True;",
                "Server=localhost;Port=3306;Database=mysql;User=root;Password=root;",
                "Server=localhost;Port=3306;Database=mysql;User=root;Password=admin;",
                "Server=localhost;Port=3306;Database=mysql;User=root;Password=;"
            };

            foreach (var cs in candidates)
            {
                try
                {
                    var builder = new MySqlConnectionStringBuilder(cs)
                    {
                        ConnectionTimeout = 2
                    };
                    using var testConn = new MySqlConnection(builder.ConnectionString);
                    await testConn.OpenAsync();
                    logger.LogInformation("Database connection successful with: Server={Server}, Port={Port}, User={User}",
                        builder.Server, builder.Port, builder.UserID);
                    WorkingConnectionString = builder.ConnectionString;
                    return builder.ConnectionString;
                }
                catch (Exception ex)
                {
                    logger.LogDebug("Candidate connection failed for {Cs}: {Msg}", cs, ex.Message);
                }
            }

            logger.LogWarning("No MySQL candidate succeeded. Will attempt default connection: {Cs}", defaultCs);
            WorkingConnectionString = defaultCs;
            return defaultCs;
        }

        public static async Task InitializeAsync(string connectionString, ILogger logger)
        {
            var activeCs = await FindWorkingConnectionStringAsync(connectionString, logger);

            try
            {
                using var connection = new MySqlConnection(activeCs);
                await connection.OpenAsync();

                // Ensure canteen_db database exists if on localhost
                try
                {
                    await connection.ExecuteAsync("CREATE DATABASE IF NOT EXISTS `canteen_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
                    await connection.ExecuteAsync("USE `canteen_db`;");
                }
                catch
                {
                    // Ignore if database cannot be created due to permissions on shared hosting
                }

                // 1. Create Users table
                const string createUsersTableSql = @"
                CREATE TABLE IF NOT EXISTS Users (
                    UserId INT AUTO_INCREMENT PRIMARY KEY,
                    InstitutionId INT NOT NULL DEFAULT 1,
                    Username VARCHAR(50) NOT NULL,
                    Email VARCHAR(100) NOT NULL,
                    PasswordHash VARCHAR(255) NOT NULL,
                    FullName VARCHAR(100) NOT NULL,
                    Role VARCHAR(20) NOT NULL DEFAULT 'Student',
                    PhoneNumber VARCHAR(20) NULL,
                    IsActive TINYINT(1) NOT NULL DEFAULT 1,
                    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    UpdatedAt DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_inst_username (InstitutionId, Username),
                    UNIQUE KEY uq_inst_email (InstitutionId, Email)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
                await connection.ExecuteAsync(createUsersTableSql);

                // 2. Create AuditLogs table
                const string createAuditLogsTableSql = @"
                CREATE TABLE IF NOT EXISTS AuditLogs (
                    AuditLogId BIGINT AUTO_INCREMENT PRIMARY KEY,
                    InstitutionId INT NOT NULL DEFAULT 1,
                    UserId INT NULL,
                    UserName VARCHAR(100) NOT NULL DEFAULT 'System',
                    Action VARCHAR(50) NOT NULL,
                    EntityName VARCHAR(100) NOT NULL,
                    EntityId VARCHAR(100) NULL,
                    Details TEXT NULL,
                    IpAddress VARCHAR(50) NULL,
                    Timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
                await connection.ExecuteAsync(createAuditLogsTableSql);

                // 3. Create CanteenOutlets table
                const string createOutletsTableSql = @"
                CREATE TABLE IF NOT EXISTS CanteenOutlets (
                    OutletId INT AUTO_INCREMENT PRIMARY KEY,
                    InstitutionId INT NOT NULL DEFAULT 1,
                    Code VARCHAR(20) NOT NULL,
                    Name VARCHAR(100) NOT NULL,
                    Location VARCHAR(200) NULL,
                    OpenTime VARCHAR(10) NOT NULL DEFAULT '08:00',
                    CloseTime VARCHAR(10) NOT NULL DEFAULT '16:30',
                    FssaiLicenseNo VARCHAR(50) NULL,
                    ContactNumber VARCHAR(20) NULL,
                    Status VARCHAR(20) NOT NULL DEFAULT 'Active',
                    IsOrderAcceptanceEnabled TINYINT(1) NOT NULL DEFAULT 1,
                    WorkingDays TEXT NULL,
                    AdminContactJson TEXT NULL,
                    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    UpdatedAt DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_inst_code (InstitutionId, Code)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
                await connection.ExecuteAsync(createOutletsTableSql);

                // 4. Create CanteenOutletSettings table
                const string createSettingsTableSql = @"
                CREATE TABLE IF NOT EXISTS CanteenOutletSettings (
                    SettingId INT AUTO_INCREMENT PRIMARY KEY,
                    OutletId INT NOT NULL,
                    AutoExpireUnpaidMinutes INT NOT NULL DEFAULT 10,
                    PickupHoldMinutes INT NOT NULL DEFAULT 30,
                    CancellationPolicy VARCHAR(50) NOT NULL DEFAULT 'UntilAccepted',
                    AllowUpi TINYINT(1) NOT NULL DEFAULT 1,
                    AllowCards TINYINT(1) NOT NULL DEFAULT 1,
                    AllowWallet TINYINT(1) NOT NULL DEFAULT 1,
                    AllowCash TINYINT(1) NOT NULL DEFAULT 1,
                    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_outlet_settings (OutletId),
                    CONSTRAINT fk_outlet_settings FOREIGN KEY (OutletId) REFERENCES CanteenOutlets (OutletId) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
                await connection.ExecuteAsync(createSettingsTableSql);

                // 5. Seed default demo users if they don't exist
                var adminUser = await connection.QueryFirstOrDefaultAsync<int?>(
                    "SELECT UserId FROM Users WHERE Username = 'admin' LIMIT 1;");
                if (adminUser == null)
                {
                    var adminHash = PasswordHasher.HashPassword("Admin@123");
                    var staffHash = PasswordHasher.HashPassword("Staff@123");
                    var studentHash = PasswordHasher.HashPassword("Student@123");

                    const string insertUsersSql = @"
                    INSERT INTO Users (InstitutionId, Username, Email, PasswordHash, FullName, Role, PhoneNumber, IsActive, CreatedAt)
                    VALUES 
                    (1, 'admin', 'admin@canteen.edu', @AdminHash, 'Mrs. Sunitha (Canteen Admin)', 'Admin', '+91 98765 43210', 1, UTC_TIMESTAMP()),
                    (1, 'staff', 'ravi.staff@canteen.edu', @StaffHash, 'Ravi (Kitchen & Counter Staff)', 'Staff', '+91 98765 43211', 1, UTC_TIMESTAMP()),
                    (1, 'aarav', 'aarav.student@git.edu', @StudentHash, 'Aarav (B.Tech 2nd Year)', 'Student', '+91 98765 43212', 1, UTC_TIMESTAMP());";

                    await connection.ExecuteAsync(insertUsersSql, new
                    {
                        AdminHash = adminHash,
                        StaffHash = staffHash,
                        StudentHash = studentHash
                    });
                    logger.LogInformation("Seeded default users (admin, staff, aarav).");
                }

                // 6. Seed default outlet if none exists
                var outletCount = await connection.ExecuteScalarAsync<int>(
                    "SELECT COUNT(*) FROM CanteenOutlets;");
                if (outletCount == 0)
                {
                    const string insertOutletSql = @"
                    INSERT INTO CanteenOutlets (InstitutionId, Code, Name, Location, OpenTime, CloseTime, FssaiLicenseNo, ContactNumber, Status, IsOrderAcceptanceEnabled, WorkingDays, AdminContactJson, CreatedAt)
                    VALUES 
                    (1, 'MC-01', 'Main Canteen', 'Campus Central Building, Ground Floor', '08:00', '16:30', '10022044000123', '+91 40 2345 6789', 'Active', 1, 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday', '{\""name\"":\""Mrs. Sunitha\"",\""email\"":\""admin@canteen.edu\"",\""phone\"":\""+91 98765 43210\""}', UTC_TIMESTAMP());";
                    await connection.ExecuteAsync(insertOutletSql);

                    var newOutletId = await connection.ExecuteScalarAsync<int>("SELECT LAST_INSERT_ID();");
                    const string insertSettingSql = @"
                    INSERT INTO CanteenOutletSettings (OutletId, AutoExpireUnpaidMinutes, PickupHoldMinutes, CancellationPolicy, AllowUpi, AllowCards, AllowWallet, AllowCash, UpdatedAt)
                    VALUES (@OutletId, 10, 30, 'UntilAccepted', 1, 1, 1, 1, UTC_TIMESTAMP());";
                    await connection.ExecuteAsync(insertSettingSql, new { OutletId = newOutletId });
                    logger.LogInformation("Seeded default outlet MC-01 (Main Canteen).");
                }

                logger.LogInformation("Database tables and seed data verified successfully on {ActiveCs}.", activeCs);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Database initialization error: {Message}", ex.Message);
            }
        }
    }
}
