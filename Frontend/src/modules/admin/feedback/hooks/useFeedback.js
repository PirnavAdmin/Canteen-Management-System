import { useState, useEffect, useCallback } from 'react';
import { feedbackService } from '../services/feedbackService';
import { useToast } from '../../../../app/providers/ToastProvider';

export const useFeedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { success, error: toastError } = useToast();

  const loadFeedback = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await feedbackService.getAll();
      setFeedbackList(data);
    } catch (err) {
      console.error('Failed to load feedback:', err);
      setError(err.message || 'Error loading feedback');
      toastError('Feedback Error', 'Unable to retrieve grievance tickets.');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadFeedback();
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
