/**
 * Common formatting utilities
 */

import { CURRENCY } from '../constants/appConstants';

export const formatCurrency = (amount) => {
  const num = Number(amount);
  if (isNaN(num)) return `${CURRENCY.SYMBOL}0.00`;
  return `${CURRENCY.SYMBOL}${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export const formatNumber = (val) => {
  const num = Number(val);
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-IN');
};

export const formatTime12Hour = (timeStr) => {
  if (!timeStr) return '--:--';
  const trimmed = String(timeStr).trim();
  // Return as-is if already formatted in 12-hour AM/PM
  if (/\b(AM|PM)\b/i.test(trimmed)) {
    return trimmed;
  }
  const parts = trimmed.split(':');
  if (parts.length < 2) return trimmed;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].slice(0, 2);
  if (isNaN(hours)) return trimmed;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const trimmed = String(timeStr).trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3] ? match[3].toUpperCase() : null;
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

export const calculateDuration = (startTime, endTime) => {
  const startMins = parseTimeToMinutes(startTime);
  const endMins = parseTimeToMinutes(endTime);
  if (startMins === null || endMins === null) return '--';
  let diff = endMins - startMins;
  if (diff < 0) diff += 24 * 60;
  if (diff === 0) return '0 mins';
  return `${diff} mins`;
};

export const formatWorkingDays = (days = []) => {
  if (!Array.isArray(days) || days.length === 0) return 'None';
  if (days.length === 7) return 'All 7 Days (Mon - Sun)';
  
  const standardWeekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const isAllWeekdays = standardWeekdays.every(d => days.includes(d)) && days.length === 5;
  if (isAllWeekdays) return 'Weekdays (Mon - Fri)';

  const standardWeekend = ['Saturday', 'Sunday'];
  const isWeekendOnly = standardWeekend.every(d => days.includes(d)) && days.length === 2;
  if (isWeekendOnly) return 'Weekends (Sat - Sun)';

  const shortMap = {
    'Monday': 'Mon',
    'Tuesday': 'Tue',
    'Wednesday': 'Wed',
    'Thursday': 'Thu',
    'Friday': 'Fri',
    'Saturday': 'Sat',
    'Sunday': 'Sun'
  };

  return days.map(d => shortMap[d] || d).join(', ');
};

export const formatDate = (dateString) => {
  if (!dateString) return '--';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '--';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

/**
 * Universal Image URL Resolver
 * Supports:
 * 1. External Web URLs (https://...) -> Rendered directly from internet
 * 2. Blob URLs (blob:http://...) -> Instant mobile camera preview
 * 3. Server Relative Paths (/uploads/menu/...) -> Dynamically maps to active host:
 *    - On localhost -> http://localhost:5000/uploads/...
 *    - On mobile Wi-Fi (192.168.X.X) -> http://192.168.X.X:5000/uploads/...
 *    - On ngrok tunnel -> https://...ngrok-free.dev/uploads/...?ngrok-skip-browser-warning=true
 */
export const resolveImageUrl = (path, fallback = '') => {
  if (!path || typeof path !== 'string') return fallback;

  const trimmed = path.trim();
  if (!trimmed) return fallback;

  // Corrupted base64 string or truncated data URL
  if (trimmed.startsWith('data:') && (!trimmed.includes(';base64,') || trimmed.length < 100 || trimmed.endsWith('...'))) {
    return fallback;
  }

  // 1. External Web URL (from internet, e.g. Unsplash, CDN, or pasted web link)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (trimmed.includes('ngrok-free.dev') && !trimmed.includes('ngrok-skip-browser-warning')) {
      return `${trimmed}${trimmed.includes('?') ? '&' : '?'}ngrok-skip-browser-warning=true`;
    }
    return trimmed;
  }

  // 2. Blob URL or inline base64 (Instant camera/file preview)
  if (trimmed.startsWith('blob:') || (trimmed.startsWith('data:image/') && trimmed.includes(';base64,'))) {
    return trimmed;
  }

  // 3. Server Relative Upload Path (/uploads/menu/...)
  let cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (cleanPath.toLowerCase().startsWith('/upload/')) {
    cleanPath = '/uploads/' + cleanPath.slice('/upload/'.length);
  }

  let backendOrigin = '';
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Local device or mobile connected via LAN Wi-Fi (localhost, 127.0.0.1, 192.168.x.x, 10.x.x.x)
    if (host === 'localhost' || host === '127.0.0.1' || /^192\.168\./.test(host) || /^10\./.test(host)) {
      backendOrigin = `http://${host}:5000`;
    }
  }

  if (!backendOrigin) {
    const rawBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    backendOrigin = rawBase.replace(/\/api(\/v\d+)?\/?$/, '').replace(/\/+$/, '');
  }

  let finalUrl = `${backendOrigin}${cleanPath}`;
  if (finalUrl.includes('ngrok-free.dev') && !finalUrl.includes('ngrok-skip-browser-warning')) {
    finalUrl += `${finalUrl.includes('?') ? '&' : '?'}ngrok-skip-browser-warning=true`;
  }
  return finalUrl;
};
