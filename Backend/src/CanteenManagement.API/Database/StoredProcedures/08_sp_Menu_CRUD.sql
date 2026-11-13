-- ==============================================================================
-- 08_sp_Menu_CRUD.sql
-- Stored Procedures for Menu Items Management CRUD operations.
-- ==============================================================================

DROP PROCEDURE IF EXISTS sp_GetAllMenuItems;
DELIMITER $$
CREATE PROCEDURE sp_GetAllMenuItems(
    IN p_InstitutionId INT,
    IN p_OutletId INT,
    IN p_CategoryId INT,
    IN p_FoodType VARCHAR(20),
    IN p_Status VARCHAR(20),
    IN p_SearchTerm VARCHAR(100)
)
BEGIN
    SELECT 
        m.MenuItemId,
        m.InstitutionId,
        m.OutletId,
        m.CategoryId,
        m.Code,
        m.Name,
        m.Description,
        m.FoodType,
        m.Price,
        m.DailyCapacity,
        m.RemainingCapacity,
        m.Availability,
        m.Status,
        m.PublicationStatus,
        m.ServingSize,
        m.Calories,
        m.ImageUrl,
        m.AllergensJson,
        m.WorkingDaysJson,
        m.StartTime,
        m.EndTime,
        m.HistoricalOrderCount,
        m.CreatedAt,
        m.UpdatedAt,
        c.CategoryId,
        c.Name,
        co.OutletId,
        co.Name
    FROM MenuItems m
    INNER JOIN Categories c ON m.CategoryId = c.CategoryId
    INNER JOIN CanteenOutlets co ON m.OutletId = co.OutletId
    WHERE m.InstitutionId = p_InstitutionId
      AND (p_OutletId IS NULL OR p_OutletId <= 0 OR m.OutletId = p_OutletId)
      AND (p_CategoryId IS NULL OR p_CategoryId <= 0 OR m.CategoryId = p_CategoryId)
      AND (p_FoodType IS NULL OR p_FoodType = '' OR p_FoodType = 'ALL' OR m.FoodType = p_FoodType)
      AND (p_Status IS NULL OR p_Status = '' OR p_Status = 'ALL' OR m.Status = p_Status)
      AND (p_SearchTerm IS NULL OR p_SearchTerm = '' OR LOWER(m.Name) LIKE CONCAT('%', LOWER(p_SearchTerm), '%') OR LOWER(m.Code) LIKE CONCAT('%', LOWER(p_SearchTerm), '%'))
    ORDER BY m.Code ASC, m.MenuItemId ASC;
END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_GetMenuItemById;
DELIMITER $$
CREATE PROCEDURE sp_GetMenuItemById(
    IN p_MenuItemId INT,
    IN p_InstitutionId INT
)
BEGIN
    SELECT 
        m.MenuItemId,
        m.InstitutionId,
        m.OutletId,
        m.CategoryId,
        m.Code,
        m.Name,
        m.Description,
        m.FoodType,
        m.Price,
        m.DailyCapacity,
        m.RemainingCapacity,
        m.Availability,
        m.Status,
        m.PublicationStatus,
        m.ServingSize,
        m.Calories,
        m.ImageUrl,
        m.AllergensJson,
        m.WorkingDaysJson,
        m.StartTime,
        m.EndTime,
        m.HistoricalOrderCount,
        m.CreatedAt,
        m.UpdatedAt,
        c.CategoryId,
        c.Name,
        co.OutletId,
        co.Name
    FROM MenuItems m
    INNER JOIN Categories c ON m.CategoryId = c.CategoryId
    INNER JOIN CanteenOutlets co ON m.OutletId = co.OutletId
    WHERE m.MenuItemId = p_MenuItemId AND m.InstitutionId = p_InstitutionId
    LIMIT 1;

    -- Variants
    SELECT VariantId, MenuItemId, Name, Price
    FROM MenuItemVariants
    WHERE MenuItemId = p_MenuItemId;

    -- Addons
    SELECT AddonId, MenuItemId, Name, Price
    FROM MenuItemAddons
    WHERE MenuItemId = p_MenuItemId;
