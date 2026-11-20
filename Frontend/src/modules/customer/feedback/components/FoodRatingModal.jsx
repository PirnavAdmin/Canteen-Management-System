import React, { useState, useEffect } from 'react';
import { Star, X, Check, ThumbsUp, ThumbsDown, Heart, Sparkles, Utensils } from 'lucide-react';
import { SafeImage } from '../../../../components/common/SafeImage';
import { feedbackService } from '../../../admin/feedback/services/feedbackService';

const RATING_LABELS = {
  1: 'Terrible 😞',
  2: 'Poor 😐',
  3: 'Average 🙂',
  4: 'Very Good! 😊',
  5: 'Delicious / Outstanding! 🌟😋'
};

const QUICK_TAGS = [
  'Delicious Taste 😋',
  'Fresh & Hot 🔥',
  'Good Portion 🍱',
  'Fast Service ⚡',
  'Value for Money 💰',
  'Clean Packaging 📦',
  'Authentic Spices 🌶️'
];

export const inMemoryRatedOrderIds = new Set();

export const FoodRatingModal = ({
  isOpen,
  onClose,
  order,
  onFeedbackSubmitted
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState(['Delicious Taste 😋', 'Fresh & Hot 🔥']);
  const [reviewText, setReviewText] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setHoverRating(0);
      setSelectedTags(['Delicious Taste 😋', 'Fresh & Hot 🔥']);
      setReviewText('');
      setWouldRecommend(true);
      setSubmitting(false);
      setSubmitted(false);
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const orderItems = Array.isArray(order?.items) ? order.items : [];
  const primaryItem = orderItems[0] || {
    name: 'Steamed Idli Sambar (2 pcs)',
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80'
  };

  const handleToggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);

    const feedbackPayload = {
      orderId: String(order.id || order.orderId || 'ORD-COMPLETED'),
      customerName: order.customer?.name || 'Student Customer',
      customerEmail: order.customer?.email || 'student@cms.edu',
      rating,
      comment: reviewText.trim()
        ? `${reviewText.trim()} [Tags: ${selectedTags.join(', ')}]`
        : `Customer rated ${rating}/5 stars. Tags: ${selectedTags.join(', ')}`,
      category: 'Food Quality & Taste',
      canteenId: order.outletId || 'canteen-001',
      canteenName: order.outletName || order.canteenName || 'Main Canteen',
      status: 'Open',
      wouldRecommend
    };

    try {
      await feedbackService.create(feedbackPayload).catch(() => null);
    } catch (err) {
      console.warn('Backend feedback log:', err);
    }

    // Mark order as rated in memory
    if (order?.id || order?.orderId) {
      inMemoryRatedOrderIds.add(String(order.id || order.orderId));
    }

    setSubmitting(false);
    setSubmitted(true);

    if (onFeedbackSubmitted) {
      onFeedbackSubmitted(feedbackPayload);
    }

    // Auto-dismiss after 2 seconds
    setTimeout(() => {
      onClose();
    }, 2200);
  };

  const activeRating = hoverRating || rating;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.2)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          position: 'relative',
          animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#fafbfc'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: 800, color: '#0f172a' }}>
              Rate & Review Your Food
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
              Order #{order.id || order.orderId} • {order.outletName || order.canteenName || 'Campus Canteen'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          /* Celebratory Success State */
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#dcfce7',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 4px 14px rgba(22, 163, 74, 0.2)'
            }}>
              <Check size={32} strokeWidth={3} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '19px', fontWeight: 800, color: '#0f172a' }}>
              Thank You for Your Feedback!
            </h3>
            <p style={{ margin: '0 auto 20px', maxWidth: '320px', fontSize: '13.5px', color: '#64748b', lineHeight: 1.5 }}>
              Your review has been shared with the kitchen team to keep serving hot and delicious campus meals.
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 28px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '13.5px',
                cursor: 'pointer'
              }}
            >
              Done
            </button>
          </div>
        ) : (
          /* Rating Form Body */
          <div style={{ padding: '20px 22px', maxHeight: '80vh', overflowY: 'auto' }}>
            {/* Dish Card Summary */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              marginBottom: '18px'
            }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, backgroundColor: '#e2e8f0' }}>
                <SafeImage
                  src={primaryItem.imageUrl}
                  alt={primaryItem.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  fallback={
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                      <Utensils size={18} />
                    </div>
                  }
                />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {primaryItem.name}
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '1px' }}>
                  {orderItems.length > 1 ? `+ ${orderItems.length - 1} more items in this order` : 'Chef prepared dish'}
                </div>
              </div>
            </div>

            {/* Interactive Stars Section */}
            <div style={{ textAlign: 'center', margin: '14px 0 16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                How would you rate the food?
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {[1, 2, 3, 4, 5].map((starNum) => (
                  <button
                    key={starNum}
                    type="button"
                    onClick={() => setRating(starNum)}
                    onMouseEnter={() => setHoverRating(starNum)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      transition: 'transform 0.15s ease'
                    }}
                    onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.85)'; }}
                    onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
                    title={`${starNum} Star${starNum > 1 ? 's' : ''}`}
                  >
                    <Star
                      size={34}
                      fill={starNum <= activeRating ? '#f59e0b' : 'none'}
                      color={starNum <= activeRating ? '#f59e0b' : '#cbd5e1'}
                      strokeWidth={1.8}
                    />
                  </button>
                ))}
              </div>
              <div style={{
                marginTop: '8px',
                fontSize: '13.5px',
                fontWeight: 700,
                color: activeRating >= 4 ? '#15803d' : activeRating === 3 ? '#d97706' : '#dc2626',
                minHeight: '20px'
              }}>
                {RATING_LABELS[activeRating] || 'Tap to rate'}
              </div>
            </div>

            {/* Quick Feedback Chips */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                What did you like?
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                {QUICK_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '999px',
                        border: isSelected ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                        backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                        color: isSelected ? '#1d4ed8' : '#475569',
                        fontSize: '12px',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Written Review Textarea */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                Detailed Feedback (Optional)
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Write a few words about taste, preparation, or kitchen cleanliness..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  color: '#0f172a',
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Would Recommend Pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              backgroundColor: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #f1f5f9',
              marginBottom: '18px'
            }}>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                Would you recommend this dish?
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setWouldRecommend(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: wouldRecommend ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                    backgroundColor: wouldRecommend ? '#dcfce7' : '#ffffff',
                    color: wouldRecommend ? '#15803d' : '#64748b',
                    fontWeight: 700,
                    fontSize: '11.5px',
                    cursor: 'pointer'
                  }}
                >
                  <ThumbsUp size={12} /> Yes
                </button>
                <button
                  type="button"
                  onClick={() => setWouldRecommend(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: !wouldRecommend ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                    backgroundColor: !wouldRecommend ? '#fee2e2' : '#ffffff',
                    color: !wouldRecommend ? '#b91c1c' : '#64748b',
                    fontWeight: 700,
                    fontSize: '11.5px',
                    cursor: 'pointer'
                  }}
                >
                  <ThumbsDown size={12} /> No
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14.5px',
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = '#1d4ed8'; }}
              onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = '#2563eb'; }}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodRatingModal;
