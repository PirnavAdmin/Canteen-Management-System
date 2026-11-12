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
                        ConnectionTimeout = 8
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
                    logger.LogInformation("Candidate connection test failed for {Server}: {Msg}", cs, ex.Message);
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

                var csBuilder = new MySqlConnectionStringBuilder(activeCs);
                if (string.Equals(csBuilder.Server, "localhost", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(csBuilder.Server, "127.0.0.1", StringComparison.OrdinalIgnoreCase))
                {
                    try
                    {
                        await connection.ExecuteAsync("CREATE DATABASE IF NOT EXISTS `canteen_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
                        await connection.ExecuteAsync("USE `canteen_db`;");
                    }
                    catch
                    {
                        // Ignore if cannot create database
                    }
                }

                // 1. Users
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

                // 2. AuditLogs
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

                // 3. CanteenOutlets
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

                // 4. CanteenOutletSettings
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

                // 5. Categories
                const string createCategoriesTableSql = @"
                CREATE TABLE IF NOT EXISTS Categories (
                    CategoryId INT AUTO_INCREMENT PRIMARY KEY,
                    InstitutionId INT NOT NULL DEFAULT 1,
                    Name VARCHAR(100) NOT NULL,
                    Description TEXT NULL,
                    DisplayOrder INT NOT NULL DEFAULT 1,
                    Status VARCHAR(20) NOT NULL DEFAULT 'Active',
                    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    UpdatedAt DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_inst_cat_name (InstitutionId, Name)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
                await connection.ExecuteAsync(createCategoriesTableSql);

                // 6. MenuItems, Variants & Addons
                const string createMenuItemsSql = @"
                CREATE TABLE IF NOT EXISTS MenuItems (
                    MenuItemId INT AUTO_INCREMENT PRIMARY KEY,
                    InstitutionId INT NOT NULL DEFAULT 1,
                    OutletId INT NOT NULL,
                    CategoryId INT NOT NULL,
                    Code VARCHAR(30) NOT NULL,
                    Name VARCHAR(150) NOT NULL,
                    Description TEXT NULL,
                    FoodType VARCHAR(20) NOT NULL DEFAULT 'Veg',
                    Price DECIMAL(10,2) NOT NULL,
                    DailyCapacity INT NOT NULL DEFAULT 100,
                    RemainingCapacity INT NOT NULL DEFAULT 100,
                    Availability VARCHAR(20) NOT NULL DEFAULT 'Available',
                    Status VARCHAR(20) NOT NULL DEFAULT 'Active',
                    PublicationStatus VARCHAR(20) NOT NULL DEFAULT 'Published',
                    ServingSize VARCHAR(50) NULL,
                    Calories VARCHAR(50) NULL,
                    ImageUrl VARCHAR(500) NULL,
                    AllergensJson TEXT NULL,
                    WorkingDaysJson TEXT NULL,
                    StartTime VARCHAR(10) NULL,
                    EndTime VARCHAR(10) NULL,
                    HistoricalOrderCount INT NOT NULL DEFAULT 0,
                    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    UpdatedAt DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_inst_menu_code (InstitutionId, Code),
                    CONSTRAINT fk_menu_outlet FOREIGN KEY (OutletId) REFERENCES CanteenOutlets (OutletId),
                    CONSTRAINT fk_menu_category FOREIGN KEY (CategoryId) REFERENCES Categories (CategoryId)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

                CREATE TABLE IF NOT EXISTS MenuItemVariants (
                    VariantId INT AUTO_INCREMENT PRIMARY KEY,
                    MenuItemId INT NOT NULL,
                    Name VARCHAR(100) NOT NULL,
                    Price DECIMAL(10,2) NOT NULL,
                    CONSTRAINT fk_variant_menu FOREIGN KEY (MenuItemId) REFERENCES MenuItems (MenuItemId) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

                CREATE TABLE IF NOT EXISTS MenuItemAddons (
                    AddonId INT AUTO_INCREMENT PRIMARY KEY,
                    MenuItemId INT NOT NULL,
                    Name VARCHAR(100) NOT NULL,
                    Price DECIMAL(10,2) NOT NULL,
                    CONSTRAINT fk_addon_menu FOREIGN KEY (MenuItemId) REFERENCES MenuItems (MenuItemId) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
                await connection.ExecuteAsync(createMenuItemsSql);

                // 7. Slots
                const string createSlotsTableSql = @"
                CREATE TABLE IF NOT EXISTS Slots (
                    SlotId INT AUTO_INCREMENT PRIMARY KEY,
                    InstitutionId INT NOT NULL DEFAULT 1,
                    OutletId INT NOT NULL,
                    Session VARCHAR(30) NOT NULL DEFAULT 'Lunch',
                    Date DATE NOT NULL,
                    StartTime VARCHAR(20) NOT NULL,
                    EndTime VARCHAR(20) NOT NULL,
                    MaxCapacity INT NOT NULL DEFAULT 50,
                    BookedOrders INT NOT NULL DEFAULT 0,
                    Status VARCHAR(30) NOT NULL DEFAULT 'Open',
                    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_slot_outlet FOREIGN KEY (OutletId) REFERENCES CanteenOutlets (OutletId)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
                await connection.ExecuteAsync(createSlotsTableSql);

                // 8. Orders, Items, Timelines & Payments
                const string createOrdersSql = @"
                CREATE TABLE IF NOT EXISTS Orders (
                    OrderId VARCHAR(50) PRIMARY KEY,
                    InstitutionId INT NOT NULL DEFAULT 1,
                    OutletId INT NOT NULL,
                    UserId INT NULL,
                    SlotId INT NULL,
                    Token VARCHAR(20) NOT NULL,
                    CustomerName VARCHAR(100) NOT NULL,
                    CustomerRole VARCHAR(30) NOT NULL DEFAULT 'Student',
                    RollNo VARCHAR(50) NULL,
                    Department VARCHAR(100) NULL,
                    CustomerPhone VARCHAR(20) NULL,
                    CustomerEmail VARCHAR(100) NULL,
                    Subtotal DECIMAL(10,2) NOT NULL,
                    TaxAmount DECIMAL(10,2) NOT NULL,
                    TotalAmount DECIMAL(10,2) NOT NULL,
                    Status VARCHAR(30) NOT NULL DEFAULT 'Placed',
                    CancellationReason TEXT NULL,
                    OrderDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    UpdatedAt DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
                    CONSTRAINT fk_order_outlet FOREIGN KEY (OutletId) REFERENCES CanteenOutlets (OutletId)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

                CREATE TABLE IF NOT EXISTS OrderItems (
                    OrderItemId INT AUTO_INCREMENT PRIMARY KEY,
                    OrderId VARCHAR(50) NOT NULL,
                    MenuItemId INT NOT NULL,
                    ItemName VARCHAR(150) NOT NULL,
                    VariantName VARCHAR(100) NULL,
                    UnitPrice DECIMAL(10,2) NOT NULL,
                    Quantity INT NOT NULL DEFAULT 1,
                    TotalPrice DECIMAL(10,2) NOT NULL,
                    CONSTRAINT fk_order_item_order FOREIGN KEY (OrderId) REFERENCES Orders (OrderId) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

                CREATE TABLE IF NOT EXISTS OrderTimelines (
                    TimelineId INT AUTO_INCREMENT PRIMARY KEY,
                    OrderId VARCHAR(50) NOT NULL,
                    Status VARCHAR(30) NOT NULL,
                    Note VARCHAR(500) NULL,
                    Timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_order_timeline_order FOREIGN KEY (OrderId) REFERENCES Orders (OrderId) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

                CREATE TABLE IF NOT EXISTS PaymentTransactions (
                    TransactionId VARCHAR(60) PRIMARY KEY,
                    OrderId VARCHAR(50) NOT NULL,
                    Method VARCHAR(30) NOT NULL DEFAULT 'UPI',
                    Status VARCHAR(20) NOT NULL DEFAULT 'Paid',
                    Amount DECIMAL(10,2) NOT NULL,
                    PaidAt DATETIME NULL,
                    CONSTRAINT fk_payment_order FOREIGN KEY (OrderId) REFERENCES Orders (OrderId) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
                await connection.ExecuteAsync(createOrdersSql);

                // 9. InventoryItems, StockMovements, Suppliers & PurchaseOrders
                const string createInventorySql = @"
                CREATE TABLE IF NOT EXISTS InventoryItems (
                    ItemId INT AUTO_INCREMENT PRIMARY KEY,
                    InstitutionId INT NOT NULL DEFAULT 1,
                    OutletId INT NOT NULL,
                    IngredientName VARCHAR(100) NOT NULL,
                    Category VARCHAR(50) NOT NULL DEFAULT 'Groceries',
                    AvailableQuantity DECIMAL(10,2) NOT NULL DEFAULT 0,
                    Unit VARCHAR(20) NOT NULL DEFAULT 'kg',
                    ReorderLevel DECIMAL(10,2) NOT NULL DEFAULT 10,
                    CostPerUnit DECIMAL(10,2) NOT NULL DEFAULT 0,
                    BatchNumber VARCHAR(50) NULL,
                    ExpiryDate DATE NULL,
                    Status VARCHAR(30) NOT NULL DEFAULT 'In Stock',
                    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    UpdatedAt DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
                    CONSTRAINT fk_inventory_outlet FOREIGN KEY (OutletId) REFERENCES CanteenOutlets (OutletId)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

                CREATE TABLE IF NOT EXISTS StockMovements (
                    MovementId INT AUTO_INCREMENT PRIMARY KEY,
                    ItemId INT NOT NULL,
                    MovementType VARCHAR(30) NOT NULL,
                    Quantity DECIMAL(10,2) NOT NULL,
                    BatchNumber VARCHAR(50) NULL,
                    ExpiryDate DATE NULL,
                    Reference VARCHAR(50) NULL,
                    Reason VARCHAR(500) NOT NULL,
                    PerformedBy VARCHAR(100) NOT NULL,
                    DateTime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_movement_item FOREIGN KEY (ItemId) REFERENCES InventoryItems (ItemId) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

                CREATE TABLE IF NOT EXISTS Suppliers (
                    SupplierId INT AUTO_INCREMENT PRIMARY KEY,
                    InstitutionId INT NOT NULL DEFAULT 1,
                    Name VARCHAR(100) NOT NULL,
                    ContactPerson VARCHAR(100) NULL,
                    Phone VARCHAR(20) NULL,
                    Email VARCHAR(100) NULL,
                    Gstin VARCHAR(50) NULL,
                    FssaiNumber VARCHAR(50) NULL,
                    Status VARCHAR(20) NOT NULL DEFAULT 'Active',
                    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

                CREATE TABLE IF NOT EXISTS PurchaseOrders (
                    PurchaseOrderId INT AUTO_INCREMENT PRIMARY KEY,
                    InstitutionId INT NOT NULL DEFAULT 1,
                    OutletId INT NOT NULL,
                    PoNumber VARCHAR(50) NOT NULL,
                    SupplierId INT NULL,
                    SupplierName VARCHAR(100) NULL,
                    OrderDate DATE NOT NULL,
                    ExpectedDelivery DATE NULL,
                    TotalAmount DECIMAL(10,2) NOT NULL DEFAULT 0,
                    Status VARCHAR(30) NOT NULL DEFAULT 'Submitted',
                    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    UpdatedAt DATETIME NULL ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
                await connection.ExecuteAsync(createInventorySql);

                // 10. FeedbackTickets & History
                const string createFeedbackSql = @"
                CREATE TABLE IF NOT EXISTS FeedbackTickets (
                    TicketId VARCHAR(50) PRIMARY KEY,
                    InstitutionId INT NOT NULL DEFAULT 1,
                    OutletId INT NOT NULL,
                    CustomerName VARCHAR(100) NOT NULL,
                    CustomerRole VARCHAR(50) NULL,
                    CustomerEmail VARCHAR(100) NULL,
                    OrderId VARCHAR(50) NULL,
                    OrderToken VARCHAR(20) NULL,
                    Rating INT NOT NULL DEFAULT 5,
                    ComplaintCategory VARCHAR(100) NOT NULL DEFAULT 'Food Quality & Taste',
                    Comments TEXT NOT NULL,
                    Status VARCHAR(30) NOT NULL DEFAULT 'New',
                    ResolutionNotes TEXT NULL,
                    ResolvedBy VARCHAR(100) NULL,
                    ResolvedAt DATETIME NULL,
                    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_feedback_outlet FOREIGN KEY (OutletId) REFERENCES CanteenOutlets (OutletId)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

                CREATE TABLE IF NOT EXISTS FeedbackHistories (
                    HistoryId INT AUTO_INCREMENT PRIMARY KEY,
                    TicketId VARCHAR(50) NOT NULL,
                    Status VARCHAR(30) NOT NULL,
                    Note VARCHAR(500) NULL,
                    Timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_history_ticket FOREIGN KEY (TicketId) REFERENCES FeedbackTickets (TicketId) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
                await connection.ExecuteAsync(createFeedbackSql);

                // 11. SystemSettings & DsarRequests
                const string createSettingsSql = @"
                CREATE TABLE IF NOT EXISTS SystemSettings (
                    SettingId INT AUTO_INCREMENT PRIMARY KEY,
                    InstitutionId INT NOT NULL DEFAULT 1,
                    Category VARCHAR(50) NOT NULL,
                    SettingKey VARCHAR(100) NOT NULL,
                    SettingValueJson TEXT NOT NULL,
                    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_inst_cat_key (InstitutionId, Category, SettingKey)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

                CREATE TABLE IF NOT EXISTS DsarRequests (
                    RequestId VARCHAR(50) PRIMARY KEY,
                    InstitutionId INT NOT NULL DEFAULT 1,
                    UserName VARCHAR(100) NOT NULL,
                    UserRole VARCHAR(50) NULL,
                    Email VARCHAR(100) NOT NULL,
                    RequestType VARCHAR(100) NOT NULL,
                    Status VARCHAR(30) NOT NULL DEFAULT 'Pending',
                    Notes TEXT NULL,
                    RequestedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FulfilledAt DATETIME NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
                await connection.ExecuteAsync(createSettingsSql);

                // SEEDING DEFAULT DATA IF EMPTY
                // 1. Users
                var adminUser = await connection.QueryFirstOrDefaultAsync<int?>("SELECT UserId FROM Users WHERE Username = 'admin' LIMIT 1;");
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

                    await connection.ExecuteAsync(insertUsersSql, new { AdminHash = adminHash, StaffHash = staffHash, StudentHash = studentHash });
                    logger.LogInformation("Seeded default users (admin, staff, aarav).");
                }

                // 2. Outlets
                var outletCount = await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM CanteenOutlets;");
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

                // 3. Categories
                var catCount = await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM Categories;");
                if (catCount == 0)
                {
                    const string insertCatSql = @"
                    INSERT INTO Categories (InstitutionId, Name, Description, DisplayOrder, Status)
                    VALUES 
                    (1, 'Breakfast & Morning Specials', 'Fresh morning items: Idli, Vada, Poha, Sandwiches and Parathas', 1, 'Active'),
                    (1, 'South Indian Tiffin & Dosas', 'Crispy Masala Dosas, Uttapams, and traditional sambar-chutney combos', 2, 'Active'),
                    (1, 'Executive Lunch & Thali Meals', 'Wholesome North & South Indian meals, mini-thalis, dal, rice, roti', 3, 'Active'),
                    (1, 'Quick Snacks & Chaat', 'Evening tea-time snacks: Samosa, Kachori, Pav Bhaji and rolls', 4, 'Active'),
                    (1, 'Hot & Cold Beverages', 'Filter coffee, masala chai, fresh fruit juices and lassi', 5, 'Active');";
                    await connection.ExecuteAsync(insertCatSql);
                    logger.LogInformation("Seeded 5 default food categories.");
                }

                // 4. MenuItems
                var menuCount = await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM MenuItems;");
                if (menuCount == 0)
                {
                    const string insertMenuSql = @"
                    INSERT INTO MenuItems (InstitutionId, OutletId, CategoryId, Code, Name, Description, FoodType, Price, DailyCapacity, RemainingCapacity, Availability, Status, PublicationStatus, ServingSize, Calories, AllergensJson, WorkingDaysJson, StartTime, EndTime, HistoricalOrderCount)
                    VALUES 
                    (1, 1, 3, 'PBM-01', 'Paneer Butter Masala Combo', 'Cottage cheese cubes simmered in rich creamy tomato gravy, served with naan or jeera rice.', 'Veg', 120.00, 120, 85, 'Available', 'Active', 'Published', '1 Plate (350g)', '480 kcal', '[""Dairy / Milk""]', '[""Monday"",""Tuesday"",""Wednesday"",""Thursday"",""Friday"",""Saturday""]', '11:30', '15:30', 412),
                    (1, 1, 3, 'SIT-02', 'South Indian Thali Special', 'Traditional campus thali with rice, sambar, rasam, kootu, poriyal, curd, appalam, sweet.', 'Veg', 90.00, 200, 140, 'Available', 'Active', 'Published', '1 Full Thali', '560 kcal', '[""Mustard""]', '[""Monday"",""Tuesday"",""Wednesday"",""Thursday"",""Friday"",""Saturday""]', '11:30', '15:00', 890),
                    (1, 1, 1, 'MID-03', 'Steamed Idli Sambar (3 pcs)', 'Soft fluffy steamed rice cakes served with steaming hot vegetable sambar and coconut chutney.', 'Veg', 40.00, 150, 60, 'Available', 'Active', 'Published', '3 Pieces', '220 kcal', '[]', '[""Monday"",""Tuesday"",""Wednesday"",""Thursday"",""Friday"",""Saturday""]', '07:30', '11:30', 620),
                    (1, 1, 2, 'CMD-04', 'Crispy Masala Dosa', 'Golden brown fermented crepe stuffed with spiced potato masala and served with 3 chutneys.', 'Veg', 65.00, 120, 45, 'Available', 'Active', 'Published', '1 Dosa', '340 kcal', '[]', '[""Monday"",""Tuesday"",""Wednesday"",""Thursday"",""Friday"",""Saturday""]', '07:30', '21:00', 740),
                    (1, 1, 5, 'FMC-05', 'South Indian Filter Coffee', 'Freshly brewed aromatic chicory blend with frothy whole milk.', 'Veg', 20.00, 300, 210, 'Available', 'Active', 'Published', '1 Cup (150ml)', '90 kcal', '[""Dairy / Milk""]', '[""Monday"",""Tuesday"",""Wednesday"",""Thursday"",""Friday"",""Saturday""]', '07:30', '21:00', 1240);";
                    await connection.ExecuteAsync(insertMenuSql);
                    logger.LogInformation("Seeded default menu items.");
                }

                // 5. Slots
                var slotCount = await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM Slots;");
                if (slotCount == 0)
                {
                    const string insertSlotsSql = @"
                    INSERT INTO Slots (InstitutionId, OutletId, Session, Date, StartTime, EndTime, MaxCapacity, BookedOrders, Status)
                    VALUES 
                    (1, 1, 'Breakfast', CURRENT_DATE, '08:00 AM', '09:00 AM', 60, 24, 'Open'),
                    (1, 1, 'Lunch', CURRENT_DATE, '12:30 PM', '01:30 PM', 100, 85, 'Fast Filling'),
                    (1, 1, 'Lunch', CURRENT_DATE, '01:30 PM', '02:30 PM', 80, 32, 'Open'),
                    (1, 1, 'Evening Snacks', CURRENT_DATE, '04:30 PM', '05:30 PM', 50, 15, 'Open');";
                    await connection.ExecuteAsync(insertSlotsSql);
                    logger.LogInformation("Seeded default time slots.");
                }

                // 6. Orders
                var orderCount = await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM Orders;");
                if (orderCount == 0)
                {
                    const string insertOrderSql = @"
                    INSERT INTO Orders (OrderId, InstitutionId, OutletId, SlotId, Token, CustomerName, CustomerRole, RollNo, Department, CustomerPhone, CustomerEmail, Subtotal, TaxAmount, TotalAmount, Status, OrderDate)
                    VALUES 
                    ('ORD-2026-8910', 1, 1, 2, 'T-101', 'Aarav Mehta', 'Student', '2023-CSE-042', 'Computer Science', '+91 98765 43210', 'aarav.mehta@students.apexinstitute.edu', 150.00, 7.50, 157.50, 'Ready for Pickup', UTC_TIMESTAMP()),
                    ('ORD-2026-8911', 1, 1, 2, 'T-102', 'Dr. Sunita Rao', 'Faculty', 'FAC-BIO-012', 'Biotechnology', '+91 98450 11223', 'sunita.rao@faculty.apexinstitute.edu', 90.00, 4.50, 94.50, 'Preparing', UTC_TIMESTAMP()),
                    ('ORD-2026-8912', 1, 1, 2, 'T-103', 'Kavita Singh', 'Student', '2022-MECH-019', 'Mechanical', '+91 98123 45678', 'kavita.singh@students.apexinstitute.edu', 65.00, 3.25, 68.25, 'Accepted', UTC_TIMESTAMP());

                    INSERT INTO OrderItems (OrderId, MenuItemId, ItemName, VariantName, UnitPrice, Quantity, TotalPrice)
                    VALUES 
                    ('ORD-2026-8910', 1, 'Paneer Butter Masala Combo', 'With Butter Naan (2 pcs)', 120.00, 1, 120.00),
                    ('ORD-2026-8910', 5, 'South Indian Filter Coffee', NULL, 20.00, 1, 20.00),
                    ('ORD-2026-8911', 2, 'South Indian Thali Special', NULL, 90.00, 1, 90.00),
                    ('ORD-2026-8912', 4, 'Crispy Masala Dosa', NULL, 65.00, 1, 65.00);

                    INSERT INTO OrderTimelines (OrderId, Status, Note, Timestamp)
                    VALUES 
                    ('ORD-2026-8910', 'Placed', 'Order placed via student portal', UTC_TIMESTAMP()),
                    ('ORD-2026-8910', 'Accepted', 'Counter accepted order', UTC_TIMESTAMP()),
                    ('ORD-2026-8910', 'Preparing', 'Live cooking started at Station 1', UTC_TIMESTAMP()),
                    ('ORD-2026-8910', 'Ready for Pickup', 'Token T-101 flashed on Pickup Display', UTC_TIMESTAMP());

                    INSERT INTO PaymentTransactions (TransactionId, OrderId, Method, Status, Amount, PaidAt)
                    VALUES 
                    ('TXN-WAL-994101', 'ORD-2026-8910', 'Campus Wallet', 'Paid', 157.50, UTC_TIMESTAMP()),
                    ('TXN-UPI-882102', 'ORD-2026-8911', 'UPI', 'Paid', 94.50, UTC_TIMESTAMP()),
                    ('TXN-CRD-771103', 'ORD-2026-8912', 'Card / Net Banking', 'Paid', 68.25, UTC_TIMESTAMP());";

                    await connection.ExecuteAsync(insertOrderSql);
                    logger.LogInformation("Seeded default active orders.");
                }

                // 7. InventoryItems
                var invCount = await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM InventoryItems;");
                if (invCount == 0)
                {
                    const string insertInvSql = @"
                    INSERT INTO InventoryItems (InstitutionId, OutletId, IngredientName, Category, AvailableQuantity, Unit, ReorderLevel, CostPerUnit, Status)
                    VALUES 
                    (1, 1, 'Fresh Paneer (Malai Cubes)', 'Dairy', 14.50, 'kg', 10.00, 320.00, 'In Stock'),
                    (1, 1, 'Sona Masoori Raw Rice', 'Grains', 150.00, 'kg', 50.00, 52.00, 'In Stock'),
                    (1, 1, 'Cooking Oil (Refined Sunflower)', 'Oils', 8.00, 'liters', 15.00, 135.00, 'Low Stock'),
                    (1, 1, 'Fresh Full Cream Milk', 'Dairy', 45.00, 'liters', 20.00, 60.00, 'In Stock'),
                    (1, 1, 'Toor Dal (Pigeon Pea)', 'Pulses', 25.00, 'kg', 15.00, 160.00, 'In Stock');";
                    await connection.ExecuteAsync(insertInvSql);
                    logger.LogInformation("Seeded default inventory ingredients.");
                }

                // 8. Feedback
                var fbCount = await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM FeedbackTickets;");
                if (fbCount == 0)
                {
                    const string insertFbSql = @"
                    INSERT INTO FeedbackTickets (TicketId, InstitutionId, OutletId, CustomerName, CustomerRole, CustomerEmail, OrderId, OrderToken, Rating, ComplaintCategory, Comments, Status, CreatedAt)
                    VALUES 
                    ('FB-2026-041', 1, 1, 'Aarav Mehta', 'Student (CSE 3rd Yr)', 'aarav.mehta@students.apexinstitute.edu', 'ORD-2026-8910', 'T-101', 4, 'Food Quality & Taste', 'Paneer combo was fresh and warm. Prompt service at Station 1.', 'Resolved', UTC_TIMESTAMP()),
                    ('FB-2026-042', 1, 1, 'Dr. Sunita Rao', 'Faculty (Biotechnology)', 'sunita.rao@faculty.apexinstitute.edu', 'ORD-2026-8911', 'T-102', 5, 'Hygiene & Cleanliness', 'Thali presentation and dining counter cleanliness were exemplary.', 'New', UTC_TIMESTAMP());";
                    await connection.ExecuteAsync(insertFbSql);
                    logger.LogInformation("Seeded default feedback tickets.");
                }

                // 9. SystemSettings
                var settingCount = await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM SystemSettings;");
                if (settingCount == 0)
                {
                    const string insertSettingsSql = @"
                    INSERT INTO SystemSettings (InstitutionId, Category, SettingKey, SettingValueJson, UpdatedAt)
                    VALUES 
                    (1, 'Outlet', 'General', '{\""autoExpireUnpaidMinutes\"":10,\""pickupHoldMinutes\"":30,\""cancellationPolicy\"":\""UntilAccepted\"",\""operatingHoursStart\"":\""07:30\"",\""operatingHoursEnd\"":\""21:30\"",\""maintenanceMode\"":false}', UTC_TIMESTAMP()),
                    (1, 'Payment', 'General', '{\""allowUpi\"":true,\""allowCards\"":true,\""allowWallet\"":true,\""allowCash\"":true,\""minOrderAmount\"":10.00,\""gstPercent\"":5.0}', UTC_TIMESTAMP()),
                    (1, 'OrderRules', 'General', '{\""maxItemsPerOrder\"":8,\""maxQuantityPerItem\"":4,\""preOrderWindowHours\"":24,\""restrictDuringClassHours\"":false}', UTC_TIMESTAMP()),
                    (1, 'Privacy', 'General', '{\""retentionPeriodDays\"":2555,\""anonymizeOnErasure\"":true}', UTC_TIMESTAMP());";
                    await connection.ExecuteAsync(insertSettingsSql);

                    const string insertDsarSql = @"
                    INSERT INTO DsarRequests (RequestId, InstitutionId, UserName, UserRole, Email, RequestType, Status, Notes, RequestedAt)
                    VALUES 
                    ('DSAR-2026-081', 1, 'Rohit Verma', 'Student Alumnus', 'rohit.v@alumni.edu', 'Right to Erasure / De-identification', 'Pending', 'Graduated batch 2025; requested identity erasure under DPDP Act.', UTC_TIMESTAMP());";
                    await connection.ExecuteAsync(insertDsarSql);
                    logger.LogInformation("Seeded default system settings and DSAR requests.");
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
