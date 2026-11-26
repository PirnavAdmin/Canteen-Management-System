import { useState, useEffect, useCallback } from 'react';
import { feedbackService } from '../services/feedbackService';
import { useToast } from '../../../../app/providers/ToastProvider';

export const useFeedback = (selectedOutlet = 'ALL') => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { success, error: toastError } = useToast();

  const loadFeedback = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = (selectedOutlet && selectedOutlet !== 'ALL')
        ? { outletId: Number(selectedOutlet) }
        : {};
      const response = await feedbackService.getAll(params);
      const data = Array.isArray(response) ? response : (response?.data || []);
      // Sort recently given feedback to the top (descending by createdAt timestamp)
      const sorted = [...data].sort((a, b) => {
        const timeA = new Date(a.createdAt || a.date || 0).getTime();
        const timeB = new Date(b.createdAt || b.date || 0).getTime();
        return timeB - timeA;
      });
      setFeedbackList(sorted);
    } catch (err) {
      console.error('Failed to load feedback:', err);
      setError(err.message || 'Error loading feedback');
      toastError('Feedback Error', 'Unable to retrieve grievance tickets.');
    } finally {
      setLoading(false);
    }
  }, [selectedOutlet, toastError]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  // Real-time listener for newly submitted customer feedback
  useEffect(() => {
    const handleFeedbackCreated = () => {
      loadFeedback();
    };
    window.addEventListener('cms:feedback_created', handleFeedbackCreated);
    return () => window.removeEventListener('cms:feedback_created', handleFeedbackCreated);
  }, [loadFeedback]);

  const resolveTicket = useCallback(async (id, resolutionData) => {
    try {
      const updated = await feedbackService.resolveTicket(id, resolutionData);
      setFeedbackList(prev => prev.map(f => f.id === id ? updated : f));
      success('Grievance Updated', `Ticket ${updated.id} status set to ${updated.status}.`);
      return updated;
    } catch (err) {
      toastError('Resolution Error', err.message);
      throw err;
    }
  }, [success, toastError]);

  return {
    feedbackList,
    loading,
    error,
    resolveTicket,
    refreshFeedback: loadFeedback
  };
};

export default useFeedback;
