/**
 * API Service Client for Customer Churn Prediction Backend
 * Supports configurable Base URL (Localhost or Google Colab Ngrok Tunnel)
 */

const STORAGE_KEY = 'ML_API_BASE_URL';
const DEFAULT_URL = 'http://127.0.0.1:5000';

export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_URL;
  }
  return DEFAULT_URL;
};

export const setApiBaseUrl = (url) => {
  const cleanUrl = url.trim().replace(/\/+$/, '');
  localStorage.setItem(STORAGE_KEY, cleanUrl);
  return cleanUrl;
};

export const resetApiBaseUrl = () => {
  localStorage.setItem(STORAGE_KEY, DEFAULT_URL);
  return DEFAULT_URL;
};

/**
 * Standard fetch helper with timeout and error handling
 */
const request = async (endpoint, options = {}, timeoutMs = 8000) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers || {})
      }
    });

    clearTimeout(timeoutId);

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.message || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s. Check if your backend/tunnel is active.`);
    }
    throw err;
  }
};

export const api = {
  checkHealth: async (customUrl = null) => {
    const baseUrl = customUrl ? customUrl.trim().replace(/\/+$/, '') : getApiBaseUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(`${baseUrl}/api/health`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  },

  predict: async (customerData) => {
    return await request('/api/predict', {
      method: 'POST',
      body: JSON.stringify(customerData)
    });
  },

  getHistory: async (limit = 100) => {
    return await request(`/api/history?limit=${limit}`, { method: 'GET' });
  },

  clearHistory: async () => {
    return await request('/api/history', { method: 'DELETE' });
  },

  getAnalytics: async () => {
    return await request('/api/analytics', { method: 'GET' });
  },

  getModelInfo: async () => {
    return await request('/api/model-info', { method: 'GET' });
  },

  getSampleCustomers: async () => {
    return await request('/api/sample-customers', { method: 'GET' });
  }
};
