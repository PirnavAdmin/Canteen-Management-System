/**
 * Canteen Staff Module Exports
 */

export { StaffLayout } from './layouts/StaffLayout';
export { StaffHeader } from './layouts/StaffHeader';
export { StaffSidebar } from './layouts/StaffSidebar';
export { StaffProtectedRoute } from './components/StaffProtectedRoute';

export { StaffDashboardPage } from './pages/StaffDashboardPage';
export { StaffOrderBoardPage } from './pages/StaffOrderBoardPage';
export { KitchenDisplayPage } from './pages/KitchenDisplayPage';
export { VerifyPickupPage } from './pages/VerifyPickupPage';
export { StaffInventoryPage } from './pages/StaffInventoryPage';
export { StaffStockDetailsPage } from './pages/StaffStockDetailsPage';
export { StaffExpiryTrackingPage } from './pages/StaffExpiryTrackingPage';
export { StaffStockAlertsPage } from './pages/StaffStockAlertsPage';
export { StaffStockRequestsPage } from './pages/StaffStockRequestsPage';
export { StaffStockRequestHistoryPage } from './pages/StaffStockRequestHistoryPage';
export { StaffProfilePage } from './pages/StaffProfilePage';
export { StaffLoginPage } from './pages/StaffLoginPage';

export { useStaffOrders } from './hooks/useStaffOrders';
export { useStaffInventory } from './hooks/useStaffInventory';
export { staffOrderService } from './services/staffOrderService';
export { staffInventoryService } from './services/staffInventoryService';
