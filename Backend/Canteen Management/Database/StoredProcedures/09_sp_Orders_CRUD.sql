-- ==============================================================================
-- 09_sp_Orders_CRUD.sql
-- Stored Procedures for Orders Management CRUD operations.
-- ==============================================================================

DROP PROCEDURE IF EXISTS sp_GetAllOrders;
DELIMITER $$
CREATE PROCEDURE sp_GetAllOrders(
    IN p_InstitutionId INT,
    IN p_OutletId INT,
    IN p_Status VARCHAR(30),
    IN p_SearchTerm VARCHAR(100)
)
BEGIN
    SELECT 
        o.OrderId,
        o.InstitutionId,
        o.OutletId,
        o.UserId,
        o.SlotId,
        o.Token,
        o.CustomerName,
        o.CustomerRole,
        o.RollNo,
        o.Department,
        o.CustomerPhone,
        o.CustomerEmail,
        o.Subtotal,
        o.TaxAmount,
        o.TotalAmount,
        o.Status,
        o.CancellationReason,
        o.OrderDate,
        o.UpdatedAt,
        co.OutletId,
        co.Name,
        s.SlotId,
        s.StartTime,
        s.EndTime,
        s.Session
    FROM Orders o
    INNER JOIN CanteenOutlets co ON o.OutletId = co.OutletId
    LEFT JOIN Slots s ON o.SlotId = s.SlotId
    WHERE o.InstitutionId = p_InstitutionId
      AND (p_OutletId IS NULL OR p_OutletId <= 0 OR o.OutletId = p_OutletId)
      AND (p_Status IS NULL OR p_Status = '' OR p_Status = 'ALL' OR o.Status = p_Status)
      AND (p_SearchTerm IS NULL OR p_SearchTerm = '' OR LOWER(o.OrderId) LIKE CONCAT('%', LOWER(p_SearchTerm), '%') OR LOWER(o.Token) LIKE CONCAT('%', LOWER(p_SearchTerm), '%') OR LOWER(o.CustomerName) LIKE CONCAT('%', LOWER(p_SearchTerm), '%'))
    ORDER BY o.OrderDate DESC;
END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_GetOrderById;
DELIMITER $$
CREATE PROCEDURE sp_GetOrderById(
    IN p_OrderId VARCHAR(50),
    IN p_InstitutionId INT
)
BEGIN
    -- Main Order
    SELECT 
        o.OrderId,
        o.InstitutionId,
        o.OutletId,
        o.UserId,
        o.SlotId,
        o.Token,
        o.CustomerName,
        o.CustomerRole,
        o.RollNo,
        o.Department,
        o.CustomerPhone,
        o.CustomerEmail,
        o.Subtotal,
        o.TaxAmount,
        o.TotalAmount,
        o.Status,
        o.CancellationReason,
        o.OrderDate,
        o.UpdatedAt,
        co.OutletId,
        co.Name,
        s.SlotId,
        s.StartTime,
        s.EndTime,
        s.Session
    FROM Orders o
    INNER JOIN CanteenOutlets co ON o.OutletId = co.OutletId
    LEFT JOIN Slots s ON o.SlotId = s.SlotId
    WHERE o.OrderId = p_OrderId AND o.InstitutionId = p_InstitutionId
    LIMIT 1;

    -- Order Items
    SELECT OrderItemId, OrderId, MenuItemId, ItemName, VariantName, UnitPrice, Quantity, TotalPrice
    FROM OrderItems
    WHERE OrderId = p_OrderId;

    -- Timeline
    SELECT TimelineId, OrderId, Status, Note, Timestamp
    FROM OrderTimelines
    WHERE OrderId = p_OrderId
    ORDER BY Timestamp ASC;

    -- Payments
    SELECT TransactionId, OrderId, Method, Status, Amount, PaidAt
    FROM PaymentTransactions
    WHERE OrderId = p_OrderId;
END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_UpdateOrderStatus;
DELIMITER $$
CREATE PROCEDURE sp_UpdateOrderStatus(
    IN p_OrderId VARCHAR(50),
    IN p_Status VARCHAR(30),
    IN p_CancellationReason TEXT
)
BEGIN
    UPDATE Orders
    SET Status = p_Status,
        CancellationReason = CASE WHEN p_CancellationReason IS NOT NULL THEN p_CancellationReason ELSE CancellationReason END,
        UpdatedAt = UTC_TIMESTAMP()
    WHERE OrderId = p_OrderId;

    -- Record in Timeline
    INSERT INTO OrderTimelines (OrderId, Status, Note, Timestamp)
    VALUES (p_OrderId, p_Status, CONCAT('Order status transitioned to ', p_Status), UTC_TIMESTAMP());

    -- Return updated order
    SELECT OrderId, InstitutionId, OutletId, Status, CancellationReason, UpdatedAt
    FROM Orders
    WHERE OrderId = p_OrderId;
END $$
DELIMITER ;
