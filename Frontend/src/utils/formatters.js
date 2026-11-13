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

export const getActiveBackendOrigin = () => {
  const rawBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL);
  let origin = rawBase.replace(/\/api(\/v\d+)?\/?$/, '').replace(/\/+$/, '');

  // If the base URL is local (localhost/127.0.0.1) but client is accessing from a LAN IP (e.g. mobile 192.168.x.x)
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    const isClientOnLan = /^192\.168\./.test(host) || /^10\./.test(host);
    const isConfigLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(origin);

    if (isClientOnLan && isConfigLocal) {
      try {
        const urlObj = new URL(origin);
        urlObj.hostname = host;
        origin = urlObj.origin;
      } catch {
        origin = `http://${host}:5000`;
      }
    }
  }

  return origin;
};

export const resolveImageUrl = (path, fallback = '') => {
  if (!path || typeof path !== 'string') return fallback;

  const trimmed = path.trim();
  if (!trimmed) return fallback;

  // 1. Corrupted base64 string or truncated data URL
  if (trimmed.startsWith('data:') && (!trimmed.includes(';base64,') || trimmed.length < 100 || trimmed.endsWith('...'))) {
    return fallback;
  }

  // 2. Blob URL or inline base64 (Instant camera/file preview)
  if (trimmed.startsWith('blob:') || (trimmed.startsWith('data:image/') && trimmed.includes(';base64,'))) {
    return trimmed;
  }

  const backendOrigin = getActiveBackendOrigin();

  let cleanUploadPath = trimmed;
  if (cleanUploadPath.toLowerCase().startsWith('/upload/')) {
    cleanUploadPath = '/uploads/' + cleanUploadPath.slice('/upload/'.length);
  }

  // 3. Server Relative or Absolute Upload Path (contains /uploads/...)
  // Handles:
  // - "/uploads/menu/xyz.png"
  // - "http://localhost:5000/uploads/menu/xyz.png" (uploaded from another machine/local dev)
  // - "http://127.0.0.1:5000/uploads/menu/xyz.png"
  // - "https://old-tunnel.ngrok-free.dev/uploads/menu/xyz.png"
  // Strips foreign/local origins and re-routes directly to the active backend origin.
  const uploadsIdx = cleanUploadPath.indexOf('/uploads/');
  if (uploadsIdx !== -1) {
    const relativePath = cleanUploadPath.slice(uploadsIdx);
    let finalUrl = `${backendOrigin}${relativePath}`;
    if (finalUrl.includes('ngrok-free.dev') && !finalUrl.includes('ngrok-skip-browser-warning')) {
      finalUrl += `${finalUrl.includes('?') ? '&' : '?'}ngrok-skip-browser-warning=true`;
    }
    return finalUrl;
  }

  // 4. External Web URL (from internet, e.g. Unsplash, CDN, or pasted web link)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // If it's a localhost URL that wasn't an upload, but client is remote, remap to active backend
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(trimmed)) {
      if (backendOrigin && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(backendOrigin)) {
        const pathPart = trimmed.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '');
        let remapped = `${backendOrigin}${pathPart.startsWith('/') ? pathPart : `/${pathPart}`}`;
        if (remapped.includes('ngrok-free.dev') && !remapped.includes('ngrok-skip-browser-warning')) {
          remapped += `${remapped.includes('?') ? '&' : '?'}ngrok-skip-browser-warning=true`;
        }
        return remapped;
      }
    }

    if (trimmed.includes('ngrok-free.dev') && !trimmed.includes('ngrok-skip-browser-warning')) {
      return `${trimmed}${trimmed.includes('?') ? '&' : '?'}ngrok-skip-browser-warning=true`;
    }
    return trimmed;
  }

  // 5. General relative path
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  let finalUrl = `${backendOrigin}${cleanPath}`;
  if (finalUrl.includes('ngrok-free.dev') && !finalUrl.includes('ngrok-skip-browser-warning')) {
    finalUrl += `${finalUrl.includes('?') ? '&' : '?'}ngrok-skip-browser-warning=true`;
  }
  return finalUrl;
};
