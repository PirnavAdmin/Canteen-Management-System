-- ==============================================================================
-- CANTEEN MANAGEMENT SYSTEM - CATEGORIES MODULE
-- Author: Akshita (Categories Backend)
-- Architecture: 100% Stored Procedures & Dapper (No inline SQL)
-- Database Target: canteen_db (or CollegeManagement)
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `canteen_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `canteen_db`;

-- 1. Table: CanteenCategories
CREATE TABLE IF NOT EXISTS `CanteenCategories` (
    `CategoryId` INT AUTO_INCREMENT PRIMARY KEY,
    `InstitutionId` INT NOT NULL,
    `Name` VARCHAR(100) NOT NULL,
    `Description` VARCHAR(255) NULL,
    `DisplayOrder` INT NOT NULL DEFAULT 0,
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_canteen_categories_inst` (`InstitutionId`),
    INDEX `idx_canteen_categories_active` (`IsActive`),
    UNIQUE KEY `uq_inst_category_name` (`InstitutionId`, `Name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Stored Procedure: sp_GetCanteenCategories
DROP PROCEDURE IF EXISTS `sp_GetCanteenCategories`;
DELIMITER //
CREATE PROCEDURE `sp_GetCanteenCategories`(
    IN p_InstitutionId INT,
    IN p_IsActive TINYINT(1)
)
BEGIN
    SELECT 
        CategoryId,
        InstitutionId,
        Name,
        Description,
        DisplayOrder,
        IsActive,
        CreatedAt,
        UpdatedAt
    FROM CanteenCategories
    WHERE InstitutionId = p_InstitutionId
      AND (p_IsActive IS NULL OR IsActive = p_IsActive)
    ORDER BY DisplayOrder ASC, Name ASC;
END //
DELIMITER ;

-- 3. Stored Procedure: sp_GetCanteenCategoryById
DROP PROCEDURE IF EXISTS `sp_GetCanteenCategoryById`;
DELIMITER //
CREATE PROCEDURE `sp_GetCanteenCategoryById`(
    IN p_CategoryId INT,
    IN p_InstitutionId INT
)
BEGIN
    SELECT 
        CategoryId,
        InstitutionId,
        Name,
        Description,
        DisplayOrder,
        IsActive,
        CreatedAt,
        UpdatedAt
    FROM CanteenCategories
    WHERE CategoryId = p_CategoryId
      AND InstitutionId = p_InstitutionId
    LIMIT 1;
END //
DELIMITER ;

-- 4. Stored Procedure: sp_CreateCanteenCategory
DROP PROCEDURE IF EXISTS `sp_CreateCanteenCategory`;
DELIMITER //
CREATE PROCEDURE `sp_CreateCanteenCategory`(
    IN p_InstitutionId INT,
    IN p_Name VARCHAR(100),
    IN p_Description VARCHAR(255),
    IN p_DisplayOrder INT
)
BEGIN
    INSERT INTO CanteenCategories (
        InstitutionId,
        Name,
        Description,
        DisplayOrder,
        IsActive,
        CreatedAt
    ) VALUES (
        p_InstitutionId,
        TRIM(p_Name),
        TRIM(p_Description),
        COALESCE(p_DisplayOrder, 0),
        1,
        UTC_TIMESTAMP()
    );

    SELECT LAST_INSERT_ID() AS NewCategoryId;
END //
DELIMITER ;

-- 5. Stored Procedure: sp_UpdateCanteenCategory
DROP PROCEDURE IF EXISTS `sp_UpdateCanteenCategory`;
DELIMITER //
CREATE PROCEDURE `sp_UpdateCanteenCategory`(
    IN p_CategoryId INT,
    IN p_InstitutionId INT,
    IN p_Name VARCHAR(100),
    IN p_Description VARCHAR(255),
    IN p_DisplayOrder INT
)
BEGIN
    UPDATE CanteenCategories
    SET 
        Name = TRIM(p_Name),
        Description = TRIM(p_Description),
        DisplayOrder = COALESCE(p_DisplayOrder, DisplayOrder),
        UpdatedAt = UTC_TIMESTAMP()
    WHERE CategoryId = p_CategoryId
      AND InstitutionId = p_InstitutionId;

    SELECT ROW_COUNT() AS AffectedRows;
END //
DELIMITER ;

-- 6. Stored Procedure: sp_ToggleCanteenCategoryStatus
DROP PROCEDURE IF EXISTS `sp_ToggleCanteenCategoryStatus`;
DELIMITER //
CREATE PROCEDURE `sp_ToggleCanteenCategoryStatus`(
    IN p_CategoryId INT,
    IN p_InstitutionId INT,
    IN p_IsActive TINYINT(1)
)
BEGIN
    UPDATE CanteenCategories
    SET 
        IsActive = p_IsActive,
        UpdatedAt = UTC_TIMESTAMP()
    WHERE CategoryId = p_CategoryId
      AND InstitutionId = p_InstitutionId;

    SELECT ROW_COUNT() AS AffectedRows;
END //
DELIMITER ;

-- 7. Stored Procedure: sp_CheckCanteenCategoryNameExists
DROP PROCEDURE IF EXISTS `sp_CheckCanteenCategoryNameExists`;
DELIMITER //
CREATE PROCEDURE `sp_CheckCanteenCategoryNameExists`(
    IN p_InstitutionId INT,
    IN p_Name VARCHAR(100),
    IN p_ExcludeCategoryId INT
)
BEGIN
    SELECT COUNT(*) AS MatchCount
    FROM CanteenCategories
    WHERE InstitutionId = p_InstitutionId
      AND LOWER(Name) = LOWER(TRIM(p_Name))
      AND (p_ExcludeCategoryId IS NULL OR CategoryId != p_ExcludeCategoryId);
END //
DELIMITER ;

-- 8. Stored Procedure: sp_GetCanteenCategoryStats (Top 4 KPI Metric Cards)
DROP PROCEDURE IF EXISTS `sp_GetCanteenCategoryStats`;
DELIMITER //
CREATE PROCEDURE `sp_GetCanteenCategoryStats`(
    IN p_InstitutionId INT
)
BEGIN
    SELECT 
        COUNT(*) AS TotalCategories,
        COUNT(CASE WHEN IsActive = 1 THEN 1 END) AS ActiveCategories,
        0 AS LinkedFoodItems,
        COALESCE(MAX(DisplayOrder), 0) AS DisplayOrderDepth
    FROM CanteenCategories
    WHERE InstitutionId = p_InstitutionId;
END //
DELIMITER ;

-- 9. Stored Procedure: sp_GetNextCategoryDisplayOrder (Auto-fill Next Display Order Rank)
DROP PROCEDURE IF EXISTS `sp_GetNextCategoryDisplayOrder`;
DELIMITER //
CREATE PROCEDURE `sp_GetNextCategoryDisplayOrder`(
    IN p_InstitutionId INT
)
BEGIN
    SELECT COALESCE(MAX(DisplayOrder), 0) + 1 AS NextDisplayOrder
    FROM CanteenCategories
    WHERE InstitutionId = p_InstitutionId;
END //
DELIMITER ;

-- Seed Initial Categories (Optional / Safe)
INSERT INTO `CanteenCategories` (`InstitutionId`, `Name`, `Description`, `DisplayOrder`, `IsActive`, `CreatedAt`)
VALUES 
    (1, 'Breakfast', 'Morning tiffin and fresh breakfast items (8:00 AM - 11:30 AM)', 1, 1, UTC_TIMESTAMP()),
    (1, 'Meals & Thali', 'South Indian & North Indian lunch thalis, rice combos (12:00 PM - 3:00 PM)', 2, 1, UTC_TIMESTAMP()),
    (1, 'Snacks & Chaat', 'Evening hot snacks, samosa, puffs, cutlets, and chaat', 3, 1, UTC_TIMESTAMP()),
    (1, 'Beverages & Juices', 'Hot coffee, tea, milkshakes, fresh fruit juices and cool drinks', 4, 1, UTC_TIMESTAMP()),
    (1, 'Bakery & Desserts', 'Cakes, pastries, ice creams and cookies', 5, 1, UTC_TIMESTAMP())
ON DUPLICATE KEY UPDATE `Description` = VALUES(`Description`);
