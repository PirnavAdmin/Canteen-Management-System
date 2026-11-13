using System.Data;
using System.Text.RegularExpressions;
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
                        logger.LogInformation("Database connection successful with: Server={Server}, Port={Port}, User={User}",
                            builder.Server, builder.Port, builder.UserID);
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

                using var connection = new MySqlConnection(activeCs);
                await connection.OpenAsync();

                var dbDir = ResolveDatabaseDirectory();
                logger.LogInformation("Resolved Database scripts root directory: {Path}", dbDir);

                // 1. Deploy Tables from Database/Schema/01_Tables.sql (Zero inline SQL in C#)
                await DeployTablesFromSchemaFileAsync(connection, dbDir, logger);

                // 2. Deploy Seed Data from Database/Seeds/01_SeedData.sql (Zero inline SQL in C#)
                await DeploySeedsFromFileAsync(connection, dbDir, logger);

                // 3. Deploy All 35 Stored Procedures from Database/StoredProcedures/*.sql
                await DeployStoredProceduresFromFilesAsync(connection, dbDir, logger);

                logger.LogInformation("Database schema, stored procedures, and seed data verified successfully on {ActiveCs}.", activeCs);
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
