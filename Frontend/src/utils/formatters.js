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

export const formatTime12Hour = (time24) => {
  if (!time24) return '--:--';
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
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
