import React from 'react';
import { X, Utensils, MapPin, Clock, Flame, Users } from 'lucide-react';
import { Button } from '../../../../components/common/Button';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { formatCurrency } from '../../../../utils/formatters';
import { SafeImage } from '../../../../components/common/SafeImage';

export const MenuItemDetailsModal = ({ isOpen, onClose, item }) => {
  if (!isOpen || !item) return null;

  const typeColor = item.foodType === 'Veg' ? '#059669' : item.foodType === 'Non-veg' ? '#dc2626' : item.foodType === 'Egg' ? '#d97706' : '#7c3aed';

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
        padding: '16px'
      }}
    >
      <style>{`
        .menu-details-card-container {
          display: flex;
          flex-direction: row;
          max-height: 85vh;
          overflow: hidden;
        }
        .menu-details-image-side {
          flex: 1;
          width: 50%;
          min-width: 300px;
          position: relative;
          background-color: #0f172a;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justifyContent: center;
          overflow: hidden;
        }
        .menu-details-content-side {
          flex: 1;
          width: 50%;
          min-width: 0;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }
        @media (max-width: 768px) {
          .menu-details-card-container {
            flex-direction: column;
            max-height: 90vh;
          }
          .menu-details-image-side {
            width: 100%;
            min-width: 100%;
            height: 250px;
            flex-shrink: 0;
          }
          .menu-details-content-side {
            width: 100%;
          }
        }
      `}</style>

      <div style={{
        backgroundColor: 'var(--modal-bg)',
        color: 'var(--text-primary)',
        borderRadius: 'var(--border-radius-xl)',
        maxWidth: '860px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-modal)',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
        position: 'relative'
      }}>
        {/* Modal Close Button Top-Right Floating */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 10,
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-xs)',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-muted)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <X size={16} />
        </button>

        {/* Responsive Split Container: Left Image, Right Details */}
        <div className="menu-details-card-container">
          {/* Left Side: Recipe Image (50% equal split, accommodates both horizontal and vertical photos) */}
          <div className="menu-details-image-side">
            {item.imageUrl ? (
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {/* Ambient blurred backdrop for seamless edge-to-edge aspect ratio blending */}
                <SafeImage
                  src={item.imageUrl}
                  alt=""
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: '-20px',
                    width: 'calc(100% + 40px)',
                    height: 'calc(100% + 40px)',
                    objectFit: 'cover',
                    filter: 'blur(22px) brightness(0.4)',
                    transform: 'scale(1.15)',
                    pointerEvents: 'none',
                    opacity: 0.85
                  }}
                />
                {/* Main Image: contain ensures 100% of horizontal & vertical images are clearly visible without cropping */}
                <SafeImage
                  src={item.imageUrl}
                  alt={item.name}
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    display: 'block',
                    zIndex: 1,
                    filter: 'drop-shadow(0 4px 16px rgba(0, 0, 0, 0.45))'
                  }}
                  fallback={
                    <div style={{
                      position: 'relative',
                      zIndex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      minHeight: '220px',
                      backgroundColor: 'var(--bg-muted)',
                      color: 'var(--text-muted)',
                      gap: '8px',
                      padding: '24px'
                    }}>
                      <Utensils size={40} style={{ opacity: 0.5 }} />
                      <span style={{ fontSize: '12px', fontWeight: 500 }}>No dish photo available</span>
                    </div>
                  }
                />
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                minHeight: '220px',
                backgroundColor: 'var(--bg-muted)',
                color: 'var(--text-muted)',
                gap: '8px',
                padding: '24px'
              }}>
                <Utensils size={40} style={{ opacity: 0.5 }} />
                <span style={{ fontSize: '12px', fontWeight: 500 }}>No dish photo uploaded</span>
              </div>
            )}

            {/* Badges Overlaid on Image */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 9px',
              borderRadius: 'var(--border-radius-full)',
              backgroundColor: 'rgba(15, 23, 42, 0.78)',
              backdropFilter: 'blur(4px)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 600
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: typeColor }} />
              <span>{item.foodType}</span>
            </div>

            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              right: '12px',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: 'var(--border-radius-md)',
              backgroundColor: 'rgba(15, 23, 42, 0.78)',
              backdropFilter: 'blur(4px)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 500
            }}>
              <MapPin size={13} style={{ color: '#38bdf8', flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.outletName || 'Campus Canteen'}
              </span>
            </div>
          </div>

          {/* Right Side: Dish Specifications & Details */}
          <div className="menu-details-content-side">
            <div style={{
              padding: '22px 24px 18px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              flex: 1
            }}>
              {/* Title & Category Header */}
              <div style={{ paddingRight: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{
                    width: '13px',
                    height: '13px',
                    border: `2px solid ${typeColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1px',
                    flexShrink: 0
                  }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: typeColor }} />
                  </div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                    {item.name}
                  </h2>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Code: <strong style={{ color: 'var(--text-secondary)' }}>{item.code}</strong> • {typeof item.category === 'object' ? (item.category?.name || item.category?.id || '') : (item.category || '')}
                </div>
              </div>

              {/* Price & Status Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: 'var(--bg-app)',
                borderRadius: 'var(--border-radius-md)',
                border: '1px solid var(--border-color)',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                    {Number(item.discountPercent || 0) > 0 ? 'Discounted Price' : 'Base Price'}
                  </span>
                  {Number(item.discountPercent || 0) > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '20px', fontWeight: 800, color: '#16a34a', lineHeight: 1.2 }}>
                        {formatCurrency(Math.round(Number(item.price) * (1 - Number(item.discountPercent) / 100) * 100) / 100)}
                      </span>
                      <span style={{ fontSize: '13px', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                        {formatCurrency(item.price)}
                      </span>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#dc2626', backgroundColor: '#fee2e2', padding: '1px 5px', borderRadius: '4px' }}>
                        -{item.discountPercent}% OFF
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1.2 }}>
                      {formatCurrency(item.price)}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <StatusBadge status={item.status} size="sm" />
                  <StatusBadge
                    status={item.publicationStatus === 'Published' ? 'Active' : 'Inactive'}
                    label={item.publicationStatus}
                    size="sm"
                  />
                </div>
              </div>

              {/* Recipe Description */}
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block', marginBottom: '4px' }}>
                  Description & Recipe Details
                </span>
                <p style={{
                  fontSize: '12.5px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.55,
                  margin: 0,
                  backgroundColor: 'var(--bg-app)',
                  padding: '9px 12px',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--border-color)'
                }}>
                  {item.description || 'No detailed recipe description provided for this item.'}
                </p>
              </div>

              {/* Key Details Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                fontSize: '12px'
              }}>
                <div style={{
                  padding: '8px 10px',
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Clock size={15} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Serving Window</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '12px' }}>
                      {item.startTime || '11:00'} - {item.endTime || '16:00'}
                    </strong>
                  </div>
                </div>

                <div style={{
                  padding: '8px 10px',
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Users size={15} style={{ color: '#0ea5e9', flexShrink: 0 }} />
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Daily Capacity</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '12px' }}>
                      {item.dailyCapacity} portions
                    </strong>
                  </div>
                </div>

                <div style={{
                  padding: '8px 10px',
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Flame size={15} style={{ color: '#f59e0b', flexShrink: 0 }} />
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Energy / Serving</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '12px' }}>
                      {item.calories ? `${item.calories} kcal` : 'N/A'} ({item.servingSize || 'Regular'})
                    </strong>
                  </div>
                </div>

                <div style={{
                  padding: '8px 10px',
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <MapPin size={15} style={{ color: '#8b5cf6', flexShrink: 0 }} />
                  <div style={{ overflow: 'hidden' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Campus Outlet</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                      {item.outletName || 'Main Dining Hall'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Allergen Warnings (if configured) */}
              {item.allergens && item.allergens.length > 0 && (
                <div>
                  <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block', marginBottom: '4px' }}>
                    Allergen Warnings
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {item.allergens.map(a => (
                      <span
                        key={a}
                        style={{
                          padding: '2px 7px',
                          backgroundColor: 'var(--color-danger-bg)',
                          border: '1px solid var(--color-danger-border)',
                          color: 'var(--color-danger-text)',
                          borderRadius: 'var(--border-radius-sm)',
                          fontSize: '11px',
                          fontWeight: 500
                        }}
                      >
                        ⚠️ {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Variants & Addons (if present) */}
              {((item.variants && item.variants.length > 0) || (item.addOns && item.addOns.length > 0)) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                  {item.variants && item.variants.length > 0 && (
                    <div>
                      <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                        Variants
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {item.variants.map((v, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', padding: '4px 8px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                            <span>{v.name}</span>
                            <strong>{formatCurrency(v.price)}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.addOns && item.addOns.length > 0 && (
                    <div>
                      <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                        Add-ons
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {item.addOns.map((a, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', padding: '4px 8px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                            <span>+ {a.name}</span>
                            <strong>{formatCurrency(a.price)}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer with Close Button */}
            <div style={{
              padding: '12px 24px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'flex-end',
              backgroundColor: 'var(--modal-bg)',
              marginTop: 'auto'
            }}>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuItemDetailsModal;
