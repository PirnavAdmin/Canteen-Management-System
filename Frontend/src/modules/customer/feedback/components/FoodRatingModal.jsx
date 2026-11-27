import React, { useState, useEffect } from 'react';
import { Star, X, Check, ThumbsUp, ThumbsDown, Heart, Sparkles, Utensils } from 'lucide-react';
import { SafeImage } from '../../../../components/common/SafeImage';
import { feedbackService } from '../../../admin/feedback/services/feedbackService';
import { customerMenuService } from '../../menu/services/customerMenuService';
import { useAuth } from '../../../../app/providers/AuthProvider';

// Module-level menu image cache
let cachedMenuImages = null;
let menuImagesPromise = null;

const getCachedMenuImages = async () => {
  if (cachedMenuImages) return cachedMenuImages;
  if (!menuImagesPromise) {
    menuImagesPromise = customerMenuService.getAllFoodItems()
      .then((items) => {
        const index = (Array.isArray(items) ? items : []).reduce((acc, item) => {
          const img = item?.imageUrl || item?.image || item?.photo || item?.photoUrl;
          if (!img) return acc;
          if (item.id) acc[`id:${String(item.id)}`] = img;
          if (item.name) acc[`name:${item.name.trim().toLowerCase()}`] = img;
          return acc;
        }, {});
        cachedMenuImages = index;
        return index;
      })
      .catch(() => ({}))
      .finally(() => {
        menuImagesPromise = null;
      });
  }
  return menuImagesPromise;
};

const getCategoryOrNameFallback = (name = '') => {
  const n = String(name || '').toLowerCase();
  if (n.includes('biryani') || n.includes('pulao') || n.includes('rice')) {
    return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80';
  }
  if (n.includes('idly') || n.includes('idli') || n.includes('dosa') || n.includes('vada') || n.includes('sambar') || n.includes('breakfast')) {
    return 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80';
  }
  if (n.includes('thali') || n.includes('meal') || n.includes('paneer') || n.includes('curry') || n.includes('roti') || n.includes('naan') || n.includes('dal')) {
    return 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80';
  }
  if (n.includes('pizza')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80';
  }
  if (n.includes('burger') || n.includes('sandwich')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80';
  }
  if (n.includes('noodle') || n.includes('pasta') || n.includes('chowmein')) {
    return 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80';
  }
  if (n.includes('coffee') || n.includes('tea') || n.includes('chai') || n.includes('shake') || n.includes('juice') || n.includes('beverage')) {
    return 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80';
  }
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
};

