-- ==============================================================================
-- 02_sp_Reports.sql
-- Stored Procedures for Item-Wise Sales Reports and Daily Outlet Sales Summaries.
-- ==============================================================================

-- 1. Item-Wise Sales Performance Report
DROP PROCEDURE IF EXISTS sp_GetReportItemWise;
DELIMITER $$
CREATE PROCEDURE sp_GetReportItemWise(
    IN p_InstitutionId INT,
    IN p_OutletId INT
)
BEGIN
    SELECT 
        mi.Code AS itemCode,
        mi.Name AS name,
        cat.Name AS category,
        mi.Price AS unitPrice,
        COALESCE(SUM(oi.Quantity), 0) AS qtySold,
        COALESCE(SUM(oi.TotalPrice), 0) AS totalRevenue
    FROM OrderItems oi
    INNER JOIN Orders o ON oi.OrderId = o.OrderId
    INNER JOIN MenuItems mi ON oi.MenuItemId = mi.MenuItemId
    INNER JOIN Categories cat ON mi.CategoryId = cat.CategoryId
    WHERE o.InstitutionId = p_InstitutionId 
      AND o.Status != 'Cancelled'
      AND (p_OutletId IS NULL OR p_OutletId <= 0 OR o.OutletId = p_OutletId)
    GROUP BY mi.Code, mi.Name, cat.Name, mi.Price
    ORDER BY qtySold DESC;
END $$
DELIMITER ;

-- 2. Daily Outlet Sales Summary Report
DROP PROCEDURE IF EXISTS sp_GetReportSalesSummary;
DELIMITER $$
CREATE PROCEDURE sp_GetReportSalesSummary(
    IN p_InstitutionId INT,
    IN p_OutletId INT
)
BEGIN
    SELECT 
        DATE_FORMAT(o.OrderDate, '%Y-%m-%d') AS date,
        co.Name AS outlet,
        COUNT(o.OrderId) AS orders,
        COALESCE(SUM(o.Subtotal), 0) AS grossSales,
        COALESCE(SUM(o.TaxAmount), 0) AS tax,
        COALESCE(SUM(o.TotalAmount), 0) AS netSales
    FROM Orders o
    INNER JOIN CanteenOutlets co ON o.OutletId = co.OutletId
    WHERE o.InstitutionId = p_InstitutionId 
      AND o.Status != 'Cancelled'
      AND (p_OutletId IS NULL OR p_OutletId <= 0 OR o.OutletId = p_OutletId)
    GROUP BY DATE_FORMAT(o.OrderDate, '%Y-%m-%d'), co.Name
    ORDER BY date DESC, grossSales DESC;
END $$
DELIMITER ;
