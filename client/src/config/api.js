// API configuration - uses environment variables with fallbacks
const getApiUrl = () => {
  // Check for explicit API URL first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In development, use localhost
  if (import.meta.env.MODE === 'development' || import.meta.env.DEV) {
    return 'http://localhost:3001';
  }
  
  // In production, use the same origin (for same-domain deployment)
  // Or use window.location.origin if API is on same domain
  return window.location.origin;
};

const getWebSocketUrl = () => {
  // Check for explicit WebSocket URL first
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  
  // In development, use localhost
  if (import.meta.env.MODE === 'development' || import.meta.env.DEV) {
    return 'ws://localhost:3001';
  }
  
  // In production, try to convert API URL to WebSocket URL
  // Note: This won't work on Vercel - you'll need a separate WebSocket server
  const apiUrl = getApiUrl();
  if (apiUrl.startsWith('https://')) {
    return apiUrl.replace('https://', 'wss://');
  }
  if (apiUrl.startsWith('http://')) {
    return apiUrl.replace('http://', 'ws://');
  }
  return `wss://${apiUrl}`;
};

export const API_URL = getApiUrl();
export const WS_URL = getWebSocketUrl();

