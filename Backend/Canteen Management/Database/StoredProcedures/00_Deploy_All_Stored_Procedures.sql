-- ==============================================================================
-- 00_Deploy_All_Stored_Procedures.sql
-- Master Deployment Script for all Canteen Management MySQL Stored Procedures.
-- Executes clean DROP IF EXISTS followed by CREATE PROCEDURE for all modules.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- MODULE 1: DASHBOARD STORED PROCEDURES
-- ------------------------------------------------------------------------------

DROP PROCEDURE IF EXISTS sp_GetDashboardSummary;
DELIMITER $$
CREATE PROCEDURE sp_GetDashboardSummary(
    IN p_InstitutionId INT,
    IN p_OutletId INT
)
BEGIN
    SELECT 
        COUNT(1) AS TotalOrders,
        COALESCE(SUM(CASE WHEN DATE(OrderDate) = CURRENT_DATE AND Status != 'Cancelled' THEN TotalAmount ELSE 0 END), 0) AS TodayRevenue,
        COALESCE(SUM(CASE WHEN Status != 'Cancelled' THEN TotalAmount ELSE 0 END), 0) AS TotalSales,
        COALESCE(SUM(CASE WHEN Status IN ('Placed', 'Accepted', 'Preparing', 'Ready for Pickup') THEN 1 ELSE 0 END), 0) AS ActiveOrders,
        COALESCE(SUM(CASE WHEN Status = 'Placed' THEN 1 ELSE 0 END), 0) AS PendingOrders,
        COALESCE(SUM(CASE WHEN Status = 'Accepted' THEN 1 ELSE 0 END), 0) AS AcceptedOrders,
        COALESCE(SUM(CASE WHEN Status = 'Preparing' THEN 1 ELSE 0 END), 0) AS PreparingOrders,
        COALESCE(SUM(CASE WHEN Status = 'Ready for Pickup' THEN 1 ELSE 0 END), 0) AS ReadyForPickup,
        COALESCE(SUM(CASE WHEN Status = 'Completed' THEN 1 ELSE 0 END), 0) AS CompletedOrders,
        COALESCE(SUM(CASE WHEN Status = 'Cancelled' THEN 1 ELSE 0 END), 0) AS CancelledOrders,
        (SELECT COUNT(1) FROM CanteenOutlets WHERE InstitutionId = p_InstitutionId AND Status = 'Active') AS ActiveOutlets
    FROM Orders 
    WHERE InstitutionId = p_InstitutionId 
      AND (p_OutletId IS NULL OR p_OutletId <= 0 OR OutletId = p_OutletId);
END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_GetHourlySales;
DELIMITER $$
CREATE PROCEDURE sp_GetHourlySales(
    IN p_InstitutionId INT,
    IN p_OutletId INT
)
BEGIN
    SELECT 
        DATE_FORMAT(OrderDate, '%H:00') AS Hour,
        COALESCE(SUM(TotalAmount), 0) AS Sales,
        COUNT(1) AS Orders
    FROM Orders
    WHERE InstitutionId = p_InstitutionId 
      AND DATE(OrderDate) = CURRENT_DATE 
      AND Status != 'Cancelled'
      AND (p_OutletId IS NULL OR p_OutletId <= 0 OR OutletId = p_OutletId)
    GROUP BY DATE_FORMAT(OrderDate, '%H:00')
    ORDER BY Hour ASC;
END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_GetLiveOrders;
DELIMITER $$
CREATE PROCEDURE sp_GetLiveOrders(
    IN p_InstitutionId INT,
    IN p_OutletId INT
)
BEGIN
    SELECT 
        o.OrderId,
        o.OrderId AS Id,
        o.Token,
        o.CustomerName,
        o.CustomerName AS Customer,
        o.CustomerRole,
        co.Name AS OutletName,
        co.Code AS OutletCode,
        (SELECT COUNT(1) FROM OrderItems oi WHERE oi.OrderId = o.OrderId) AS ItemCount,
        o.TotalAmount,
        o.TotalAmount AS Total,
        o.Status,
        CONCAT(TIMESTAMPDIFF(MINUTE, o.OrderDate, NOW()), 'm') AS ElapsedTime,
        CONCAT(TIMESTAMPDIFF(MINUTE, o.OrderDate, NOW()), 'm') AS Slot,
        DATE_FORMAT(o.OrderDate, '%h:%i %p') AS OrderTime
    FROM Orders o
    INNER JOIN CanteenOutlets co ON o.OutletId = co.OutletId
    WHERE o.InstitutionId = p_InstitutionId 
      AND o.Status IN ('Placed', 'Accepted', 'Preparing', 'Ready for Pickup')
      AND (p_OutletId IS NULL OR p_OutletId <= 0 OR o.OutletId = p_OutletId)
    ORDER BY o.OrderDate ASC
    LIMIT 20;
