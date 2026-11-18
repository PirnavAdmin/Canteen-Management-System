-- ==============================================================================
-- 03_sp_Categories.sql
-- Stored Procedures for Category Deletion Dependency Checks & Batch Counts.
-- ==============================================================================

-- 1. Dependency Counts for a Single Category (MenuItems & Historical Orders)
DROP PROCEDURE IF EXISTS sp_GetCategoryDependencyCounts;
DELIMITER $$
CREATE PROCEDURE sp_GetCategoryDependencyCounts(
    IN p_CategoryId INT
)
BEGIN
    SELECT 
        (SELECT COUNT(1) FROM MenuItems WHERE CategoryId = p_CategoryId) AS LinkedItemCount,
        (SELECT COUNT(1) FROM OrderItems oi 
         INNER JOIN MenuItems mi ON oi.MenuItemId = mi.MenuItemId 
         WHERE mi.CategoryId = p_CategoryId) AS HistoricalOrderCount;
END $$
DELIMITER ;

-- 2. Batch Dependency Counts for All Categories in an Institution
DROP PROCEDURE IF EXISTS sp_GetBatchCategoryDependencyCounts;
DELIMITER $$
CREATE PROCEDURE sp_GetBatchCategoryDependencyCounts(
    IN p_InstitutionId INT
)
BEGIN
    SELECT 
        c.CategoryId,
        COUNT(DISTINCT mi.MenuItemId) AS LinkedItemCount,
        COUNT(DISTINCT oi.OrderItemId) AS HistoricalOrderCount
    FROM Categories c
    LEFT JOIN MenuItems mi ON mi.CategoryId = c.CategoryId
    LEFT JOIN OrderItems oi ON oi.MenuItemId = mi.MenuItemId
    WHERE c.InstitutionId = p_InstitutionId
    GROUP BY c.CategoryId;
END $$
DELIMITER ;

