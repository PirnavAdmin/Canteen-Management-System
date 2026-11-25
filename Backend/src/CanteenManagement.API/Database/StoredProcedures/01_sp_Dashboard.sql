-- ==============================================================================
-- 01_sp_Dashboard.sql
-- Stored Procedures for Dashboard Metrics, Hourly Sales, Kitchen Live Queue,
-- Top Selling Dishes, Stock Alerts, and Outlet Performance.
-- ==============================================================================

-- 1. Summary Metrics for Executive Dashboard
DROP PROCEDURE IF EXISTS sp_GetDashboardSummary;
DELIMITER $$
CREATE PROCEDURE sp_GetDashboardSummary(
    IN p_CampusId INT,
    IN p_OutletId INT
)
BEGIN
    SELECT 
        COUNT(1) AS TotalOrders,
        COALESCE(SUM(CASE WHEN DATE(CONVERT_TZ(OrderDate, '+00:00', '+05:30')) = DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+05:30')) AND Status != 'Cancelled' THEN TotalAmount ELSE 0 END), 0) AS TodayRevenue,
        COALESCE(SUM(CASE WHEN Status != 'Cancelled' THEN TotalAmount ELSE 0 END), 0) AS TotalSales,
        COALESCE(SUM(CASE WHEN Status IN ('Placed', 'Accepted', 'Preparing', 'Ready for Pickup') THEN 1 ELSE 0 END), 0) AS ActiveOrders,
        COALESCE(SUM(CASE WHEN Status = 'Placed' THEN 1 ELSE 0 END), 0) AS PendingOrders,
        COALESCE(SUM(CASE WHEN Status = 'Accepted' THEN 1 ELSE 0 END), 0) AS AcceptedOrders,
        COALESCE(SUM(CASE WHEN Status = 'Preparing' THEN 1 ELSE 0 END), 0) AS PreparingOrders,
        COALESCE(SUM(CASE WHEN Status = 'Ready for Pickup' THEN 1 ELSE 0 END), 0) AS ReadyForPickup,
        COALESCE(SUM(CASE WHEN Status = 'Completed' THEN 1 ELSE 0 END), 0) AS CompletedOrders,
        COALESCE(SUM(CASE WHEN Status = 'Cancelled' THEN 1 ELSE 0 END), 0) AS CancelledOrders,
        (SELECT COUNT(1) FROM CanteenOutlets WHERE CampusId = p_CampusId AND Status = 'Active') AS ActiveOutlets
    FROM Orders 
    WHERE CampusId = p_CampusId 
      AND (p_OutletId IS NULL OR p_OutletId <= 0 OR OutletId = p_OutletId);
END $$
DELIMITER ;

-- 2. Hourly Sales Aggregation for Current Date
DROP PROCEDURE IF EXISTS sp_GetHourlySales;
DELIMITER $$
CREATE PROCEDURE sp_GetHourlySales(
    IN p_CampusId INT,
    IN p_OutletId INT
)
BEGIN
    SELECT 
        DATE_FORMAT(CONVERT_TZ(OrderDate, '+00:00', '+05:30'), '%H:00') AS Hour,
        COALESCE(SUM(TotalAmount), 0) AS Sales,
        COUNT(1) AS Orders
    FROM Orders
    WHERE CampusId = p_CampusId 
      AND DATE(CONVERT_TZ(OrderDate, '+00:00', '+05:30')) = DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+05:30')) 
      AND Status != 'Cancelled'
      AND (p_OutletId IS NULL OR p_OutletId <= 0 OR OutletId = p_OutletId)
    GROUP BY DATE_FORMAT(CONVERT_TZ(OrderDate, '+00:00', '+05:30'), '%H:00')
    ORDER BY Hour ASC;
END $$
DELIMITER ;

-- 3. Live Active Kitchen Orders Queue
DROP PROCEDURE IF EXISTS sp_GetLiveOrders;
DELIMITER $$
CREATE PROCEDURE sp_GetLiveOrders(
    IN p_CampusId INT,
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
        CONCAT(TIMESTAMPDIFF(MINUTE, o.OrderDate, UTC_TIMESTAMP()), 'm') AS ElapsedTime,
        CONCAT(TIMESTAMPDIFF(MINUTE, o.OrderDate, UTC_TIMESTAMP()), 'm') AS Slot,
        DATE_FORMAT(CONVERT_TZ(o.OrderDate, '+00:00', '+05:30'), '%h:%i %p') AS OrderTime
    FROM Orders o
    INNER JOIN CanteenOutlets co ON o.OutletId = co.OutletId
    WHERE o.CampusId = p_CampusId 
      AND (
          o.Status IN ('Placed', 'Accepted', 'Preparing', 'Ready for Pickup')
          OR (DATE(CONVERT_TZ(o.OrderDate, '+00:00', '+05:30')) = DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+05:30')) AND o.Status != 'Cancelled')
      )
      AND (p_OutletId IS NULL OR p_OutletId <= 0 OR o.OutletId = p_OutletId)
    ORDER BY 
        CASE o.Status
            WHEN 'Preparing' THEN 1
            WHEN 'Ready for Pickup' THEN 2
            WHEN 'Accepted' THEN 3
            WHEN 'Placed' THEN 4
            WHEN 'Completed' THEN 5
            ELSE 6
        END,
        o.OrderDate DESC
    LIMIT 20;
END $$
DELIMITER ;

-- 4. Line Items for Live Kitchen Orders
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

-- 5. Top 5 Selling Dishes by Volume and Revenue
DROP PROCEDURE IF EXISTS sp_GetTopSellingItems;
DELIMITER $$
CREATE PROCEDURE sp_GetTopSellingItems(
    IN p_CampusId INT,
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
    WHERE o.CampusId = p_CampusId 
      AND o.Status != 'Cancelled'
      AND (p_OutletId IS NULL OR p_OutletId <= 0 OR o.OutletId = p_OutletId)
    GROUP BY mi.MenuItemId, mi.Code, mi.Name, cat.Name, mi.FoodType
    ORDER BY QtySold DESC
    LIMIT 5;
END $$
DELIMITER ;

-- 6. Low Stock Inventory Alerts
DROP PROCEDURE IF EXISTS sp_GetStockAlerts;
DELIMITER $$
CREATE PROCEDURE sp_GetStockAlerts(
    IN p_CampusId INT
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
    WHERE CampusId = p_CampusId 
      AND AvailableQuantity <= ReorderLevel
    ORDER BY AvailableQuantity ASC
    LIMIT 10;
END $$
DELIMITER ;

-- 7. Canteen Outlet Daily Sales Performance
DROP PROCEDURE IF EXISTS sp_GetOutletSales;
DELIMITER $$
CREATE PROCEDURE sp_GetOutletSales(
    IN p_CampusId INT
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
                       AND DATE(CONVERT_TZ(o.OrderDate, '+00:00', '+05:30')) = DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+05:30')) 
                       AND o.Status != 'Cancelled'
    WHERE co.CampusId = p_CampusId
    GROUP BY co.OutletId, co.Name
    ORDER BY NetSales DESC;
END $$
DELIMITER ;