END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_GetLiveOrderItems;
DELIMITER $$
CREATE PROCEDURE sp_GetLiveOrderItems(
    IN p_OrderIds TEXT
)
BEGIN
    SELECT 
        OrderId,
        ItemName AS Name,
        Quantity AS Qty,
        UnitPrice AS Price
    FROM OrderItems
    WHERE FIND_IN_SET(OrderId, p_OrderIds) > 0;
END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_GetTopSellingItems;
DELIMITER $$
CREATE PROCEDURE sp_GetTopSellingItems(
    IN p_InstitutionId INT,
    IN p_OutletId INT
)
BEGIN
    SELECT 
        mi.MenuItemId AS Id,
        mi.Code,
        mi.Name,
        cat.Name AS Category,
        mi.FoodType,
        COALESCE(SUM(oi.Quantity), 0) AS Count,
        COALESCE(SUM(oi.Quantity), 0) AS QtySold,
        COALESCE(SUM(oi.TotalPrice), 0) AS Revenue
    FROM OrderItems oi
    INNER JOIN Orders o ON oi.OrderId = o.OrderId
    INNER JOIN MenuItems mi ON oi.MenuItemId = mi.MenuItemId
    INNER JOIN Categories cat ON mi.CategoryId = cat.CategoryId
    WHERE o.InstitutionId = p_InstitutionId 
      AND o.Status != 'Cancelled'
      AND (p_OutletId IS NULL OR p_OutletId <= 0 OR o.OutletId = p_OutletId)
    GROUP BY mi.MenuItemId, mi.Code, mi.Name, cat.Name, mi.FoodType
    ORDER BY QtySold DESC
    LIMIT 5;
END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_GetStockAlerts;
DELIMITER $$
CREATE PROCEDURE sp_GetStockAlerts(
    IN p_InstitutionId INT
)
BEGIN
    SELECT 
        ItemId AS Id,
        ItemId,
        IngredientName AS Ingredient,
        IngredientName,
        'Main Canteen' AS Outlet,
        AvailableQuantity,
        CONCAT(AvailableQuantity, ' ', Unit) AS Available,
        Unit,
        ReorderLevel,
        Status
    FROM InventoryItems
    WHERE InstitutionId = p_InstitutionId 
      AND AvailableQuantity <= ReorderLevel
    ORDER BY AvailableQuantity ASC
    LIMIT 10;
END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_GetOutletSales;
DELIMITER $$
CREATE PROCEDURE sp_GetOutletSales(
    IN p_InstitutionId INT
)
BEGIN
    SELECT 
        co.OutletId,
        co.Name,
        co.Name AS OutletName,
        COUNT(o.OrderId) AS Orders,
        COALESCE(SUM(o.TotalAmount), 0) AS Revenue,
        COALESCE(SUM(o.Subtotal), 0) AS GrossSales,
        COALESCE(SUM(o.TotalAmount), 0) AS NetSales,
        100 AS Percentage
    FROM CanteenOutlets co
    LEFT JOIN Orders o ON co.OutletId = o.OutletId 
                       AND DATE(o.OrderDate) = CURRENT_DATE 
                       AND o.Status != 'Cancelled'
    WHERE co.InstitutionId = p_InstitutionId
    GROUP BY co.OutletId, co.Name
    ORDER BY NetSales DESC;
END $$
DELIMITER ;

-- ------------------------------------------------------------------------------
-- MODULE 2: REPORT STORED PROCEDURES
-- ------------------------------------------------------------------------------

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

-- ------------------------------------------------------------------------------
-- MODULE 3: CATEGORY STORED PROCEDURES
-- ------------------------------------------------------------------------------

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

-- ------------------------------------------------------------------------------
-- MODULE 4: MENU STORED PROCEDURES
-- ------------------------------------------------------------------------------

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

-- ------------------------------------------------------------------------------
-- MODULE 5: ORDER STORED PROCEDURES
-- ------------------------------------------------------------------------------

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

-- ------------------------------------------------------------------------------
-- MODULE 6: OUTLET STORED PROCEDURES
-- ------------------------------------------------------------------------------

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
