// API client for Shinetek Inc. Portal

export const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
  : (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
    ? 'https://shineteck.onrender.com/api'
    : '/api';

export function getAuthToken() {
  return localStorage.getItem('shinetek_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('shinetek_token', token);
  } else {
    localStorage.removeItem('shinetek_token');
  }
}

export function getDocumentStreamUrl(docId, token = getAuthToken()) {
  return `${API_BASE}/documents/stream/${docId}${token ? `?token=${token}` : ''}`;
}

export function getTimesheetDownloadUrl(tsId, token = getAuthToken()) {
  return `${API_BASE}/timesheets/download/${tsId}${token ? `?token=${token}` : ''}`;
}

export async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is not FormData, set Content-Type to application/json
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data && data.error ? data.error : (typeof data === 'string' ? data : 'An error occurred');
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Public
  getNextIdPreview: () => request('/settings/next-id'),
  getCountries: () => request('/address/countries'),
  getStates: (country) => request(`/address/states/${encodeURIComponent(country)}`),
  getCities: (country, state) => request(`/address/cities/${encodeURIComponent(country)}/${encodeURIComponent(state)}`),
  validateAddress: (data) => request('/address/validate', { method: 'POST', body: data }),

  // Auth
  register: (data) => request('/auth/register', { method: 'POST', body: data }),
  login: (data) => request('/auth/login', { method: 'POST', body: data }),
  getMe: () => request('/auth/me'),
  forgotPassword: (data) => request('/auth/forgot-password', { method: 'POST', body: data }),
  resetPassword: (data) => request('/auth/reset-password', { method: 'POST', body: data }),

  // Uploads
  uploadAvatar: (formData) => request('/upload/avatar', { method: 'POST', body: formData }),
  uploadDocument: (formData) => request('/upload/document', { method: 'POST', body: formData }),

  // Employee Portal
  getProfile: () => request('/employee/profile'),
  updateProfile: (data) => request('/employee/profile', { method: 'PUT', body: data }),
  getMyDocuments: () => request('/documents'),
  uploadDocAuth: (formData) => request('/documents/upload', { method: 'POST', body: formData }),
  getMyTimesheets: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/timesheets/my${query ? `?${query}` : ''}`);
  },
  submitTimesheet: (formData) => request('/timesheets/submit', { method: 'POST', body: formData }),
  getMyVendors: () => request('/vendors/my'),
  getMyPayroll: () => request('/payroll/my'),
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'POST' }),

  // Admin Portal
  getDashboardStats: () => request('/admin/dashboard'),
  getAllEmployees: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/employees${query ? `?${query}` : ''}`);
  },
  createEmployeeByAdmin: (data) => request('/admin/employees', { method: 'POST', body: data }),
  getEmployeeDetail: (id) => request(`/admin/employees/${id}`),
  updateEmployeeByAdmin: (id, data) => request(`/admin/employees/${id}`, { method: 'PUT', body: data }),
  reviewEmployeeStatus: (id, data) => request(`/admin/employees/${id}/status`, { method: 'PATCH', body: data }),
  toggleEmploymentStatus: (id, data) => request(`/admin/employees/${id}/employment-status`, { method: 'PATCH', body: data }),
  reviewDocument: (id, data) => request(`/admin/documents/${id}/review`, { method: 'PATCH', body: data }),
  getAllTimesheets: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/timesheets${query ? `?${query}` : ''}`);
  },
  reviewTimesheet: (id, data) => request(`/admin/timesheets/${id}/review`, { method: 'PATCH', body: data }),
  getAllPayroll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/payroll${query ? `?${query}` : ''}`);
  },
  createPayrollRecord: (data) => request('/admin/payroll', { method: 'POST', body: data }),
  getSettings: () => request('/admin/settings'),
  updateSettings: (data) => request('/admin/settings', { method: 'PUT', body: data }),
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/audit-logs${query ? `?${query}` : ''}`);
  },

  // Admin Vendor Details
  getAllVendorDetails: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/vendors${query ? `?${query}` : ''}`);
  },
  createVendorDetail: (data) => request('/admin/vendors', { method: 'POST', body: data }),
  updateVendorDetail: (id, data) => request(`/admin/vendors/${id}`, { method: 'PUT', body: data }),
  deleteVendorDetail: (id) => request(`/admin/vendors/${id}`, { method: 'DELETE' }),

  // Admin Payroll Entries
  getAllPayrollEntries: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/payroll-entries${query ? `?${query}` : ''}`);
  },
  createPayrollEntry: (data) => request('/admin/payroll-entries', { method: 'POST', body: data }),
  updatePayrollEntry: (id, data) => request(`/admin/payroll-entries/${id}`, { method: 'PUT', body: data }),
  deletePayrollEntry: (id) => request(`/admin/payroll-entries/${id}`, { method: 'DELETE' })
};
