-- ==============================================================================
-- 04_sp_Menu.sql
-- Stored Procedures for Menu Management & Order Dependencies.
-- ==============================================================================

-- 1. Get Historical Order Count for Menu Item Deletion Guard
DROP PROCEDURE IF EXISTS sp_GetMenuItemHistoricalOrderCount;
DELIMITER $$
CREATE PROCEDURE sp_GetMenuItemHistoricalOrderCount(
    IN p_MenuItemId INT
)
BEGIN
    SELECT COUNT(1) AS OrderCount 
    FROM OrderItems 
    WHERE MenuItemId = p_MenuItemId;
END $$
DELIMITER ;
