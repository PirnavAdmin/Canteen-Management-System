-- ==============================================================================
-- 01_Tables.sql
-- Complete DDL Schema for Canteen Management System (canteen_db)
-- ==============================================================================

-- 1. Users
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. AuditLogs
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. CanteenOutlets
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. CanteenOutletSettings
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Categories
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. MenuItems
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
    ImageUrl LONGTEXT NULL,
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

-- 7. MenuItemVariants & Addons
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Slots
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Orders
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. InventoryItems, StockMovements, Suppliers & PurchaseOrders
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
    Address VARCHAR(255) NULL,
    SuppliedCategories VARCHAR(255) NULL,
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
    ItemsJson TEXT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. FeedbackTickets & FeedbackHistories
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. SystemSettings & DsarRequests
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

