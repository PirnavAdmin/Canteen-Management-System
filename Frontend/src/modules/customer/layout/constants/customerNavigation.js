/**
 * Customer Navigation Links strictly matching Admin UI navigation architecture
 * Single Common Customer Module for Student & Faculty with Dashboard as Landing Page
 */
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingCart,
  ShoppingBag,
  Clock,
  MessageSquareWarning
} from 'lucide-react';

export const CUSTOMER_NAV_GROUPS = [
  {
    group: 'OVERVIEW',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/customer/dashboard',
        icon: LayoutDashboard,
        description: 'Personalized dining portal overview & live status'
      }
    ]
  },
  {
    group: 'FOOD & ORDERING',
    items: [
      {
        id: 'menu',
        label: 'Canteen Menu',
        path: '/customer/menu',
        icon: UtensilsCrossed,
        description: 'Browse campus food items, categories & pricing'
      },
      {
        id: 'cart',
        label: 'My Cart',
        path: '/customer/cart',
        icon: ShoppingCart,
        showCartBadge: true,
        description: 'View selected food tray & checkout'
      },
      {
        id: 'orders',
        label: 'My Orders',
        path: '/customer/orders',
        icon: ShoppingBag,
        description: 'Live order status progression & pickup tokens'
      }
    ]
  },
  {
    group: 'HISTORY & SUPPORT',
    items: [
      {
        id: 'order-history',
        label: 'Order History',
        path: '/customer/order-history',
        icon: Clock,
        description: 'Past dining orders, reorders & receipts'
      },
      {
        id: 'feedback',
        label: 'Feedback',
        path: '/customer/feedback',
        icon: MessageSquareWarning,
        description: 'Rate dining experience & food quality'
      }
    ]
  }
];
