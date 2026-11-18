import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../../app/providers/AuthProvider';
import { orderService } from '../../../admin/orders/services/orderService';
import { storageService } from '../../../../services/storageService';
import { ORDER_STATUS } from '../../../../constants/appConstants';
import { PageHeader } from '../../../../components/common/PageHeader';
import { Card } from '../../../../components/common/Card';
import { Button } from '../../../../components/common/Button';
import {
  Star,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
  Heart
} from 'lucide-react';

const FEEDBACK_STORAGE_KEY = 'cms_canteen_feedback_tickets';

export const RateAndPrivacyPage = () => {
  const [searchParams] = useSearchParams();
  const preselectedOrderId = searchParams.get('orderId');
  const { user } = useAuth();

  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(preselectedOrderId || '');
  const [submittedReviews, setSubmittedReviews] = useState([]);

  // Rating States (1 to 5 stars)
  const [overallRating, setOverallRating] = useState(5);
  const [tasteRating, setTasteRating] = useState(5);
  const [hygieneRating, setHygieneRating] = useState(5);

  const [feedbackCategory, setFeedbackCategory] = useState('Food Quality & Taste');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadOrdersAndReviews = async () => {
      try {
        const allOrders = await orderService.getAll();
        const userCompleted = (allOrders || []).filter(o => {
          const isUser = (o.customer?.email && user?.email && o.customer.email.toLowerCase() === user.email.toLowerCase()) ||
            (o.customer?.name && user?.fullName && o.customer.name.toLowerCase() === user.fullName.toLowerCase());
          return isUser && o.status === ORDER_STATUS.COMPLETED;
        });

        setEligibleOrders(userCompleted);
        setSelectedOrderId(prev => {
          if (preselectedOrderId && userCompleted.some(o => o.id === preselectedOrderId)) {
            return preselectedOrderId;
          }
          if (userCompleted.length > 0 && !prev) {
            return userCompleted[0].id;
          }
          return prev;
        });

        // Load existing reviews
        const savedFeedback = storageService.getItem(FEEDBACK_STORAGE_KEY, []);
        const userFeedback = (savedFeedback || []).filter(f =>
          (f.customerEmail && user?.email && f.customerEmail.toLowerCase() === user.email.toLowerCase()) ||
          (f.customerName && user?.fullName && f.customerName.toLowerCase() === user.fullName.toLowerCase())
        );
        setSubmittedReviews(userFeedback);
      } catch (err) {
        console.error('Failed to load feedback data:', err);
      }
    };

    loadOrdersAndReviews();
  }, [user, preselectedOrderId]);

  const handleSubmitReview = (e) => {
    e.preventDefault();
    const orderObj = eligibleOrders.find(o => o.id === selectedOrderId);

    const newTicket = {
      id: `FB-2026-${Math.floor(100 + Math.random() * 900)}`,
      orderId: selectedOrderId || 'General Feedback',
      customerName: user?.fullName || 'Campus Diner',
      customerRole: `${user?.role || 'Student'} (${user?.department || 'Main Campus'})`,
      customerEmail: user?.email || 'user@campus.edu',
      outletId: orderObj?.outletId || 'canteen-001',
      outletName: orderObj?.outletName || 'Central Dining Hall',
      category: feedbackCategory,
      overallRating,
      tasteRating,
      hygieneRating,
      comment: comment.trim(),
      status: 'Open',
      createdAt: new Date().toISOString()
    };

    setSubmitting(true);
    setTimeout(() => {
      // Save directly to shared canteen feedback tickets (interoperable with Admin Feedback Module)
      const existing = storageService.getItem(FEEDBACK_STORAGE_KEY, []);
      const updated = [newTicket, ...(existing || [])];
      storageService.setItem(FEEDBACK_STORAGE_KEY, updated);

      setSubmittedReviews([newTicket, ...submittedReviews]);
      setSuccessMessage('Thank you! Your dining feedback has been recorded and submitted to Canteen Administration.');
      setComment('');
      setSubmitting(false);

      setTimeout(() => setSuccessMessage(''), 4000);
    }, 600);
  };

  const renderStarSelector = (ratingValue, setRatingFn) => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRatingFn(star)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              color: star <= ratingValue ? '#f59e0b' : 'var(--border-color)'
            }}
          >
            <Star size={20} fill={star <= ratingValue ? '#f59e0b' : 'none'} />
          </button>
        ))}
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginLeft: '6px' }}>
          {ratingValue}.0 / 5
        </span>
      </div>
    );
  };

  return (
    <div>
      {/* Admin PageHeader */}
      <PageHeader
        title="Dining Feedback & Institutional Privacy"
        description="Submit food quality ratings for completed dining orders and inspect campus nutritional compliance policies."
      />

      {successMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '14px 18px',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: 'var(--color-success-bg)',
          color: 'var(--color-success-text)',
          border: '1px solid var(--color-success-border)',
          marginBottom: '20px',
          fontSize: '13px',
          fontWeight: 500
        }}>
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Grid Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Column: Rating & Feedback Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title="Rate Completed Dining Order" padding="20px">
            <form onSubmit={handleSubmitReview}>
              {/* Order Selection */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Select Completed Order:
                </label>
                {eligibleOrders.length === 0 ? (
                  <div style={{
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: 'var(--border-radius-md)',
                    border: '1px solid var(--border-color)',
                    fontSize: '13px',
                    color: 'var(--text-muted)'
                  }}>
                    No completed orders found yet. You can submit general dining feedback below.
                  </div>
                ) : (
                  <select
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--border-radius-md)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    {eligibleOrders.map((ord) => (
                      <option key={ord.id} value={ord.id}>
                        Order #{ord.id} ({ord.outletName || 'Central Dining'}) • ₹{Number(ord.totalAmount || ord.pricing?.totalAmount || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* 3-Axis Star Ratings */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px', padding: '16px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Overall Meal Experience:
                  </span>
                  {renderStarSelector(overallRating, setOverallRating)}
                </div>

                <div>
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Food Freshness & Taste:
                  </span>
                  {renderStarSelector(tasteRating, setTasteRating)}
                </div>

                <div>
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Counter Hygiene & Service Speed:
                  </span>
                  {renderStarSelector(hygieneRating, setHygieneRating)}
                </div>
              </div>

              {/* Feedback Category */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                  Feedback Category:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[
                    'Food Quality & Taste',
                    'Preparation Speed',
                    'Canteen Hygiene & Cleanliness',
                    'Portion Size',
                    'Billing / Token Service'
                  ].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFeedbackCategory(cat)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--border-radius-full)',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: '1px solid',
                        borderColor: feedbackCategory === cat ? 'var(--color-accent)' : 'var(--border-color)',
                        backgroundColor: feedbackCategory === cat ? 'var(--color-primary-light)' : 'var(--bg-surface)',
                        color: feedbackCategory === cat ? 'var(--color-accent)' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comments Textarea */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Detailed Comments or Suggestions:
                </label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details about your meal taste, temperature, portions, or dining cleanliness..."
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--border-radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                icon={Send}
                loading={submitting}
                style={{ width: '100%', height: '42px', fontSize: '14px', justifyContent: 'center' }}
              >
                Submit Dining Feedback
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column: Submitted Reviews & Institutional Privacy Policy */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Previously Submitted Reviews Card */}
          <Card
            title="Your Submitted Reviews"
            subtitle={`${submittedReviews.length} Feedback submissions recorded`}
            padding="16px"
          >
            {submittedReviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                <p style={{ margin: 0, fontSize: '13px' }}>You have not submitted any reviews yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {submittedReviews.map((rev) => (
                  <div
                    key={rev.id}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--border-radius-md)',
                      backgroundColor: 'var(--bg-app)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {rev.outletName || 'Campus Canteen'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#f59e0b' }}>
                        <Star size={13} fill="#f59e0b" />
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>{rev.overallRating}.0</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--color-accent)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      {typeof rev.category === 'object' ? (rev.category?.name || rev.category?.id || '') : rev.category}
                    </span>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Campus Privacy Policy & Allergen Notice Card */}
          <Card title="Campus Dining Privacy & Allergen Policy" padding="20px">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Lock size={16} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Data Privacy:</strong> Student and faculty dining orders and transaction records are stored securely under institutional compliance. Dining histories are never shared with external advertisers.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <ShieldCheck size={16} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Food Safety & FSSAI Standards:</strong> All kitchen outlets follow mandatory state food safety protocols. Food samples are inspected weekly for quality and nutrition.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Heart size={16} style={{ color: '#ec4899', flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Dietary Commitments:</strong> Pure vegetarian cooking vessels and preparation lines are strictly segregated from non-vegetarian cooking areas.
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RateAndPrivacyPage;
