import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timerRef = useRef(null);
  const lastToastRef = useRef({ key: '', time: 0 });

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const addToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const key = `${type}|${title || ''}|${message || ''}`;
    const now = Date.now();

    // Ignore duplicate identical toast fired in rapid succession (e.g. StrictMode double-effect)
    if (lastToastRef.current.key === key && now - lastToastRef.current.time < 2000) {
      return;
    }
    lastToastRef.current = { key, time: now };

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const id = `toast-${now}-${Math.random().toString(36).slice(2, 11)}`;
    const newToast = { id, type, title, message };

    // Keep only a single toast visible at a time
    setToasts([newToast]);

    if (duration > 0) {
      timerRef.current = setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
        timerRef.current = null;
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((title, message) => {
    addToast({ type: 'success', title, message });
  }, [addToast]);

  const error = useCallback((title, message) => {
    addToast({ type: 'error', title, message });
  }, [addToast]);

  const info = useCallback((title, message) => {
    addToast({ type: 'info', title, message });
  }, [addToast]);

  const warning = useCallback((title, message) => {
    addToast({ type: 'warning', title, message });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info, warning }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