END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_CreateMenuItem;
DELIMITER $$
CREATE PROCEDURE sp_CreateMenuItem(
    IN p_InstitutionId INT,
    IN p_OutletId INT,
    IN p_CategoryId INT,
    IN p_Code VARCHAR(30),
    IN p_Name VARCHAR(150),
    IN p_Description TEXT,
    IN p_FoodType VARCHAR(20),
    IN p_Price DECIMAL(10,2),
    IN p_DailyCapacity INT,
    IN p_RemainingCapacity INT,
    IN p_Availability VARCHAR(20),
    IN p_Status VARCHAR(20),
    IN p_PublicationStatus VARCHAR(20),
    IN p_ServingSize VARCHAR(50),
    IN p_Calories VARCHAR(50),
    IN p_ImageUrl LONGTEXT,
    IN p_AllergensJson TEXT,
    IN p_WorkingDaysJson TEXT,
    IN p_StartTime VARCHAR(10),
    IN p_EndTime VARCHAR(10)
)
BEGIN
    INSERT INTO MenuItems (
        InstitutionId, OutletId, CategoryId, Code, Name, Description, FoodType, Price,
        DailyCapacity, RemainingCapacity, Availability, Status, PublicationStatus,
        ServingSize, Calories, ImageUrl, AllergensJson, WorkingDaysJson, StartTime, EndTime, CreatedAt
    )
    VALUES (
        p_InstitutionId, p_OutletId, p_CategoryId, p_Code, p_Name, p_Description, COALESCE(p_FoodType, 'Veg'), p_Price,
        COALESCE(p_DailyCapacity, 100), COALESCE(p_RemainingCapacity, p_DailyCapacity, 100), COALESCE(p_Availability, 'Available'),
        COALESCE(p_Status, 'Active'), COALESCE(p_PublicationStatus, 'Published'), p_ServingSize, p_Calories, p_ImageUrl,
        p_AllergensJson, p_WorkingDaysJson, p_StartTime, p_EndTime, UTC_TIMESTAMP()
    );

    SELECT 
        m.MenuItemId,
        m.InstitutionId,
        m.OutletId,
        co.Name AS OutletName,
        m.CategoryId,
        c.Name AS CategoryName,
        m.Code,
        m.Name,
        m.Description,
        m.FoodType,
        m.Price,
        m.DailyCapacity,
        m.RemainingCapacity,
        m.Availability,
        m.Status,
        m.PublicationStatus,
        m.ServingSize,
        m.Calories,
        m.ImageUrl,
        m.AllergensJson,
        m.WorkingDaysJson,
        m.StartTime,
        m.EndTime,
        m.HistoricalOrderCount,
        m.CreatedAt,
        m.UpdatedAt
    FROM MenuItems m
    INNER JOIN Categories c ON m.CategoryId = c.CategoryId
    INNER JOIN CanteenOutlets co ON m.OutletId = co.OutletId
    WHERE m.MenuItemId = LAST_INSERT_ID();
END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_UpdateMenuItem;
DELIMITER $$
CREATE PROCEDURE sp_UpdateMenuItem(
    IN p_MenuItemId INT,
    IN p_InstitutionId INT,
    IN p_OutletId INT,
    IN p_CategoryId INT,
    IN p_Code VARCHAR(30),
    IN p_Name VARCHAR(150),
    IN p_Description TEXT,
    IN p_FoodType VARCHAR(20),
    IN p_Price DECIMAL(10,2),
    IN p_DailyCapacity INT,
    IN p_RemainingCapacity INT,
    IN p_Availability VARCHAR(20),
    IN p_Status VARCHAR(20),
    IN p_PublicationStatus VARCHAR(20),
    IN p_ServingSize VARCHAR(50),
    IN p_Calories VARCHAR(50),
    IN p_ImageUrl LONGTEXT,
    IN p_AllergensJson TEXT,
    IN p_WorkingDaysJson TEXT,
    IN p_StartTime VARCHAR(10),
    IN p_EndTime VARCHAR(10)
)
BEGIN
    UPDATE MenuItems
    SET OutletId = p_OutletId,
        CategoryId = p_CategoryId,
        Code = p_Code,
        Name = p_Name,
        Description = p_Description,
        FoodType = p_FoodType,
        Price = p_Price,
        DailyCapacity = p_DailyCapacity,
        RemainingCapacity = p_RemainingCapacity,
        Availability = p_Availability,
        Status = p_Status,
        PublicationStatus = p_PublicationStatus,
        ServingSize = p_ServingSize,
        Calories = p_Calories,
        ImageUrl = p_ImageUrl,
        AllergensJson = p_AllergensJson,
        WorkingDaysJson = p_WorkingDaysJson,
        StartTime = p_StartTime,
        EndTime = p_EndTime,
        UpdatedAt = UTC_TIMESTAMP()
    WHERE MenuItemId = p_MenuItemId AND InstitutionId = p_InstitutionId;

    SELECT 
        m.MenuItemId,
        m.InstitutionId,
        m.OutletId,
        co.Name AS OutletName,
        m.CategoryId,
        c.Name AS CategoryName,
        m.Code,
        m.Name,
        m.Description,
        m.FoodType,
        m.Price,
        m.DailyCapacity,
        m.RemainingCapacity,
        m.Availability,
        m.Status,
        m.PublicationStatus,
        m.ServingSize,
        m.Calories,
        m.ImageUrl,
        m.AllergensJson,
        m.WorkingDaysJson,
        m.StartTime,
        m.EndTime,
        m.HistoricalOrderCount,
        m.CreatedAt,
        m.UpdatedAt
    FROM MenuItems m
    INNER JOIN Categories c ON m.CategoryId = c.CategoryId
    INNER JOIN CanteenOutlets co ON m.OutletId = co.OutletId
    WHERE m.MenuItemId = p_MenuItemId;
END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_DeleteMenuItem;
DELIMITER $$
CREATE PROCEDURE sp_DeleteMenuItem(
    IN p_MenuItemId INT,
    IN p_InstitutionId INT
)
BEGIN
    DELETE FROM MenuItems 
    WHERE MenuItemId = p_MenuItemId AND InstitutionId = p_InstitutionId;

    SELECT ROW_COUNT() AS DeletedRows;
END $$
DELIMITER ;
