-- ==============================================================================
-- 01_SeedData.sql
-- Baseline Seed Data for Canteen Management System (canteen_db)
-- ==============================================================================

-- 1. Default Users (Admin, Staff, Student)
INSERT INTO Users (InstitutionId, Username, Email, PasswordHash, FullName, Role, PhoneNumber, IsActive, CreatedAt)
SELECT 1, 'admin', 'admin@canteen.edu', '$2a$11$s1QyE9z0L.V.vF2H7Wl.wO0ZJ8nEa/k1sB2z0X3c4v5b6n7m8l9k0', 'Mrs. Sunitha (Canteen Admin)', 'Admin', '+91 98765 43210', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'admin');

INSERT INTO Users (InstitutionId, Username, Email, PasswordHash, FullName, Role, PhoneNumber, IsActive, CreatedAt)
SELECT 1, 'staff', 'ravi.staff@canteen.edu', '$2a$11$s1QyE9z0L.V.vF2H7Wl.wO0ZJ8nEa/k1sB2z0X3c4v5b6n7m8l9k0', 'Ravi (Kitchen & Counter Staff)', 'Staff', '+91 98765 43211', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'staff');

INSERT INTO Users (InstitutionId, Username, Email, PasswordHash, FullName, Role, PhoneNumber, IsActive, CreatedAt)
SELECT 1, 'aarav', 'aarav.student@git.edu', '$2a$11$s1QyE9z0L.V.vF2H7Wl.wO0ZJ8nEa/k1sB2z0X3c4v5b6n7m8l9k0', 'Aarav (B.Tech 2nd Year)', 'Student', '+91 98765 43212', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'aarav');

-- 2. Default Outlets & Settings
INSERT INTO CanteenOutlets (OutletId, InstitutionId, Code, Name, Location, OpenTime, CloseTime, FssaiLicenseNo, ContactNumber, Status, IsOrderAcceptanceEnabled, WorkingDays, AdminContactJson, CreatedAt)
SELECT 1, 1, 'MC-01', 'Main Canteen', 'Campus Central Building, Ground Floor', '08:00', '16:30', '10022044000123', '+91 40 2345 6789', 'Active', 1, 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday', '{\"name\":\"Mrs. Sunitha\",\"email\":\"admin@canteen.edu\",\"phone\":\"+91 98765 43210\"}', UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM CanteenOutlets WHERE OutletId = 1);

INSERT INTO CanteenOutletSettings (SettingId, OutletId, AutoExpireUnpaidMinutes, PickupHoldMinutes, CancellationPolicy, AllowUpi, AllowCards, AllowWallet, AllowCash, UpdatedAt)
SELECT 1, 1, 10, 30, 'UntilAccepted', 1, 1, 1, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM CanteenOutletSettings WHERE OutletId = 1);

-- 3. Default Food Categories
INSERT INTO Categories (CategoryId, InstitutionId, Name, Description, DisplayOrder, Status)
SELECT 1, 1, 'Breakfast & Morning Specials', 'Fresh morning items: Idli, Vada, Poha, Sandwiches and Parathas', 1, 'Active'
WHERE NOT EXISTS (SELECT 1 FROM Categories WHERE CategoryId = 1);

INSERT INTO Categories (CategoryId, InstitutionId, Name, Description, DisplayOrder, Status)
SELECT 2, 1, 'South Indian Tiffin & Dosas', 'Crispy Masala Dosas, Uttapams, and traditional sambar-chutney combos', 2, 'Active'
WHERE NOT EXISTS (SELECT 1 FROM Categories WHERE CategoryId = 2);

INSERT INTO Categories (CategoryId, InstitutionId, Name, Description, DisplayOrder, Status)
SELECT 3, 1, 'Executive Lunch & Thali Meals', 'Wholesome North & South Indian meals, mini-thalis, dal, rice, roti', 3, 'Active'
WHERE NOT EXISTS (SELECT 1 FROM Categories WHERE CategoryId = 3);

INSERT INTO Categories (CategoryId, InstitutionId, Name, Description, DisplayOrder, Status)
SELECT 4, 1, 'Quick Snacks & Chaat', 'Evening tea-time snacks: Samosa, Kachori, Pav Bhaji and rolls', 4, 'Active'
WHERE NOT EXISTS (SELECT 1 FROM Categories WHERE CategoryId = 4);

INSERT INTO Categories (CategoryId, InstitutionId, Name, Description, DisplayOrder, Status)
SELECT 5, 1, 'Hot & Cold Beverages', 'Filter coffee, masala chai, fresh fruit juices and lassi', 5, 'Active'
WHERE NOT EXISTS (SELECT 1 FROM Categories WHERE CategoryId = 5);

