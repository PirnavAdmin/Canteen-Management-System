-- ==============================================================================
-- 07_sp_Inventory_CRUD.sql
-- Stored Procedures for Inventory, Suppliers, Purchase Orders, and Stock Movements.
-- ==============================================================================

-- 1. Suppliers
DROP PROCEDURE IF EXISTS sp_GetSuppliers;
DELIMITER $$
CREATE PROCEDURE sp_GetSuppliers(
    IN p_InstitutionId INT
)
BEGIN
    SELECT SupplierId, InstitutionId, Name, ContactPerson, Phone, Email, Address, SuppliedCategories, Gstin, FssaiNumber, Status, CreatedAt
    FROM Suppliers
    WHERE InstitutionId = p_InstitutionId
    ORDER BY Name ASC;
END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_GetSupplierById;
DELIMITER $$
CREATE PROCEDURE sp_GetSupplierById(
    IN p_SupplierId INT,
    IN p_InstitutionId INT
)
BEGIN
    SELECT SupplierId, InstitutionId, Name, ContactPerson, Phone, Email, Address, SuppliedCategories, Gstin, FssaiNumber, Status, CreatedAt
    FROM Suppliers
    WHERE SupplierId = p_SupplierId AND InstitutionId = p_InstitutionId
    LIMIT 1;
END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_CreateSupplier;
DELIMITER $$
CREATE PROCEDURE sp_CreateSupplier(
    IN p_InstitutionId INT,
    IN p_Name VARCHAR(100),
    IN p_ContactPerson VARCHAR(100),
    IN p_Phone VARCHAR(20),
    IN p_Email VARCHAR(100),
    IN p_Address VARCHAR(255),
    IN p_SuppliedCategories VARCHAR(255),
    IN p_Status VARCHAR(20)
)
BEGIN
    INSERT INTO Suppliers (InstitutionId, Name, ContactPerson, Phone, Email, Address, SuppliedCategories, Status, CreatedAt)
    VALUES (p_InstitutionId, p_Name, p_ContactPerson, p_Phone, p_Email, p_Address, p_SuppliedCategories, COALESCE(p_Status, 'Active'), UTC_TIMESTAMP());
    
    SELECT SupplierId, InstitutionId, Name, ContactPerson, Phone, Email, Address, SuppliedCategories, Gstin, FssaiNumber, Status, CreatedAt
    FROM Suppliers
    WHERE SupplierId = LAST_INSERT_ID();
END $$
DELIMITER ;

-- 2. Purchase Orders
DROP PROCEDURE IF EXISTS sp_GetPurchaseOrders;
DELIMITER $$
CREATE PROCEDURE sp_GetPurchaseOrders(
    IN p_InstitutionId INT,
    IN p_OutletId INT
)
BEGIN
    SELECT 
        po.PurchaseOrderId,
        po.InstitutionId,
        po.OutletId,
        po.PoNumber,
        po.SupplierId,
        COALESCE(po.SupplierName, s.Name, 'Institutional Vendor') AS SupplierName,
        po.OrderDate,
        po.ExpectedDelivery,
        po.TotalAmount,
        po.Status,
        po.ItemsJson,
        po.CreatedAt,
        po.UpdatedAt
    FROM PurchaseOrders po
    LEFT JOIN Suppliers s ON po.SupplierId = s.SupplierId
    WHERE po.InstitutionId = p_InstitutionId
      AND (p_OutletId IS NULL OR p_OutletId <= 0 OR po.OutletId = p_OutletId)
    ORDER BY po.OrderDate DESC, po.PurchaseOrderId DESC;
END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_GetPurchaseOrderById;
DELIMITER $$
CREATE PROCEDURE sp_GetPurchaseOrderById(
    IN p_PurchaseOrderId INT,
    IN p_InstitutionId INT
)
BEGIN
    SELECT 
        po.PurchaseOrderId,
        po.InstitutionId,
        po.OutletId,
        po.PoNumber,
        po.SupplierId,
        COALESCE(po.SupplierName, s.Name, 'Institutional Vendor') AS SupplierName,
        po.OrderDate,
        po.ExpectedDelivery,
        po.TotalAmount,
        po.Status,
        po.ItemsJson,
        po.CreatedAt,
        po.UpdatedAt
    FROM PurchaseOrders po
    LEFT JOIN Suppliers s ON po.SupplierId = s.SupplierId
    WHERE po.PurchaseOrderId = p_PurchaseOrderId AND po.InstitutionId = p_InstitutionId
    LIMIT 1;
