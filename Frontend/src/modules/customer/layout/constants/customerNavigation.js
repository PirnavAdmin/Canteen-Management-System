import { LayoutDashboard, UtensilsCrossed, ShoppingCart, ClipboardList } from 'lucide-react';

export const CUSTOMER_NAV_GROUPS = [{
  group: 'MAIN MENU',
  items: [
    { id: 'dashboard', label: 'Dashboard', path: '/customer/dashboard', icon: LayoutDashboard },
    { id: 'menu', label: 'Food Menu', path: '/customer/menu', icon: UtensilsCrossed },
    { id: 'cart', label: 'My Cart', path: '/customer/cart', icon: ShoppingCart, showCartBadge: true },
    { id: 'orders', label: 'My Orders', path: '/customer/orders', icon: ClipboardList }
  ]
}];
