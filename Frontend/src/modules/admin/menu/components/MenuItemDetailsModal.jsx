import React from 'react';
import { X, Utensils, MapPin } from 'lucide-react';
import { Button } from '../../../../components/common/Button';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { formatCurrency } from '../../../../utils/formatters';

export const MenuItemDetailsModal = ({ isOpen, onClose, item }) => {
  if (!isOpen || !item) return null;

  const typeColor = item.foodType === 'Veg' ? '#059669' : item.foodType === 'Non-veg' ? '#dc2626' : '#d97706';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 60,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'var(--modal-bg)',
        color: 'var(--text-primary)',
        borderRadius: 'var(--border-radius-xl)',
        maxWidth: '620px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-modal)',
        overflow: 'hidden',
        border: '1px solid var(--border-color)'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '14px',
              height: '14px',
              border: `2px solid ${typeColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1px'
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: typeColor }} />
            </div>

            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {item.name}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Code: {item.code} • {item.category}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Medium Size Dish Photo Showcase */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '210px',
            borderRadius: 'var(--border-radius-lg)',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-muted)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-xs)'
          }}>
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.nextElementSibling) {
                    e.currentTarget.nextElementSibling.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <div style={{
              display: item.imageUrl ? 'none' : 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              backgroundColor: 'var(--bg-muted)',
              color: 'var(--text-muted)',
              gap: '8px'
            }}>
              <Utensils size={36} style={{ opacity: 0.6 }} />
              <span style={{ fontSize: '12px' }}>No dish photo uploaded</span>
            </div>

            {/* Medium image overlay pill with outlet and dietary type */}
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--border-radius-full)',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(4px)',
              color: '#ffffff',
              fontSize: '11.5px',
              fontWeight: 500
            }}>
              <MapPin size={12} style={{ color: '#38bdf8' }} />
              <span>{item.outletName || 'Campus Canteen'}</span>
            </div>

            <div style={{
              position: 'absolute',
              top: '10px',
              right: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--border-radius-full)',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(4px)',
              color: '#ffffff',
              fontSize: '11.5px',
              fontWeight: 600
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: typeColor }} />
              <span>{item.foodType}</span>
            </div>
          </div>

          {/* Price & status highlight banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Base Price
              </span>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-primary)' }}>
                {formatCurrency(item.price)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <StatusBadge status={item.status} />
              <StatusBadge status={item.publicationStatus === 'Published' ? 'Active' : 'Inactive'} label={item.publicationStatus} />
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 4px 0' }}>
              Description
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {item.description || 'No detailed recipe description provided.'}
            </p>
          </div>

          {/* Key metadata grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '12.5px' }}>
            <div style={{ padding: '10px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--border-radius-sm)' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Campus Outlet</span>
              <strong style={{ color: 'var(--text-primary)' }}>{item.outletName || 'Main Dining Hall'}</strong>
            </div>

            <div style={{ padding: '10px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--border-radius-sm)' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Serving Window</span>
              <strong style={{ color: 'var(--text-primary)' }}>{item.startTime || '11:00'} - {item.endTime || '16:00'}</strong>
            </div>

            <div style={{ padding: '10px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--border-radius-sm)' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Daily Portion Capacity</span>
              <strong style={{ color: 'var(--text-primary)' }}>{item.dailyCapacity} portions</strong>
            </div>

            <div style={{ padding: '10px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--border-radius-sm)' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Calories / Portion</span>
              <strong style={{ color: 'var(--text-primary)' }}>{item.calories || 'N/A'} ({item.servingSize || 'Regular'})</strong>
            </div>
          </div>

          {/* Allergens */}
          {item.allergens && item.allergens.length > 0 && (
            <div>
              <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 6px 0' }}>
                Allergen Warnings
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {item.allergens.map(a => (
                  <span
                    key={a}
                    style={{
                      padding: '3px 8px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#991b1b',
                      borderRadius: 'var(--border-radius-sm)',
                      fontSize: '11.5px',
                      fontWeight: 500
                    }}
                  >
                    ⚠️ {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Variants */}
          {item.variants && item.variants.length > 0 && (
            <div>
              <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 6px 0' }}>
                Configured Variants
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {item.variants.map((v, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', padding: '6px 10px', backgroundColor: 'var(--bg-muted)', borderRadius: '4px' }}>
                    <span>{v.name}</span>
                    <strong>{formatCurrency(v.price)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {item.addOns && item.addOns.length > 0 && (
            <div>
              <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 6px 0' }}>
                Add-ons & Extras
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {item.addOns.map((a, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', padding: '6px 10px', backgroundColor: 'var(--bg-muted)', borderRadius: '4px' }}>
                    <span>+ {a.name}</span>
                    <strong>{formatCurrency(a.price)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MenuItemDetailsModal;
