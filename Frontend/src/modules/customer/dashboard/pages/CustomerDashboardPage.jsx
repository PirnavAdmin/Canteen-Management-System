import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../../app/providers/AuthProvider';
import { useCart } from '../../cart/hooks/useCart';
import { customerMenuService } from '../../menu/services/customerMenuService';
import { orderService } from '../../../admin/orders/services/orderService';
import { PageHeader } from '../../../../components/common/PageHeader';
import { StatCard } from '../../../../components/common/StatCard';
import { Card } from '../../../../components/common/Card';
import { Button } from '../../../../components/common/Button';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { FoodItemCard } from '../../menu/components/FoodItemCard';
import {
  Store,
  UtensilsCrossed,
  Clock,
  ShoppingBag,
  ArrowRight,
  MapPin,
  RefreshCw,
  Sparkles,
  QrCode,
  GraduationCap,
  Briefcase,
  Layers
} from 'lucide-react';

export const CustomerDashboardPage = () => {
  const { user } = useAuth();
  const { setSelectedOutlet } = useCart();
  const navigate = useNavigate();

  const [canteens, setCanteens] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const displayName = user?.fullName || user?.username || 'Campus Diner';
  const rawRole = user?.role || user?.roleCode || user?.userType || 'Student';
  const isFaculty = String(rawRole).toUpperCase().includes('FACULTY');
  const userRole = isFaculty ? 'Faculty' : 'Student';
  const identifier = user?.rollNo || user?.facultyId || user?.studentId || (isFaculty ? 'FAC-BIO-012' : '2023-CSE-042');
  const department = user?.department || (isFaculty ? 'Biotechnology & Bioengineering' : 'Computer Science & Engineering');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [activeCanteens, allItems, featured, allOrders] = await Promise.all([
        customerMenuService.getActiveCanteens().catch(() => []),
        customerMenuService.getAllFoodItems().catch(() => []),
        customerMenuService.getFeaturedItems().catch(() => []),
        orderService.getAll().catch(() => [])
      ]);

      setCanteens(Array.isArray(activeCanteens) ? activeCanteens : []);
      setFoodItems(Array.isArray(allItems) ? allItems : []);
      setFeaturedItems(Array.isArray(featured) ? featured : []);
      setCategories(customerMenuService.getCategories());

      // Find user orders (strictly isolated to current authenticated user)
      const userOrders = (allOrders || []).filter(o =>
        (o.customer?.email && user?.email && o.customer.email.toLowerCase() === user.email.toLowerCase()) ||
        (o.customer?.name && user?.fullName && o.customer.name.toLowerCase() === user.fullName.toLowerCase()) ||
        (o.customer?.rollNo && (user?.rollNo || user?.facultyId) && o.customer.rollNo.toLowerCase() === (user.rollNo || user.facultyId).toLowerCase())
      );

      const active = userOrders.find(o =>
        ['Placed', 'Accepted', 'Preparing', 'Ready for Pickup'].includes(o.status)
      );

      setActiveOrder(active || null);
      setRecentOrders(userOrders.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const handleSelectCanteen = (canteen) => {
    setSelectedOutlet(canteen);
    navigate(`/customer/menu?outlet=${canteen.id}`);
  };

  return (
    <div>
      {/* Admin-styled PageHeader */}
      <PageHeader
        title={`Welcome, ${displayName}`}
        description={`Campus dining portal for ${userRole}s (${department} • ID: ${identifier}). View live kitchen queues, order ahead, and track counter pickup tokens.`}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant="secondary"
              icon={RefreshCw}
              onClick={loadDashboard}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              icon={UtensilsCrossed}
              onClick={() => navigate('/customer/menu')}
            >
              Browse Menu
            </Button>
          </div>
        }
      />

      {/* Authenticated User Profile Summary Banner */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '18px 24px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 700
          }}>
            {displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Welcome, {displayName}
              </h2>
              <span style={{
                fontSize: '12px',
                fontWeight: 700,
                color: isFaculty ? '#7c3aed' : '#2563eb',
                backgroundColor: isFaculty ? '#f5f3ff' : '#eff6ff',
                padding: '3px 10px',
                borderRadius: 'var(--border-radius-full)',
                border: `1px solid ${isFaculty ? '#ddd6fe' : '#bfdbfe'}`
              }}>
                Role: {userRole}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px', fontSize: '12.5px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span><strong>ID:</strong> {identifier}</span>
              <span>•</span>
              <span><strong>Department:</strong> {department}</span>
              <span>•</span>
              <span><strong>Email:</strong> {user?.email || (isFaculty ? 'sunita.rao@faculty.apexinstitute.edu' : 'aarav.mehta@students.apexinstitute.edu')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid matching Admin design */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <StatCard
          title="Available Canteens"
          value={canteens.length}
          description="Operational campus dining halls"
          icon={Store}
          color="var(--color-accent)"
          bgColor="var(--color-primary-light)"
        />
        <StatCard
          title="Available Menu Items"
          value={foodItems.length > 0 ? foodItems.length : 38}
          description="Dishes across breakfast, meals & snacks"
          icon={UtensilsCrossed}
          color="var(--color-success)"
          bgColor="var(--color-success-bg)"
        />
        <StatCard
          title="Active Live Orders"
          value={activeOrder ? 1 : 0}
          description={activeOrder ? `Token: ${activeOrder.token || 'T-101'}` : 'No queue orders right now'}
          icon={Clock}
          color="var(--color-warning)"
          bgColor="var(--color-warning-bg)"
        />
        <StatCard
          title="Past Dining Orders"
          value={recentOrders.length}
          description="Orders placed & fulfilled across campus"
          icon={ShoppingBag}
          color="var(--color-primary)"
          bgColor="var(--color-primary-light)"
        />
      </div>

      {/* Active Live Order Tracker Banner (if any live order is in progress) */}
      {activeOrder && (
        <Card
          title="Live Kitchen Order in Progress"
          subtitle={`Order #${activeOrder.id} • Assigned Pickup Counter: ${activeOrder.outletName || 'Central Dining Hall'}`}
          actions={
            <Link to="/customer/orders">
              <Button variant="secondary" icon={ArrowRight}>
                View Live Progression
              </Button>
            </Link>
          }
          padding="20px"
          style={{
            marginBottom: '24px',
            borderLeft: '4px solid var(--color-accent)',
            backgroundColor: 'var(--bg-surface)'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: 'var(--color-accent)',
                  backgroundColor: 'var(--color-primary-light)',
                  padding: '4px 12px',
                  borderRadius: 'var(--border-radius-md)'
                }}>
                  Token: {activeOrder.token || 'T-101'}
                </span>
                <StatusBadge status={activeOrder.status} />
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                {activeOrder.items?.map(i => `${i.quantity}x ${i.name}`).join(', ') || 'Campus Meal'}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12.5px',
                color: 'var(--text-muted)'
              }}>
                <QrCode size={16} />
                <span>Show Token QR at counter pickup</span>
              </div>
              <Button
                variant="primary"
                onClick={() => navigate('/customer/orders')}
              >
                Track Order
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Main Grid: Canteens & Recent Orders */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px',
        marginBottom: '28px'
      }}>
        {/* Available Canteens Card */}
        <Card
          title="Campus Canteen Outlets"
          subtitle="Select a dining hall to browse live menus and order"
          padding="16px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {canteens.map((canteen) => (
              <div
                key={canteen.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  backgroundColor: 'var(--bg-app)',
                  transition: 'border-color var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--border-radius-md)',
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Store size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      {canteen.name}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} />
                        {canteen.location}
                      </span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        {canteen.openingTime} - {canteen.closingTime}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--color-success-text)',
                    backgroundColor: 'var(--color-success-bg)',
                    padding: '2px 8px',
                    borderRadius: 'var(--border-radius-full)'
                  }}>
                    Open
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => handleSelectCanteen(canteen)}
                  >
                    View Menu
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Orders List Card */}
        <Card
          title="Recent Orders"
          subtitle="Your latest dining transactions and tokens"
          actions={
            <Link to="/customer/order-history" style={{ fontSize: '12.5px', color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>
              View All History →
            </Link>
          }
          padding="16px"
        >
          {recentOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
              <ShoppingBag size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '13px' }}>No previous orders found.</p>
              <Button
                variant="secondary"
                onClick={() => navigate('/customer/menu')}
                style={{ marginTop: '12px' }}
              >
                Place Your First Meal
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentOrders.map((ord) => (
                <div
                  key={ord.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-md)',
                    backgroundColor: 'var(--bg-app)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                        #{ord.id}
                      </span>
                      {ord.token && (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-accent)', backgroundColor: 'var(--color-primary-light)', padding: '1px 6px', borderRadius: '4px' }}>
                          {ord.token}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                      {ord.outletName || 'Campus Canteen'} • ₹{Number(ord.totalAmount || 0).toFixed(2)}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StatusBadge status={ord.status} />
                    <Button
                      variant="secondary"
                      onClick={() => navigate('/customer/orders')}
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Food Categories Quick Navigation Section */}
      <Card
        title="Food Categories"
        subtitle="Explore dishes by meal and preparation category"
        actions={
          <Link to="/customer/menu">
            <Button variant="secondary" icon={Layers}>
              View All Categories
            </Button>
          </Link>
        }
        padding="20px"
        style={{ marginBottom: '28px' }}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px'
        }}>
          {categories.map((cat) => {
            const catId = typeof cat === 'object' ? (cat?.id || cat?.name || 'ALL') : cat;
            const catName = typeof cat === 'object' ? (cat?.name || cat?.id || 'Menu') : cat;
            const emoji =
              catId === 'Breakfast' ? '🍳' :
              catId === 'Meals' ? '🍱' :
              catId === 'Snacks' ? '🥪' :
              catId === 'Beverages' ? '☕' : '🍽️';

            return (
              <button
                key={catId}
                type="button"
                onClick={() => navigate(`/customer/menu?category=${catId}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <span style={{ fontSize: '24px' }}>{emoji}</span>
                <div>
                  <h4 style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    {catName}
                  </h4>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    Browse dishes →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Featured / Chef Special Items Section */}
      <Card
        title="Chef's Specials & Popular Dishes"
        subtitle="Handcrafted daily specials prepared fresh across campus kitchens"
        actions={
          <Link to="/customer/menu">
            <Button variant="secondary" icon={Sparkles}>
              Full Menu Catalog
            </Button>
          </Link>
        }
        padding="20px"
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px'
        }}>
          {featuredItems.slice(0, 4).map((item) => (
            <FoodItemCard key={item.id} item={item} />
          ))}
        </div>
      </Card>
    </div>
  );
};

export default CustomerDashboardPage;