-- 4. Default Menu Items
INSERT INTO MenuItems (MenuItemId, InstitutionId, OutletId, CategoryId, Code, Name, Description, FoodType, Price, DailyCapacity, RemainingCapacity, Availability, Status, PublicationStatus, ServingSize, Calories, AllergensJson, WorkingDaysJson, StartTime, EndTime, HistoricalOrderCount)
SELECT 1, 1, 1, 3, 'PBM-01', 'Paneer Butter Masala Combo', 'Cottage cheese cubes simmered in rich creamy tomato gravy, served with naan or jeera rice.', 'Veg', 120.00, 120, 85, 'Available', 'Active', 'Published', '1 Plate (350g)', '480 kcal', '["Dairy / Milk"]', '["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]', '11:30', '15:30', 412
WHERE NOT EXISTS (SELECT 1 FROM MenuItems WHERE MenuItemId = 1);

INSERT INTO MenuItems (MenuItemId, InstitutionId, OutletId, CategoryId, Code, Name, Description, FoodType, Price, DailyCapacity, RemainingCapacity, Availability, Status, PublicationStatus, ServingSize, Calories, AllergensJson, WorkingDaysJson, StartTime, EndTime, HistoricalOrderCount)
SELECT 2, 1, 1, 3, 'SIT-02', 'South Indian Thali Special', 'Traditional campus thali with rice, sambar, rasam, kootu, poriyal, curd, appalam, sweet.', 'Veg', 90.00, 200, 140, 'Available', 'Active', 'Published', '1 Full Thali', '560 kcal', '["Mustard"]', '["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]', '11:30', '15:00', 890
WHERE NOT EXISTS (SELECT 1 FROM MenuItems WHERE MenuItemId = 2);

INSERT INTO MenuItems (MenuItemId, InstitutionId, OutletId, CategoryId, Code, Name, Description, FoodType, Price, DailyCapacity, RemainingCapacity, Availability, Status, PublicationStatus, ServingSize, Calories, AllergensJson, WorkingDaysJson, StartTime, EndTime, HistoricalOrderCount)
SELECT 3, 1, 1, 1, 'MID-03', 'Steamed Idli Sambar (3 pcs)', 'Soft fluffy steamed rice cakes served with steaming hot vegetable sambar and coconut chutney.', 'Veg', 40.00, 150, 60, 'Available', 'Active', 'Published', '3 Pieces', '220 kcal', '[]', '["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]', '07:30', '11:30', 620
WHERE NOT EXISTS (SELECT 1 FROM MenuItems WHERE MenuItemId = 3);

INSERT INTO MenuItems (MenuItemId, InstitutionId, OutletId, CategoryId, Code, Name, Description, FoodType, Price, DailyCapacity, RemainingCapacity, Availability, Status, PublicationStatus, ServingSize, Calories, AllergensJson, WorkingDaysJson, StartTime, EndTime, HistoricalOrderCount)
SELECT 4, 1, 1, 2, 'CMD-04', 'Crispy Masala Dosa', 'Golden brown fermented crepe stuffed with spiced potato masala and served with 3 chutneys.', 'Veg', 65.00, 120, 45, 'Available', 'Active', 'Published', '1 Dosa', '340 kcal', '[]', '["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]', '07:30', '21:00', 740
WHERE NOT EXISTS (SELECT 1 FROM MenuItems WHERE MenuItemId = 4);

INSERT INTO MenuItems (MenuItemId, InstitutionId, OutletId, CategoryId, Code, Name, Description, FoodType, Price, DailyCapacity, RemainingCapacity, Availability, Status, PublicationStatus, ServingSize, Calories, AllergensJson, WorkingDaysJson, StartTime, EndTime, HistoricalOrderCount)
SELECT 5, 1, 1, 5, 'FMC-05', 'South Indian Filter Coffee', 'Freshly brewed aromatic chicory blend with frothy whole milk.', 'Veg', 20.00, 300, 210, 'Available', 'Active', 'Published', '1 Cup (150ml)', '90 kcal', '["Dairy / Milk"]', '["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]', '07:30', '21:00', 1240
WHERE NOT EXISTS (SELECT 1 FROM MenuItems WHERE MenuItemId = 5);

-- 5. Default Time Slots
INSERT INTO Slots (SlotId, InstitutionId, OutletId, Session, Date, StartTime, EndTime, MaxCapacity, BookedOrders, Status)
SELECT 1, 1, 1, 'Breakfast', CURRENT_DATE, '08:00 AM', '09:00 AM', 60, 24, 'Open'
WHERE NOT EXISTS (SELECT 1 FROM Slots WHERE SlotId = 1);

INSERT INTO Slots (SlotId, InstitutionId, OutletId, Session, Date, StartTime, EndTime, MaxCapacity, BookedOrders, Status)
SELECT 2, 1, 1, 'Lunch', CURRENT_DATE, '12:30 PM', '01:30 PM', 100, 85, 'Fast Filling'
WHERE NOT EXISTS (SELECT 1 FROM Slots WHERE SlotId = 2);

