-- ==============================================================================
-- 06_sp_Outlets.sql
-- Stored Procedures for Canteen Outlet Aggregations & Status Statistics.
-- ==============================================================================

-- 1. High-Performance Outlet Count Statistics
DROP PROCEDURE IF EXISTS sp_GetCanteenOutletStats;
DELIMITER $$
CREATE PROCEDURE sp_GetCanteenOutletStats(
    IN p_InstitutionId INT
)
BEGIN
    SELECT 
        COUNT(*) AS TotalOutlets,
        COALESCE(SUM(CASE WHEN Status = 'Active' THEN 1 ELSE 0 END), 0) AS ActiveOutlets,
        COALESCE(SUM(CASE WHEN Status != 'Active' THEN 1 ELSE 0 END), 0) AS InactiveOutlets,
        0 AS TotalMenuItems,
        0 AS OrdersToday,
        0.00 AS RevenueToday
    FROM CanteenOutlets
    WHERE InstitutionId = p_InstitutionId;
END $$
DELIMITER ;
