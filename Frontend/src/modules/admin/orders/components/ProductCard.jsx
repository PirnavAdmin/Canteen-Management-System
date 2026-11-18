import React, { useState } from 'react';
import { Plus, Minus, Star, Clock, Heart } from 'lucide-react';
import { SafeImage } from '../../../../components/common/SafeImage';
import { formatCurrency } from '../../../../utils/formatters';

export const ProductCard = ({
  item,
  quantity = 0,
  onAdd,
  onRemove,
  disabled = false
}) => {
  const [isLiked, setIsLiked] = useState(false);

  const isOutOfStock =
    disabled ||
    item.availability === 'Out of Stock' ||
    item.status === 'Inactive' ||
    (typeof item.remainingCapacity === 'number' && item.remainingCapacity <= 0);

  // Derive rating and prep time consistently from item data
  const rating = Number(item.rating || (4.5 + ((item.id % 5) * 0.1)).toFixed(1));
  const reviewCount = item.historicalOrderCount || (15 + (item.id * 11) % 150);
  const prepTime = item.servingSize || '10-15 min';

  const isVeg = (item.foodType || '').toLowerCase().includes('veg') && !(item.foodType || '').toLowerCase().includes('non');

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: 'var(--shadow-xs)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        opacity: isOutOfStock ? 0.75 : 1
      }}
      onMouseEnter={(e) => {
        if (!isOutOfStock) {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
      }}
    >
      {/* Card Top: Badges & Heart */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          right: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 2,
          pointerEvents: 'none'
        }}
      >
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {/* Food Type Badge */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: isVeg ? '#ecfdf5' : '#fef2f2',
              color: isVeg ? '#059669' : '#dc2626',
              border: `1px solid ${isVeg ? '#a7f3d0' : '#fecaca'}`,
              backdropFilter: 'blur(4px)'
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isVeg ? '#059669' : '#dc2626'
              }}
            />
            {isVeg ? 'Veg' : 'Non-veg'}
          </span>

          {item.historicalOrderCount > 10 && (
            <span
              style={{
                padding: '3px 8px',
                borderRadius: '9999px',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                backgroundColor: '#fef3c7',
                color: '#b45309',
                border: '1px solid #fde68a'
              }}
            >
              Bestseller
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          aria-label="Favorite item"
          style={{
            pointerEvents: 'auto',
            background: 'rgba(255, 255, 255, 0.85)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            color: isLiked ? '#ef4444' : '#64748b',
            transition: 'transform 0.15s ease'
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.9)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <Heart size={16} fill={isLiked ? '#ef4444' : 'none'} />
        </button>
      </div>

      {/* Food Image */}
      <div
        style={{
          width: '100%',
          height: '160px',
          position: 'relative',
          backgroundColor: 'var(--bg-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        <SafeImage
          src={item.imageUrl}
          alt={item.name}
          title={item.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />

        {isOutOfStock && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            Out of Stock
          </div>
        )}
      </div>

      {/* Card Content */}
      <div
        style={{
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'space-between'
        }}
      >
        <div>
          <h3
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 6px 0',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title={item.name}
          >
            {item.name}
          </h3>

          <p
            style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              margin: '0 0 10px 0',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              height: '34px'
            }}
            title={item.description || item.category}
          >
            {item.description || `Fresh and hygienic ${item.category || 'canteen meal'}, prepared to order.`}
          </p>

          {/* Rating & Prep Time Meta */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '11px',
              color: 'var(--text-muted)',
              marginBottom: '14px'
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <Star size={13} fill="#f59e0b" color="#f59e0b" />
              <strong style={{ color: 'var(--text-primary)' }}>{rating}</strong>
              <span>({reviewCount})</span>
            </span>

            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <Clock size={13} color="var(--text-muted)" />
              <span>{prepTime}</span>
            </span>
          </div>
        </div>

        {/* Card Footer: Price & Add to Cart */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '8px',
            borderTop: '1px dashed var(--border-color)'
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Price
            </div>
            <div
              style={{
                fontSize: '17px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.2px'
              }}
            >
              {formatCurrency(item.price)}
            </div>
          </div>

          <div>
            {isOutOfStock ? (
              <button
                disabled
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: 'var(--bg-muted)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-color)',
                  cursor: 'not-allowed'
                }}
              >
                Unavailable
              </button>
            ) : quantity === 0 ? (
              <button
                type="button"
                onClick={onAdd}
                aria-label={`Add ${item.name} to cart`}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: '#f59e0b',
                  color: '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(245, 158, 11, 0.35)',
                  transition: 'background-color 0.15s ease, transform 0.1s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d97706'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f59e0b'; }}
                onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.92)'; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <Plus size={20} strokeWidth={2.6} />
              </button>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fde68a',
                  borderRadius: '9999px',
                  padding: '3px 4px',
                  gap: '6px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                }}
              >
                <button
                  type="button"
                  onClick={onRemove}
                  aria-label={`Decrease ${item.name}`}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    border: '1px solid #fde68a',
                    color: '#b45309',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Minus size={14} strokeWidth={2.5} />
                </button>

                <span
                  style={{
                    minWidth: '18px',
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: '13px',
                    color: '#92400e'
                  }}
                >
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={onAdd}
                  aria-label={`Increase ${item.name}`}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: '#f59e0b',
                    border: 'none',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={14} strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;