END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_CreatePurchaseOrder;
DELIMITER $$
CREATE PROCEDURE sp_CreatePurchaseOrder(
    IN p_InstitutionId INT,
    IN p_OutletId INT,
    IN p_PoNumber VARCHAR(50),
    IN p_SupplierId INT,
    IN p_SupplierName VARCHAR(100),
    IN p_OrderDate DATE,
    IN p_ExpectedDelivery DATE,
    IN p_TotalAmount DECIMAL(10,2),
    IN p_Status VARCHAR(30),
    IN p_ItemsJson TEXT
)
BEGIN
    INSERT INTO PurchaseOrders (InstitutionId, OutletId, PoNumber, SupplierId, SupplierName, OrderDate, ExpectedDelivery, TotalAmount, Status, ItemsJson, CreatedAt)
    VALUES (p_InstitutionId, p_OutletId, p_PoNumber, p_SupplierId, p_SupplierName, COALESCE(p_OrderDate, CURRENT_DATE), p_ExpectedDelivery, p_TotalAmount, COALESCE(p_Status, 'Submitted'), p_ItemsJson, UTC_TIMESTAMP());

    SELECT 
        po.PurchaseOrderId,
        po.InstitutionId,
        po.OutletId,
        po.PoNumber,
        po.SupplierId,
        COALESCE(po.SupplierName, s.Name, 'Institutional Vendor') AS SupplierName,
        po.OrderDate,
        po.ExpectedDelivery,
        po.TotalAmount,
        po.Status,
        po.ItemsJson,
        po.CreatedAt,
        po.UpdatedAt
    FROM PurchaseOrders po
    LEFT JOIN Suppliers s ON po.SupplierId = s.SupplierId
    WHERE po.PurchaseOrderId = LAST_INSERT_ID();
END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_UpdatePurchaseOrderStatus;
DELIMITER $$
CREATE PROCEDURE sp_UpdatePurchaseOrderStatus(
    IN p_PurchaseOrderId INT,
    IN p_Status VARCHAR(30)
)
BEGIN
    UPDATE PurchaseOrders 
    SET Status = p_Status, UpdatedAt = UTC_TIMESTAMP()
    WHERE PurchaseOrderId = p_PurchaseOrderId;
    
    SELECT 
        po.PurchaseOrderId,
        po.InstitutionId,
        po.OutletId,
        po.PoNumber,
        po.SupplierId,
        COALESCE(po.SupplierName, s.Name, 'Institutional Vendor') AS SupplierName,
        po.OrderDate,
        po.ExpectedDelivery,
        po.TotalAmount,
        po.Status,
        po.ItemsJson,
        po.CreatedAt,
        po.UpdatedAt
    FROM PurchaseOrders po
    LEFT JOIN Suppliers s ON po.SupplierId = s.SupplierId
    WHERE po.PurchaseOrderId = p_PurchaseOrderId;
END $$
DELIMITER ;

-- 3. Inventory Items & Stock Movements
DROP PROCEDURE IF EXISTS sp_GetInventoryItems;
DELIMITER $$
CREATE PROCEDURE sp_GetInventoryItems(
    IN p_InstitutionId INT,
    IN p_OutletId INT
)
BEGIN
    SELECT 
        i.ItemId,
        i.InstitutionId,
        i.OutletId,
        i.IngredientName,
        i.Category,
        i.AvailableQuantity,
        i.Unit,
        i.ReorderLevel,
        i.CostPerUnit,
        i.BatchNumber,
        i.ExpiryDate,
        i.Status,
        i.CreatedAt,
        i.UpdatedAt,
        co.OutletId,
        co.Name
    FROM InventoryItems i
    LEFT JOIN CanteenOutlets co ON i.OutletId = co.OutletId
    WHERE i.InstitutionId = p_InstitutionId
      AND (p_OutletId IS NULL OR p_OutletId <= 0 OR i.OutletId = p_OutletId)
    ORDER BY i.IngredientName ASC;
END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_GetInventoryItemById;
DELIMITER $$
CREATE PROCEDURE sp_GetInventoryItemById(
    IN p_ItemId INT,
    IN p_InstitutionId INT
)
BEGIN
    SELECT 
        i.ItemId,
        i.InstitutionId,
        i.OutletId,
        i.IngredientName,
        i.Category,
        i.AvailableQuantity,
        i.Unit,
        i.ReorderLevel,
        i.CostPerUnit,
        i.BatchNumber,
        i.ExpiryDate,
        i.Status,
        i.CreatedAt,
        i.UpdatedAt,
        co.OutletId,
        co.Name
    FROM InventoryItems i
    LEFT JOIN CanteenOutlets co ON i.OutletId = co.OutletId
    WHERE i.ItemId = p_ItemId AND i.InstitutionId = p_InstitutionId
    LIMIT 1;
