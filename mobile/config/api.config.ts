import { API_BASE_URL, BACKEND_BASE_URL } from './constants';

/**
 * Centralized configuration for API and Socket connections
 * Ensures consistent base URL handling across the mobile application
 */

// Get the base backend URL
export const getBackendBaseURL = (): string => {
  return BACKEND_BASE_URL;
};

// Get the API base URL (backend URL + /api)
export const getApiBaseURL = (): string => {
  return API_BASE_URL;
};

// Get the Socket base URL (backend URL without /api)
export const getSocketBaseURL = (): string => {
  return getBackendBaseURL();
};

// Export the backend base URL for other uses
export const getBackendURL = (): string => {
  return getBackendBaseURL();
};

// Default export for backwards compatibility
export default {
  apiBaseURL: getApiBaseURL(),
  socketBaseURL: getSocketBaseURL(),
  backendBaseURL: getBackendBaseURL(),
};
