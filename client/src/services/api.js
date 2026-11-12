import axios from 'axios';

export const normalizeApiBaseUrl = (rawValue) => {
  const fallback = 'http://localhost:5000/api';
  const value = (rawValue || fallback).trim();

  if (!value) {
    return fallback;
  }

  const normalized = value.replace(/\/+$/, '');
  return /\/api$/i.test(normalized) ? normalized : `${normalized}/api`;
};

const API_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gradlink_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('gradlink_token');
      localStorage.removeItem('gradlink_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper to extract error message
export const getErrorMessage = (error) => {
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return 'The server is taking too long to respond. This can happen when the server is starting up. Please wait a moment and try again.';
  }
  return error?.response?.data?.message || error?.message || 'An unexpected error occurred.';
};

/**
 * Pings the backend health endpoint to pre-warm a cold Render instance.
 * Silently ignores failures — this is best-effort only.
 */
export const pingBackend = () => {
  api.get('/health', { timeout: 15000 }).catch(() => {});
};

// --- Auth API ---
export const authApi = {
  // Registration uses a longer timeout (60 s) because:
  // 1. Render free tier can take 10–30 s to cold-start.
  // 2. MongoDB connection is established on first request.
  // The email is now sent in the background so SMTP latency no longer adds to this.
  register: (data) => api.post('/auth/register', data, { timeout: 60000 }),
  login: (data) => api.post('/auth/login', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resendOTP: (data) => api.post('/auth/resend-otp', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// --- Profile API ---
export const profileApi = {
  getMyProfile: () => api.get('/profile/me'),
  updateMyProfile: (data) => api.put('/profile/me', data),
  getAlumniDirectory: (params) => api.get('/profile/alumni', { params }),
  getAlumniProfile: (id) => api.get(`/profile/alumni/${id}`),
  getStudentProfile: (id) => api.get(`/profile/student/${id}`),
  requestDeactivation: () => api.post('/profile/deactivate-request'),
};

// --- Mentorship API ---
export const mentorshipApi = {
  createRequest: (data) => api.post('/mentorship', data),
  getRequests: (params) => api.get('/mentorship', { params }),
  updateStatus: (id, data) => api.patch(`/mentorship/${id}/status`, data),
  adminGetAll: (params) => api.get('/mentorship/admin/all', { params }),
};

// --- Jobs API ---
export const jobsApi = {
  createJob: (data) => api.post('/jobs', data),
  getJobs: (params) => api.get('/jobs', { params }),
  getJob: (id) => api.get(`/jobs/${id}`),
  updateJob: (id, data) => api.put(`/jobs/${id}`, data),
  deleteJob: (id) => api.delete(`/jobs/${id}`),
  reviewJob: (id, data) => api.patch(`/jobs/${id}/review`, data),
  getPendingJobs: () => api.get('/jobs/pending'),
  saveJob: (id) => api.post(`/jobs/${id}/save`),
  unsaveJob: (id) => api.delete(`/jobs/${id}/save`),
  getSavedJobs: () => api.get('/jobs/saved'),
  applyToJob: (id, data) => api.post(`/jobs/${id}/apply`, data),
  confirmExternalApplication: (id) => api.post(`/jobs/${id}/confirm-external`),
  getMyApplications: () => api.get('/jobs/my-applications'),
  getJobApplications: (id, params) => api.get(`/jobs/${id}/applications`, { params }),
  updateApplicationStatus: (id, data) => api.patch(`/jobs/applications/${id}/status`, data),
  downloadApplicationPDF: (id) => api.get(`/jobs/applications/${id}/pdf`, { responseType: 'blob' }),
  getMyJobSubmissions: () => api.get('/jobs/my-submissions'),
};

// --- Notifications API ---
export const notificationsApi = {
  get: (params) => api.get('/notifications', { params }),
  markAllRead: () => api.patch('/notifications/read-all'),
  markOneRead: (id) => api.patch(`/notifications/${id}/read`),
};

// --- Updates API ---
export const updatesApi = {
  createPlacementUpdate: (data) => api.post('/updates/placement', data),
  getPlacementUpdates: () => api.get('/updates/placement'),
  updatePlacementUpdate: (id, data) => api.put(`/updates/placement/${id}`, data),
  deletePlacementUpdate: (id) => api.delete(`/updates/placement/${id}`),
  publishPlacementUpdate: (id) => api.patch(`/updates/placement/${id}/publish`),
  createEvent: (data) => api.post('/updates/events', data),
  getEvents: () => api.get('/updates/events'),
  updateEvent: (id, data) => api.put(`/updates/events/${id}`, data),
  deleteEvent: (id) => api.delete(`/updates/events/${id}`),
  publishEvent: (id) => api.patch(`/updates/events/${id}/publish`),
};

// --- Professional Updates API ---
export const professionalUpdatesApi = {
  create: (data) => api.post('/professional-updates', data),
  getAll: (params) => api.get('/professional-updates', { params }),
  getMine: () => api.get('/professional-updates/mine'),
  edit: (id, data) => api.put(`/professional-updates/${id}`, data),
  delete: (id) => api.delete(`/professional-updates/${id}`),
  review: (id, data) => api.patch(`/professional-updates/${id}/review`, data),
};

// --- Resume API ---
export const resumeApi = {
  analyze: (formData) => api.post('/resume/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  }),
  getMyAnalyses: () => api.get('/resume/my-analyses'),
  deleteAnalysis: (id) => api.delete(`/resume/${id}`),
  downloadFile: (fileId) => api.get(`/resume/download/${fileId}`, { responseType: 'blob' }),
};

// --- Admin API ---
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  deactivateUser: (id) => api.patch(`/admin/users/${id}/deactivate`),
  reactivateUser: (id) => api.patch(`/admin/users/${id}/reactivate`),
  toggleMentorshipRestrict: (id) => api.patch(`/admin/users/${id}/mentorship-restrict`),
  resetPassword: (id, data) => api.patch(`/admin/users/${id}/reset-password`, data),
  getAllApplications: (params) => api.get('/admin/applications', { params }),
  exportStudentsCSV: () => api.get('/admin/reports/students-csv', { responseType: 'blob' }),
  exportStudentProfilePDF: (id) => api.get(`/admin/reports/student-profile-pdf/${id}`, { responseType: 'blob' }),
};

export default api;
