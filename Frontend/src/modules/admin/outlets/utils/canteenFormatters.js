import { formatTime12Hour, formatWorkingDays, formatDate } from '../../../../utils/formatters';

export { formatTime12Hour, formatWorkingDays, formatDate };

export const formatOperatingHours = (openingTime, closingTime) => {
  if (!openingTime || !closingTime) return 'Not configured';
  return `${formatTime12Hour(openingTime)} – ${formatTime12Hour(closingTime)}`;
};

export const calculateTotalHours = (openingTime, closingTime) => {
  if (!openingTime || !closingTime) return 0;
  const [h1, m1] = openingTime.split(':').map(Number);
  const [h2, m2] = closingTime.split(':').map(Number);
  const diffMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
  return (diffMinutes / 60).toFixed(1);
};