END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_AddInventoryItem;
DELIMITER $$
CREATE PROCEDURE sp_AddInventoryItem(
    IN p_InstitutionId INT,
    IN p_OutletId INT,
    IN p_IngredientName VARCHAR(100),
    IN p_Category VARCHAR(50),
    IN p_AvailableQuantity DECIMAL(10,2),
    IN p_Unit VARCHAR(20),
    IN p_ReorderLevel DECIMAL(10,2),
    IN p_CostPerUnit DECIMAL(10,2),
    IN p_BatchNumber VARCHAR(50),
    IN p_ExpiryDate DATE,
    IN p_Status VARCHAR(30)
)
BEGIN
    INSERT INTO InventoryItems (InstitutionId, OutletId, IngredientName, Category, AvailableQuantity, Unit, ReorderLevel, CostPerUnit, BatchNumber, ExpiryDate, Status, CreatedAt)
    VALUES (p_InstitutionId, p_OutletId, p_IngredientName, COALESCE(p_Category, 'Groceries'), p_AvailableQuantity, COALESCE(p_Unit, 'kg'), COALESCE(p_ReorderLevel, 10.00), COALESCE(p_CostPerUnit, 0.00), p_BatchNumber, p_ExpiryDate, COALESCE(p_Status, 'In Stock'), UTC_TIMESTAMP());
    
    SELECT ItemId, InstitutionId, OutletId, IngredientName, Category, AvailableQuantity, Unit, ReorderLevel, CostPerUnit, BatchNumber, ExpiryDate, Status, CreatedAt, UpdatedAt
    FROM InventoryItems
    WHERE ItemId = LAST_INSERT_ID();
END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_UpdateInventoryItem;
DELIMITER $$
CREATE PROCEDURE sp_UpdateInventoryItem(
    IN p_ItemId INT,
    IN p_AvailableQuantity DECIMAL(10,2),
    IN p_CostPerUnit DECIMAL(10,2),
    IN p_Status VARCHAR(30)
)
BEGIN
    UPDATE InventoryItems
    SET AvailableQuantity = p_AvailableQuantity,
        CostPerUnit = CASE WHEN p_CostPerUnit > 0 THEN p_CostPerUnit ELSE CostPerUnit END,
        Status = p_Status,
        UpdatedAt = UTC_TIMESTAMP()
    WHERE ItemId = p_ItemId;

    SELECT ItemId, InstitutionId, OutletId, IngredientName, Category, AvailableQuantity, Unit, ReorderLevel, CostPerUnit, BatchNumber, ExpiryDate, Status, CreatedAt, UpdatedAt
    FROM InventoryItems
    WHERE ItemId = p_ItemId;
END $$
DELIMITER ;

-- 4. Stock Movements
DROP PROCEDURE IF EXISTS sp_AddStockMovement;
DELIMITER $$
CREATE PROCEDURE sp_AddStockMovement(
    IN p_ItemId INT,
    IN p_MovementType VARCHAR(30),
    IN p_Quantity DECIMAL(10,2),
    IN p_BatchNumber VARCHAR(50),
    IN p_ExpiryDate DATE,
    IN p_Reference VARCHAR(50),
    IN p_Reason VARCHAR(500),
    IN p_PerformedBy VARCHAR(100)
)
BEGIN
    INSERT INTO StockMovements (ItemId, MovementType, Quantity, BatchNumber, ExpiryDate, Reference, Reason, PerformedBy, DateTime)
    VALUES (p_ItemId, p_MovementType, p_Quantity, p_BatchNumber, p_ExpiryDate, p_Reference, p_Reason, COALESCE(p_PerformedBy, 'Campus Inventory Incharge'), UTC_TIMESTAMP());

    SELECT MovementId, ItemId, MovementType, Quantity, BatchNumber, ExpiryDate, Reference, Reason, PerformedBy, DateTime
    FROM StockMovements
    WHERE MovementId = LAST_INSERT_ID();
END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_GetStockLedger;
DELIMITER $$
CREATE PROCEDURE sp_GetStockLedger(
    IN p_InstitutionId INT,
    IN p_OutletId INT
)
BEGIN
    SELECT 
        sm.MovementId,
        sm.MovementId AS Id,
        sm.ItemId,
        sm.ItemId AS IngredientId,
        sm.MovementType,
        sm.Quantity,
        sm.BatchNumber,
        sm.ExpiryDate,
        sm.Reference,
        sm.Reason,
        sm.PerformedBy,
        sm.DateTime,
        i.ItemId,
        i.IngredientName,
        i.Unit
    FROM StockMovements sm
    INNER JOIN InventoryItems i ON sm.ItemId = i.ItemId
    WHERE i.InstitutionId = p_InstitutionId
      AND (p_OutletId IS NULL OR p_OutletId <= 0 OR i.OutletId = p_OutletId)
    ORDER BY sm.DateTime DESC, sm.MovementId DESC;
END $$
DELIMITER ;