INSERT INTO Slots (SlotId, InstitutionId, OutletId, Session, Date, StartTime, EndTime, MaxCapacity, BookedOrders, Status)
SELECT 3, 1, 1, 'Lunch', CURRENT_DATE, '01:30 PM', '02:30 PM', 80, 32, 'Open'
WHERE NOT EXISTS (SELECT 1 FROM Slots WHERE SlotId = 3);

INSERT INTO Slots (SlotId, InstitutionId, OutletId, Session, Date, StartTime, EndTime, MaxCapacity, BookedOrders, Status)
SELECT 4, 1, 1, 'Evening Snacks', CURRENT_DATE, '04:30 PM', '05:30 PM', 50, 15, 'Open'
WHERE NOT EXISTS (SELECT 1 FROM Slots WHERE SlotId = 4);

-- 6. Baseline Inventory Items
INSERT INTO InventoryItems (ItemId, InstitutionId, OutletId, IngredientName, Category, AvailableQuantity, Unit, ReorderLevel, CostPerUnit, Status)
SELECT 1, 1, 1, 'Fresh Paneer (Malai Cubes)', 'Dairy', 14.50, 'kg', 10.00, 320.00, 'In Stock'
WHERE NOT EXISTS (SELECT 1 FROM InventoryItems WHERE ItemId = 1);

INSERT INTO InventoryItems (ItemId, InstitutionId, OutletId, IngredientName, Category, AvailableQuantity, Unit, ReorderLevel, CostPerUnit, Status)
SELECT 2, 1, 1, 'Sona Masoori Raw Rice', 'Grains', 150.00, 'kg', 50.00, 52.00, 'In Stock'
WHERE NOT EXISTS (SELECT 1 FROM InventoryItems WHERE ItemId = 2);

INSERT INTO InventoryItems (ItemId, InstitutionId, OutletId, IngredientName, Category, AvailableQuantity, Unit, ReorderLevel, CostPerUnit, Status)
SELECT 3, 1, 1, 'Cooking Oil (Refined Sunflower)', 'Oils', 8.00, 'liters', 15.00, 135.00, 'Low Stock'
WHERE NOT EXISTS (SELECT 1 FROM InventoryItems WHERE ItemId = 3);

INSERT INTO InventoryItems (ItemId, InstitutionId, OutletId, IngredientName, Category, AvailableQuantity, Unit, ReorderLevel, CostPerUnit, Status)
SELECT 4, 1, 1, 'Fresh Full Cream Milk', 'Dairy', 45.00, 'liters', 20.00, 60.00, 'In Stock'
WHERE NOT EXISTS (SELECT 1 FROM InventoryItems WHERE ItemId = 4);

INSERT INTO InventoryItems (ItemId, InstitutionId, OutletId, IngredientName, Category, AvailableQuantity, Unit, ReorderLevel, CostPerUnit, Status)
SELECT 5, 1, 1, 'Toor Dal (Pigeon Pea)', 'Pulses', 25.00, 'kg', 15.00, 160.00, 'In Stock'
WHERE NOT EXISTS (SELECT 1 FROM InventoryItems WHERE ItemId = 5);

-- 7. Default System Settings
INSERT INTO SystemSettings (InstitutionId, Category, SettingKey, SettingValueJson, UpdatedAt)
SELECT 1, 'Outlet', 'General', '{\"autoExpireUnpaidMinutes\":10,\"pickupHoldMinutes\":30,\"cancellationPolicy\":\"UntilAccepted\",\"operatingHoursStart\":\"07:30\",\"operatingHoursEnd\":\"21:30\",\"maintenanceMode\":false}', UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM SystemSettings WHERE InstitutionId = 1 AND Category = 'Outlet' AND SettingKey = 'General');

INSERT INTO SystemSettings (InstitutionId, Category, SettingKey, SettingValueJson, UpdatedAt)
SELECT 1, 'Payment', 'General', '{\"allowUpi\":true,\"allowCards\":true,\"allowWallet\":true,\"allowCash\":true,\"minOrderAmount\":10.00,\"gstPercent\":5.0}', UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM SystemSettings WHERE InstitutionId = 1 AND Category = 'Payment' AND SettingKey = 'General');

INSERT INTO SystemSettings (InstitutionId, Category, SettingKey, SettingValueJson, UpdatedAt)
SELECT 1, 'OrderRules', 'General', '{\"maxItemsPerOrder\":8,\"maxQuantityPerItem\":4,\"preOrderWindowHours\":24,\"restrictDuringClassHours\":false}', UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM SystemSettings WHERE InstitutionId = 1 AND Category = 'OrderRules' AND SettingKey = 'General');

INSERT INTO SystemSettings (InstitutionId, Category, SettingKey, SettingValueJson, UpdatedAt)
SELECT 1, 'Privacy', 'General', '{\"retentionPeriodDays\":2555,\"anonymizeOnErasure\":true}', UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM SystemSettings WHERE InstitutionId = 1 AND Category = 'Privacy' AND SettingKey = 'General');

