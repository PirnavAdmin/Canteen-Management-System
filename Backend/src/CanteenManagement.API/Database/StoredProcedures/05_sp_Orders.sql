-- ==============================================================================
-- 05_sp_Orders.sql
-- Stored Procedures for Order Processing & Daily Token Generation.
-- ==============================================================================

-- 1. Generate Next Daily Token atomically for an outlet
DROP PROCEDURE IF EXISTS sp_GenerateNextDailyToken;
DELIMITER $$
CREATE PROCEDURE sp_GenerateNextDailyToken(
    IN p_OutletId INT,
    IN p_OrderDate DATE
)
BEGIN
    SELECT CONCAT('T-', 100 + COUNT(1) + 1) AS NextToken
    FROM Orders 
    WHERE OutletId = p_OutletId 
      AND DATE(OrderDate) = p_OrderDate;
END $$
DELIMITER ;

