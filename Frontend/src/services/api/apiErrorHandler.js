/**
 * Centralized API Error Normalizer and Handler
 */

export class ApiError extends Error {
  constructor(message, status = 500, data = null, code = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.code = code;
  }
}

export const handleApiError = (error) => {
  // If already an ApiError instance
  if (error instanceof ApiError) {
    return error;
  }

  // If network failure / connection aborted
  if (error.name === 'AbortError') {
    return new ApiError('Request timed out. Please try again.', 408, null, 'TIMEOUT');
  }

  if (error.message === 'Failed to fetch' || !navigator.onLine) {
    return new ApiError('Network connection issue. Please verify your internet or intranet connection.', 0, null, 'NETWORK_ERROR');
  }

  // Response with JSON body
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data || {};
    const message = data.message || data.error || getStatusMessage(status);

    return new ApiError(message, status, data, data.code || `HTTP_${status}`);
  }

  return new ApiError(error.message || 'An unexpected error occurred.', 500, null, 'UNKNOWN');
};

const getStatusMessage = (status) => {
  switch (status) {
    case 400:
      return 'Bad request. Please verify your input parameters.';
    case 401:
      return 'Session expired or unauthenticated. Please sign in again.';
    case 403:
      return 'Forbidden. You do not possess the required institutional permissions for this action.';
    case 404:
      return 'Requested resource was not found.';
    case 409:
      return 'Conflict: Operation cannot be performed due to existing dependencies or duplicate entries.';
    case 422:
      return 'Validation failed. Please correct the highlighted errors.';
    case 500:
      return 'Internal server error. Please contact the SMS/CMS system administrator.';
    case 503:
      return 'Service temporarily unavailable. Please try again shortly.';
    default:
      return `Unexpected error occurred (Status code: ${status}).`;
  }
};

