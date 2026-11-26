using System.Data;
using System.Text.RegularExpressions;
using CanteenManagement.API.Helpers;
using Dapper;
using Microsoft.Extensions.Logging;
using MySqlConnector;

namespace CanteenManagement.API.Data
{
    public static class DatabaseInitializer
    {
        public static string WorkingConnectionString { get; private set; } = string.Empty;

        public static async Task InitializeAsync(string preferredConnectionString, ILogger logger)
        {
            try
            {
                var candidates = new List<string>();
                if (!string.IsNullOrWhiteSpace(preferredConnectionString))
                {
                    candidates.Add(preferredConnectionString);
                }
                candidates.Add("Server=localhost;Port=3306;User ID=root;Password=root;Database=canteen_db;Allow User Variables=True;Connection Timeout=8;");

                string? activeCs = null;
                foreach (var cs in candidates)
                {
                    try
                    {
                        var builder = new MySqlConnectionStringBuilder(cs)
                        {
                            ConnectionTimeout = 8
                        };
                        using var testConn = new MySqlConnection(builder.ConnectionString);
                        await testConn.OpenAsync();
                        logger.LogInformation("Database connection verified: Server={Server}, Database={Database}",
                            builder.Server, builder.Database);
                        WorkingConnectionString = builder.ConnectionString;
                        activeCs = builder.ConnectionString;
                        break;
                    }
                    catch (Exception ex)
                    {
                        logger.LogWarning("Connection attempt failed for {Cs}: {Message}", cs.Split(';').FirstOrDefault(), ex.Message);
                    }
                }

                if (string.IsNullOrEmpty(activeCs))
                {
                    logger.LogError("Unable to connect to any MySQL database candidate.");
                    return;
                }

                // Ensure Notes, PackagingFee in Orders and DiscountPercent in MenuItems exist safely
                try
                {
                    using var alterConn = new MySqlConnection(activeCs);
                    await alterConn.OpenAsync();
                    await alterConn.ExecuteAsync("ALTER TABLE Orders ADD COLUMN IF NOT EXISTS Notes VARCHAR(500) NULL;");
                    await alterConn.ExecuteAsync("ALTER TABLE Orders ADD COLUMN IF NOT EXISTS PackagingFee DECIMAL(10,2) NOT NULL DEFAULT 0.00;");
                    await alterConn.ExecuteAsync("ALTER TABLE MenuItems ADD COLUMN IF NOT EXISTS DiscountPercent DECIMAL(5,2) NOT NULL DEFAULT 0.00;");

                    // 1. Ensure dedicated CanteenWarehouses table exists safely
                    await alterConn.ExecuteAsync(@"
                        CREATE TABLE IF NOT EXISTS CanteenWarehouses (
                            WarehouseId INT AUTO_INCREMENT PRIMARY KEY,
                            CampusId INT NOT NULL DEFAULT 1,
                            Code VARCHAR(30) NOT NULL DEFAULT 'WH-CENTRAL',
                            Name VARCHAR(100) NOT NULL DEFAULT 'Central Procurement Warehouse',
                            Location VARCHAR(200) NULL DEFAULT 'Campus Central Logistics Block, Ground Floor',
                            IsActive BOOLEAN NOT NULL DEFAULT TRUE,
                            CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            UpdatedAt DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
                            UNIQUE KEY uq_warehouse_code (CampusId, Code)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

                    // Seed default Central Procurement Warehouse if not exists
                    await alterConn.ExecuteAsync(@"
                        INSERT INTO CanteenWarehouses (CampusId, Code, Name, Location, IsActive, CreatedAt)
                        SELECT 1, 'WH-CENTRAL', 'Central Procurement Warehouse (Admin Master Store)', 'Campus Central Logistics Block, Ground Floor', 1, UTC_TIMESTAMP()
                        WHERE NOT EXISTS (SELECT 1 FROM CanteenWarehouses WHERE CampusId = 1);");

                    // 2. Ensure InventoryItems columns support both Central Warehouse and Kitchen Outlets cleanly
                    try { await alterConn.ExecuteAsync("ALTER TABLE InventoryItems ADD COLUMN IF NOT EXISTS WarehouseId INT NULL;"); } catch { }
                    try { await alterConn.ExecuteAsync("ALTER TABLE InventoryItems ADD COLUMN IF NOT EXISTS StoreType VARCHAR(30) NOT NULL DEFAULT 'KitchenOutlet';"); } catch { }
                    try { await alterConn.ExecuteAsync("ALTER TABLE InventoryItems MODIFY COLUMN OutletId INT NULL;"); } catch { }

                    // Migrate existing Central Warehouse items (previously assigned to OutletId 4) to WarehouseId 1
                    try
                    {
                        await alterConn.ExecuteAsync(@"
                            UPDATE InventoryItems 
                            SET WarehouseId = 1, StoreType = 'CentralWarehouse', OutletId = NULL 
                            WHERE OutletId = 4 OR OutletId NOT IN (SELECT OutletId FROM CanteenOutlets WHERE Code != 'WH-01');");
                        
                        await alterConn.ExecuteAsync(@"
                            UPDATE InventoryItems 
                            SET StoreType = 'KitchenOutlet' 
                            WHERE OutletId IS NOT NULL;");
                    } catch { }

                    // 3. PurchaseOrders, StockMovements & StockRequests decoupling
                    try { await alterConn.ExecuteAsync("ALTER TABLE PurchaseOrders ADD COLUMN IF NOT EXISTS WarehouseId INT NULL;"); } catch { }
                    try { await alterConn.ExecuteAsync("ALTER TABLE PurchaseOrders MODIFY COLUMN OutletId INT NULL;"); } catch { }
                    try { await alterConn.ExecuteAsync("UPDATE PurchaseOrders SET WarehouseId = 1, OutletId = NULL WHERE OutletId = 4;"); } catch { }

                    try { await alterConn.ExecuteAsync("ALTER TABLE StockMovements ADD COLUMN IF NOT EXISTS WarehouseId INT NULL;"); } catch { }
                    try { await alterConn.ExecuteAsync("ALTER TABLE StockMovements MODIFY COLUMN OutletId INT NULL;"); } catch { }
                    try { await alterConn.ExecuteAsync("UPDATE StockMovements SET WarehouseId = 1, OutletId = NULL WHERE OutletId = 4;"); } catch { }

                    try { await alterConn.ExecuteAsync("ALTER TABLE StockRequests ADD COLUMN IF NOT EXISTS WarehouseId INT NULL;"); } catch { }
                    try { await alterConn.ExecuteAsync("UPDATE StockRequests SET WarehouseId = 1 WHERE SourceOutletId = 4;"); } catch { }

                    // 4. Permanently remove WH-01 from CanteenOutlets (CanteenOutlets will ONLY contain dining outlets)
                    try
                    {
                        await alterConn.ExecuteAsync("DELETE FROM CanteenOutletSettings WHERE OutletId = 4;");
                        await alterConn.ExecuteAsync("DELETE FROM CanteenStaffAssignments WHERE OutletId = 4;");
                        await alterConn.ExecuteAsync("UPDATE StockRequests SET OutletId = 1 WHERE OutletId = 4;");
                        await alterConn.ExecuteAsync("UPDATE MenuItems SET OutletId = 1 WHERE OutletId = 4;");
                        await alterConn.ExecuteAsync("UPDATE Orders SET OutletId = 1 WHERE OutletId = 4;");
                        var deletedOutlets = await alterConn.ExecuteAsync("DELETE FROM CanteenOutlets WHERE Code = 'WH-01' OR Name LIKE '%Warehouse%';");
                        if (deletedOutlets > 0)
                        {
                            logger.LogInformation("Permanently decoupled Central Warehouse from CanteenOutlets ({Count} rows removed from dining outlets table).", deletedOutlets);
                        }
                    } catch (Exception ex)
                    {
                        logger.LogWarning("Notice cleaning up WH-01 from CanteenOutlets: {Message}", ex.Message);
                    }

                    // Ensure StockRequests table exists safely with VARCHAR(50) RequestId
                    await alterConn.ExecuteAsync(@"
                        CREATE TABLE IF NOT EXISTS StockRequests (
                            RequestId VARCHAR(50) NOT NULL PRIMARY KEY,
                            CampusId INT NOT NULL DEFAULT 1,
                            OutletId INT NOT NULL,
                            SourceOutletId INT NULL,
                            ItemId INT NULL,
                            ItemCode VARCHAR(50) NULL,
                            ItemName VARCHAR(100) NOT NULL,
                            Category VARCHAR(50) NOT NULL DEFAULT 'Groceries',
                            RequestedQuantity DECIMAL(10,2) NOT NULL,
                            IssuedQuantity DECIMAL(10,2) NULL,
                            Unit VARCHAR(20) NOT NULL DEFAULT 'kg',
                            Urgency VARCHAR(20) NOT NULL DEFAULT 'Normal',
                            Status VARCHAR(30) NOT NULL DEFAULT 'Pending Review',
                            Notes TEXT NULL,
                            AdminNotes TEXT NULL,
                            RequiredByDate DATE NULL,
                            RequestedBy VARCHAR(100) NOT NULL,
                            DispatchedBy VARCHAR(100) NULL,
                            ReceivedBy VARCHAR(100) NULL,
                            CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            DispatchedAt DATETIME NULL,
                            ReceivedAt DATETIME NULL,
                            UpdatedAt DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
                            CONSTRAINT fk_stockrequest_outlet FOREIGN KEY (OutletId) REFERENCES CanteenOutlets (OutletId)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

                    // Add missing columns if table already existed previously
                    try { await alterConn.ExecuteAsync("ALTER TABLE StockRequests ADD COLUMN IF NOT EXISTS IssuedQuantity DECIMAL(10,2) NULL;"); } catch { }
                    try { await alterConn.ExecuteAsync("ALTER TABLE StockRequests ADD COLUMN IF NOT EXISTS DispatchedBy VARCHAR(100) NULL;"); } catch { }
                    try { await alterConn.ExecuteAsync("ALTER TABLE StockRequests ADD COLUMN IF NOT EXISTS ReceivedBy VARCHAR(100) NULL;"); } catch { }
                    try { await alterConn.ExecuteAsync("ALTER TABLE StockRequests ADD COLUMN IF NOT EXISTS DispatchedAt DATETIME NULL;"); } catch { }
                    try { await alterConn.ExecuteAsync("ALTER TABLE StockRequests ADD COLUMN IF NOT EXISTS ReceivedAt DATETIME NULL;"); } catch { }
                    try { await alterConn.ExecuteAsync("ALTER TABLE StockRequests ADD COLUMN IF NOT EXISTS RejectionReason TEXT NULL;"); } catch { }
                    try { await alterConn.ExecuteAsync("DELETE FROM StockRequests WHERE RequestId = '' OR RequestId IS NULL;"); } catch { }
                }
                catch (Exception ex)
                {
                    logger.LogInformation("Database column schema verification: {Message}", ex.Message);
                }

                // Ensure default Cashier user exists safely
                try
                {
                    using var userConn = new MySqlConnection(activeCs);
                    await userConn.OpenAsync();
                    var cashierExists = await userConn.ExecuteScalarAsync<int>("SELECT COUNT(1) FROM Users WHERE Username = 'cashier' OR Email = 'cashier@canteen.edu';");
                    if (cashierExists == 0)
                    {
                        var cashierHash = PasswordHasher.HashPassword("Cashier@123");
                        await userConn.ExecuteAsync(@"
                            INSERT INTO Users (CampusId, Username, Email, PasswordHash, FullName, Role, PhoneNumber, IsActive, CreatedAt)
                            VALUES (1, 'cashier', 'cashier@canteen.edu', @PasswordHash, 'Rahul Verma (Cashier)', 'Cashier', '+91 98765 43215', 1, UTC_TIMESTAMP());",
                            new { PasswordHash = cashierHash });
                        logger.LogInformation("Default Cashier account 'cashier' seeded successfully.");
                    }
                }
                catch (Exception ex)
                {
                    logger.LogInformation("Cashier user verification: {Message}", ex.Message);
                }

                // Ensure CanteenStaffAssignments table exists safely and default Cashier is mapped to Outlet 1
                try
                {
                    using var assignConn = new MySqlConnection(activeCs);
                    await assignConn.OpenAsync();
                    await assignConn.ExecuteAsync(@"
                        CREATE TABLE IF NOT EXISTS CanteenStaffAssignments (
                            AssignmentId INT AUTO_INCREMENT PRIMARY KEY,
                            UserId INT NOT NULL,
                            OutletId INT NOT NULL,
                            Role VARCHAR(50) NOT NULL DEFAULT 'Cashier',
                            IsActive BOOLEAN NOT NULL DEFAULT TRUE,
                            AssignedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            UpdatedAt DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
                            INDEX idx_canteen_staff_user (UserId),
                            INDEX idx_canteen_staff_outlet (OutletId),
                            CONSTRAINT fk_canteen_staff_outlet FOREIGN KEY (OutletId) REFERENCES CanteenOutlets (OutletId) ON DELETE CASCADE
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

                    var cashierUserId = await assignConn.ExecuteScalarAsync<int?>(@"
                        SELECT UserId FROM Users WHERE Username = 'cashier' OR Email = 'cashier@canteen.edu' LIMIT 1;");

                    if (cashierUserId.HasValue && cashierUserId.Value > 0)
                    {
                        var hasAssignment = await assignConn.ExecuteScalarAsync<int>(@"
                            SELECT COUNT(1) FROM CanteenStaffAssignments WHERE UserId = @UserId AND OutletId = 1;",
                            new { UserId = cashierUserId.Value });

                        if (hasAssignment == 0)
                        {
                            await assignConn.ExecuteAsync(@"
                                INSERT INTO CanteenStaffAssignments (UserId, OutletId, Role, IsActive, AssignedAt)
                                VALUES (@UserId, 1, 'Cashier', 1, UTC_TIMESTAMP());",
                                new { UserId = cashierUserId.Value });
                            logger.LogInformation("Mapped default Cashier (UserId={UserId}) to Outlet 1 (Main Canteen Kitchen).", cashierUserId.Value);
                        }
                    }
                }
                catch (Exception ex)
                {
                    logger.LogInformation("Canteen staff assignment verification: {Message}", ex.Message);
                }

                // Ensure latest Stored Procedures from Database/StoredProcedures are up-to-date
                try
                {
                    using var spConn = new MySqlConnection(activeCs);
                    await spConn.OpenAsync();
                    var dbDir = ResolveDatabaseDirectory();
                    var forceDeploySp = string.Equals(Environment.GetEnvironmentVariable("DEPLOY_SP"), "true", StringComparison.OrdinalIgnoreCase);
                    
                    var existingSpCount = await spConn.ExecuteScalarAsync<int>(@"
                        SELECT COUNT(1) FROM information_schema.ROUTINES 
                        WHERE ROUTINE_SCHEMA = DATABASE() AND ROUTINE_TYPE = 'PROCEDURE';");

                    if (forceDeploySp || existingSpCount < 10)
                    {
                        logger.LogInformation("Deploying latest Stored Procedures from {Path}...", dbDir);
                        await DeployStoredProceduresFromFilesAsync(spConn, dbDir, logger);
                    }
                    else
                    {
                        logger.LogInformation("Verified {Count} existing Stored Procedures in database. Redundant deployment skipped.", existingSpCount);
                    }
                }
                catch (Exception ex)
                {
                    logger.LogWarning("Notice deploying latest Stored Procedures: {Message}", ex.Message);
                }

                // Cloud database on Hostinger is already deployed and verified.
                // We only run full schema & seed migrations if explicitly requested via INIT_DATABASE=true.
                var shouldDeploy = string.Equals(Environment.GetEnvironmentVariable("INIT_DATABASE"), "true", StringComparison.OrdinalIgnoreCase);
                if (shouldDeploy)
                {
                    using var connection = new MySqlConnection(activeCs);
                    await connection.OpenAsync();
                    var dbDir = ResolveDatabaseDirectory();
                    logger.LogInformation("Running database deployment from {Path}...", dbDir);
                    await DeployTablesFromSchemaFileAsync(connection, dbDir, logger);
                    await DeploySeedsFromFileAsync(connection, dbDir, logger);
                    logger.LogInformation("Database deployment completed successfully.");
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Database initialization error: {Message}", ex.Message);
            }
        }

        private static string ResolveDatabaseDirectory()
        {
            var candidates = new[]
            {
                Path.Combine(Directory.GetCurrentDirectory(), "Database"),
                Path.Combine(AppContext.BaseDirectory, "Database"),
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "Database")
            };

            foreach (var path in candidates)
            {
                if (Directory.Exists(path) && Directory.Exists(Path.Combine(path, "StoredProcedures")))
                {
                    return Path.GetFullPath(path);
                }
            }

            return Path.Combine(Directory.GetCurrentDirectory(), "Database");
        }

        private static async Task DeployTablesFromSchemaFileAsync(MySqlConnection connection, string dbDir, ILogger logger)
        {
            var schemaFile = Path.Combine(dbDir, "Schema", "01_Tables.sql");
            if (!File.Exists(schemaFile))
            {
                logger.LogWarning("Schema file not found at {File}", schemaFile);
                return;
            }

            var content = await File.ReadAllTextAsync(schemaFile);
            var matches = Regex.Matches(content, @"(?ms)(CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+[a-zA-Z0-9_]+\s*\(.*?\)\s*ENGINE=InnoDB[^;]*;)");

            int count = 0;
            foreach (Match m in matches)
            {
                try
                {
                    await connection.ExecuteAsync(m.Value);
                    count++;
                }
                catch (Exception ex)
                {
                    logger.LogWarning("Notice executing table DDL: {Message}", ex.Message);
                }
            }

            logger.LogInformation("Verified {Count} database tables from {File}.", count, Path.GetFileName(schemaFile));
        }

        private static async Task DeploySeedsFromFileAsync(MySqlConnection connection, string dbDir, ILogger logger)
        {
            var seedFile = Path.Combine(dbDir, "Seeds", "01_SeedData.sql");
            if (!File.Exists(seedFile))
            {
                logger.LogWarning("Seed data file not found at {File}", seedFile);
                return;
            }

            var content = await File.ReadAllTextAsync(seedFile);
            var matches = Regex.Matches(content, @"(?ms)(INSERT\s+INTO\s+[a-zA-Z0-9_]+\s*\(.*?\);)");

            int count = 0;
            foreach (Match m in matches)
            {
                try
                {
                    await connection.ExecuteAsync(m.Value);
                    count++;
                }
                catch (Exception ex)
                {
                    logger.LogWarning("Notice executing seed statement: {Message}", ex.Message);
                }
            }

            logger.LogInformation("Verified {Count} seed data statements from {File}.", count, Path.GetFileName(seedFile));
        }

        private static async Task DeployStoredProceduresFromFilesAsync(MySqlConnection connection, string dbDir, ILogger logger)
        {
            var spDir = Path.Combine(dbDir, "StoredProcedures");
            if (!Directory.Exists(spDir))
            {
                logger.LogWarning("StoredProcedures directory not found at {Dir}", spDir);
                return;
            }

            var files = Directory.GetFiles(spDir, "*.sql")
                .Where(f => !Path.GetFileName(f).StartsWith("00_"))
                .OrderBy(f => Path.GetFileName(f))
                .ToList();

            int deployedCount = 0;
            foreach (var file in files)
            {
                var content = await File.ReadAllTextAsync(file);

                // 1. Drop existing procedure if defined
                var dropMatches = Regex.Matches(content, @"(?ms)DROP\s+PROCEDURE\s+IF\s+EXISTS\s+([a-zA-Z0-9_]+);");
                foreach (Match dm in dropMatches)
                {
                    try { await connection.ExecuteAsync(dm.Value); } catch { }
                }

                // 2. Create procedure body (delimit by final END $$)
                var createMatches = Regex.Matches(content, @"(?ms)(CREATE\s+PROCEDURE\s+([a-zA-Z0-9_]+)\s*\(.*?\bEND\s*\$\$?)");
                foreach (Match cm in createMatches)
                {
                    var procSql = cm.Groups[1].Value.Trim();
                    if (procSql.EndsWith("$$"))
                    {
                        procSql = procSql.Substring(0, procSql.Length - 2).Trim();
                    }
                    else if (procSql.EndsWith("$"))
                    {
                        procSql = procSql.Substring(0, procSql.Length - 1).Trim();
                    }

                    try
                    {
                        await connection.ExecuteAsync(procSql);
                        deployedCount++;
                    }
                    catch (Exception ex)
                    {
                        logger.LogWarning("Notice deploying Stored Procedure {ProcName} from {File}: {Message}",
                            cm.Groups[2].Value, Path.GetFileName(file), ex.Message);
                    }
                }
            }

            logger.LogInformation("Successfully verified and deployed all {Count} MySQL Stored Procedures from {FileCount} SQL files.",
                deployedCount, files.Count);
        }
    }
}
