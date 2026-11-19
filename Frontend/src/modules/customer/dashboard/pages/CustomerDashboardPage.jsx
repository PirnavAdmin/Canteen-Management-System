import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, ShoppingCart, ClipboardList } from 'lucide-react';
import { useAuth } from '../../../../app/providers/AuthProvider';
import { useCustomerMenu } from '../../menu/hooks/useCustomerMenu';
import { FoodItemCard } from '../../menu/components/FoodItemCard';
import { useCart } from '../../cart/hooks/useCart';
import { customerOrderService } from '../../orders/services/customerOrderService';

const card = { background:'#fff', border:'1px solid #cfe9dc', borderRadius:18, padding:18, boxShadow:'0 8px 22px rgba(4,120,87,.08)' };
export const CustomerDashboardPage = () => {
  const { user } = useAuth(); const navigate = useNavigate();
  const { canteens, selectedOutlet, setSelectedOutlet, allFoodItems, selectedCategory, setSelectedCategory } = useCustomerMenu();
  const { cartItems, itemCount, totalAmount, removeFromCart } = useCart();
  const [orders, setOrders] = useState([]);
  useEffect(() => { customerOrderService.getCustomerOrders(user).then(value => setOrders(Array.isArray(value) ? value : [])); }, [user]);
  const menu = allFoodItems.filter(item => (!selectedOutlet || item.outletId === selectedOutlet.id) && (selectedCategory === 'ALL' || item.category === selectedCategory) && item.isPopular).slice(0, 6);
  const active = orders.filter(order => !['Completed','Cancelled','Refunded'].includes(order.status)).slice(0,2);
  const name = user?.fullName || user?.username || 'there';
  return <div style={{ color:'#10231c' }}>
    <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 380px', gap:24 }} className="customer-dashboard-grid">
      <section>
        <div style={{ minHeight:180, borderRadius:22, padding:28, position:'relative', overflow:'hidden', background:'linear-gradient(110deg,#fff3e0,#fffdf8 45%,#c9f2dc)', border:'1px solid #f0e3d2' }}><h1 style={{ margin:'0 0 8px', fontSize:36, color:'#07523c' }}>Good afternoon, {name.split(' ')[0]}!</h1><p style={{ maxWidth:440, fontSize:16, lineHeight:1.5, margin:0 }}>What would you like to eat? Order your campus favourites for quick pickup and secure payment.</p><img src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=700&q=85" alt="Fresh campus meal" style={{ position:'absolute', right:-30, bottom:-45, width:290, height:190, objectFit:'cover', borderRadius:'50%', boxShadow:'0 12px 28px #00633d33' }}/></div>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center', margin:'16px 0' }}><select value={selectedOutlet?.id || ''} onChange={e => setSelectedOutlet(canteens.find(c => String(c.id) === e.target.value) || null)} style={{ padding:'12px 15px', border:'1px solid #cbe6da', borderRadius:12, fontWeight:700, minWidth:220 }} aria-label="Select canteen outlet">{canteens.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><b style={{ padding:'7px 11px', borderRadius:99, background:'#cdfbdc', color:'#08723e', fontSize:12 }}>OPEN NOW</b><span>◷ {selectedOutlet?.openingTime || '--:--'} – {selectedOutlet?.closingTime || '--:--'}</span><Link to="/customer/menu" style={{ color:'#087b58', fontWeight:800, textDecoration:'none' }}>Today’s Menu →</Link></div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(110px,1fr))', gap:10 }}>{['Breakfast','Meals','Snacks','Beverages'].map(category => <button type="button" onClick={() => setSelectedCategory(selectedCategory === category ? 'ALL' : category)} key={category} style={{ border:'1px solid #d4ecdf', borderRadius:99, padding:'12px', cursor:'pointer', fontWeight:800, background:selectedCategory === category ? '#087b58' : '#effaf4', color:selectedCategory === category ? '#fff' : '#10231c' }}>{category}</button>)}</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', margin:'24px 0 14px' }}><h2 style={{ margin:0, fontSize:23 }}><Flame color="#f97316" fill="#f97316" size={24}/> Popular Items</h2><Link to="/customer/menu" style={{ color:'#087b58', fontWeight:800 }}>View all →</Link></div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))', gap:15 }}>{menu.map(item => <FoodItemCard key={item.id} item={item}/>)}</div>
      </section>
      <aside><div style={{...card, marginBottom:20}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h2 style={{fontSize:18,margin:0}}><ShoppingCart size={20}/> My Cart ({itemCount})</h2><button type="button" onClick={() => navigate('/customer/cart')} style={{border:0,background:'none',color:'#e11d48',fontWeight:800,cursor:'pointer'}}>Edit</button></div>{cartItems.slice(0,3).map(item => <div key={item.cartKey} style={{display:'flex',alignItems:'center',gap:9,padding:'10px 0',borderBottom:'1px solid #edf5f0'}}><img src={item.imageUrl} alt="" style={{width:44,height:38,objectFit:'cover',borderRadius:8}}/><strong style={{fontSize:13,flex:1}}>{item.name} × {item.quantity}</strong><strong>₹{Number(item.price * item.quantity).toFixed(0)}</strong><button type="button" onClick={() => removeFromCart(item.cartKey)} style={{border:0,background:'none',color:'#e11d48',cursor:'pointer'}}>×</button></div>)}{itemCount ? <><div style={{display:'flex',justifyContent:'space-between',marginTop:12}}><b>Subtotal</b><b>₹{Number(totalAmount).toFixed(2)}</b></div><Link to="/customer/cart" style={{display:'block',textAlign:'center',textDecoration:'none',background:'#078257',color:'#fff',borderRadius:12,padding:14,marginTop:13,fontWeight:800}}>Proceed to Checkout →</Link></> : <p style={{color:'#668277',fontSize:13,textAlign:'center',padding:16}}>Your cart is ready for a tasty addition.</p>}</div>
      <div style={card}><div style={{display:'flex',justifyContent:'space-between'}}><h2 style={{fontSize:18,margin:0}}><ClipboardList size={20}/> My Orders</h2><Link to="/customer/orders" style={{color:'#087b58',fontWeight:800}}>View all →</Link></div>{active.length ? active.map(order => <div key={order.id} style={{padding:'12px 0',borderTop:'1px solid #edf5f0'}}><b>Order #{order.id}</b><b style={{float:'right'}}>₹{Number(order.totalAmount || 0).toFixed(0)}</b><br/><span style={{fontSize:11,borderRadius:99,padding:'4px 8px',background:'#d9fae5',color:'#08723e',fontWeight:800}}>{order.status}</span><Link to="/customer/orders" style={{float:'right',fontSize:12,color:'#087b58',fontWeight:800}}>Track →</Link></div>) : <p style={{color:'#668277',fontSize:13,textAlign:'center',padding:16}}>No active orders right now.</p>}</div></aside>
    </div>
    <style>{'@media(max-width:1100px){.customer-dashboard-grid{grid-template-columns:1fr!important}}@media(max-width:640px){.customer-dashboard-grid h1{font-size:28px!important}.customer-dashboard-grid section>div:nth-child(3){grid-template-columns:1fr 1fr!important}}'}</style>
  </div>;
};
export default CustomerDashboardPage;