const RATING_LABELS = {
  0: 'Tap a star to rate your food ⭐',
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
  const { user } = useAuth();
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [ratedItemNames, setRatedItemNames] = useState(new Set());
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [dishImageUrl, setDishImageUrl] = useState('');

  const orderItems = Array.isArray(order?.items) && order.items.length > 0
    ? order.items
    : [{ name: 'Campus Meal Dish', imageUrl: '' }];

  const currentItem = orderItems[currentItemIndex] || orderItems[0];
  const hasMultipleItems = orderItems.length > 1;
  const isLastItem = currentItemIndex === orderItems.length - 1;

  useEffect(() => {
    if (isOpen) {
      setCurrentItemIndex(0);
      setRatedItemNames(new Set());
      setRating(0);
      setHoverRating(0);
      setSelectedTags([]);
      setReviewText('');
      setWouldRecommend(true);
      setSubmitting(false);
      setSubmitted(false);
    }
  }, [isOpen, order?.id, order?.orderId]);

  useEffect(() => {
    if (!isOpen || !order) return;
    const directImage = currentItem?.imageUrl || currentItem?.image || currentItem?.photoUrl || currentItem?.photo || order?.imageUrl || order?.image;
    if (directImage) {
      setDishImageUrl(directImage);
      return;
    }

    const idKey = currentItem?.id ? `id:${String(currentItem.id)}` : (currentItem?.menuItemId ? `id:${String(currentItem.menuItemId)}` : null);
    const nameKey = currentItem?.name ? `name:${currentItem.name.trim().toLowerCase()}` : null;

    if (cachedMenuImages) {
      const match = (idKey && cachedMenuImages[idKey]) || (nameKey && cachedMenuImages[nameKey]);
      if (match) {
        setDishImageUrl(match);
        return;
      }
    }

    getCachedMenuImages().then((index) => {
      const match = (idKey && index[idKey]) || (nameKey && index[nameKey]);
      if (match) {
        setDishImageUrl(match);
      } else {
        setDishImageUrl(getCategoryOrNameFallback(currentItem?.name));
      }
    }).catch(() => {
      setDishImageUrl(getCategoryOrNameFallback(currentItem?.name));
    });
  }, [isOpen, order, currentItemIndex, currentItem?.id, currentItem?.name, currentItem?.imageUrl, currentItem?.image]);

  if (!isOpen || !order) return null;

  const handleToggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSkipCurrentDish = () => {
    if (currentItemIndex < orderItems.length - 1) {
      setCurrentItemIndex((prev) => prev + 1);
      setRating(0);
      setHoverRating(0);
      setSelectedTags([]);
      setReviewText('');
      setWouldRecommend(true);
    }
  };

  const handleSkipAll = () => {
    const orderIdStr = String(order?.id || order?.orderId || '');
    if (orderIdStr) {
      inMemoryRatedOrderIds.add(orderIdStr);
      if (ratedItemNames.size > 0) {
        window.dispatchEvent(new CustomEvent('cms:feedback_created', { detail: { orderId: orderIdStr } }));
      }
    }
    onClose();
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!rating || rating < 1) return;
    setSubmitting(true);

    const rawOutletId = order.outletId || order.outlet?.id;
    const numOutlet = Number(rawOutletId);
    const safeOutletId = !isNaN(numOutlet) && numOutlet > 0 ? numOutlet : 1;
    const dishName = currentItem.name || 'Campus Meal Dish';

    const feedbackPayload = {
      outletId: safeOutletId,
      customerName: order.customer?.name || user?.fullName || 'Campus Diner',
      customerRole: order.customer?.role || user?.role || 'Student',
      customerEmail: order.customer?.email || user?.email || 'student@campus.edu',
      orderId: String(order.id || order.orderId || ''),
      orderToken: String(order.token || ''),
      rating: Number(rating),
      complaintCategory: dishName,
      comments: reviewText.trim()
        ? `${reviewText.trim()} (Tags: ${selectedTags.join(', ')}) [Dish: ${dishName}]`
        : `Dish: ${dishName}. Customer rated ${rating}/5 stars. Tags: ${selectedTags.join(', ')}`
    };

    try {
      await feedbackService.create(feedbackPayload);
      window.dispatchEvent(new CustomEvent('cms:feedback_created', { detail: feedbackPayload }));
    } catch (err) {
      console.warn('Backend feedback log:', err);
    }

    const updatedRated = new Set(ratedItemNames);
    updatedRated.add(dishName);
    setRatedItemNames(updatedRated);

    if (onFeedbackSubmitted) {
      onFeedbackSubmitted(feedbackPayload);
    }

    // If there are more items to rate in this order
    if (hasMultipleItems && !isLastItem) {
      setSubmitting(false);
      setCurrentItemIndex((prev) => prev + 1);
      setRating(0);
      setHoverRating(0);
      setSelectedTags([]);
      setReviewText('');
      setWouldRecommend(true);
      return;
    }

    // Mark whole order as rated
    if (order?.id || order?.orderId) {
      inMemoryRatedOrderIds.add(String(order.id || order.orderId));
    }

    setSubmitting(false);
    setSubmitted(true);

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
      onClick={handleSkipAll}
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
            onClick={handleSkipAll}
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

        {/* Multi-Item Selector Pills */}
        {hasMultipleItems && !submitted && (
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto'
          }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
              Item {currentItemIndex + 1} of {orderItems.length}:
            </span>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
              {orderItems.map((item, idx) => {
                const isSelected = idx === currentItemIndex;
                const isItemRated = ratedItemNames.has(item.name || `item-${idx}`);
                return (
                  <button
                    key={`${item.id || item.name}-${idx}`}
                    type="button"
                    onClick={() => {
                      setCurrentItemIndex(idx);
                      setRating(0);
                      setHoverRating(0);
                      setSelectedTags([]);
                      setReviewText('');
                      setWouldRecommend(true);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      border: isSelected ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                      backgroundColor: isSelected ? '#eff6ff' : isItemRated ? '#f0fdf4' : '#ffffff',
                      color: isSelected ? '#1d4ed8' : isItemRated ? '#16a34a' : '#475569',
                      fontSize: '11.5px',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isItemRated && <Check size={12} strokeWidth={3} />}
                    <span>{item.name || `Dish ${idx + 1}`}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
                  src={dishImageUrl || currentItem.imageUrl || getCategoryOrNameFallback(currentItem.name)}
                  alt={currentItem.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  fallback={
                    <img
                      src={getCategoryOrNameFallback(currentItem.name)}
                      alt={currentItem.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  }
                />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentItem.name}
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '1px' }}>
                  {hasMultipleItems
                    ? `Dish ${currentItemIndex + 1} of ${orderItems.length} in this order`
                    : 'Chef prepared dish'}
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
                color: activeRating >= 4 ? '#15803d' : activeRating === 3 ? '#d97706' : activeRating >= 1 ? '#dc2626' : '#64748b',
                minHeight: '20px'
              }}>
                {RATING_LABELS[activeRating] || 'Tap a star to rate'}
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

            {/* Submit & Navigation Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                disabled={submitting || rating === 0}
                onClick={handleSubmit}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: rating === 0 ? '#94a3b8' : '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14.5px',
                  fontWeight: 700,
                  cursor: submitting || rating === 0 ? 'not-allowed' : 'pointer',
                  boxShadow: rating === 0 ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.25)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => { if (!submitting && rating > 0) e.currentTarget.style.backgroundColor = '#1d4ed8'; }}
                onMouseLeave={(e) => { if (!submitting && rating > 0) e.currentTarget.style.backgroundColor = '#2563eb'; }}
              >
                {submitting
                  ? 'Submitting...'
                  : rating === 0
                    ? 'Select a Star Rating'
                    : hasMultipleItems && !isLastItem
                      ? `Rate Next Dish (${currentItemIndex + 1}/${orderItems.length}) →`
                      : 'Submit Review'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px' }}>
                {hasMultipleItems && !isLastItem && (
                  <button
                    type="button"
                    onClick={handleSkipCurrentDish}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#475569',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '4px 6px',
                      textDecoration: 'underline'
                    }}
                  >
                    Skip this dish →
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSkipAll}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '12.5px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: '4px 6px'
                  }}
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodRatingModal;
