/**
 * Centralised Axios API client.
 *
 * All components should import named endpoint functions from this module
 * rather than calling axios directly. This keeps the base URL, CSRF header,
 * and global error handling in one place.
 *
 * Usage:
 *   import { teacherApi, publicApi } from '@/services/api';
 *   const assessments = await teacherApi.getAssessments();
 */
import axios from 'axios';
import { API } from '@/config';

const client = axios.create({ baseURL: API, withCredentials: true });

// Attach CSRF header on every mutating request (matches server.py expectation)
client.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// ─── Teacher endpoints ────────────────────────────────────────────────────────

export const teacherApi = {
  // Assessments
  getAssessments: () => client.get('/teacher/assessments'),
  getAssessment: (id) => client.get(`/teacher/assessments/${id}`),
  createAssessment: (data) => client.post('/teacher/assessments', data),
  deleteAssessment: (id) => client.delete(`/teacher/assessments/${id}`),
  startAssessment: (id) => client.post(`/teacher/assessments/${id}/start`),
  closeAssessment: (id) => client.post(`/teacher/assessments/${id}/close`),
  reopenAssessment: (id) => client.post(`/teacher/assessments/${id}/reopen`),
  publishAssessment: (id) => client.post(`/teacher/assessments/${id}/publish`),
  getDashboard: () => client.get(`${API}/teacher/dashboard`),

  // Enhanced assessments
  createEnhancedAssessment: (data) => client.post('/teacher/assessments/enhanced', data),
  getEnhancedAssessment: (id) => client.get(`/teacher/assessments/${id}/enhanced`),
  updateAssessmentQuestions: (id, data) => client.put(`/teacher/assessments/${id}/questions`, data),
  confirmOcr: (id) => client.post(`/teacher/assessments/${id}/confirm-ocr`),
  unlockOcr: (id) => client.post(`/teacher/assessments/${id}/unlock-ocr`),
  extractPastPaper: (formData) =>
    client.post('/teacher/assessments/extract-past-paper', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Assignments
  getAssignments: () => client.get('/teacher/assignments'),
  createAssignment: (assessmentId, data) =>
    client.post(`/teacher/assessments/${assessmentId}/assignments`, data),
  openAssignment: (id) => client.post(`/teacher/assignments/${id}/open`),
  closeAssignment: (id) => client.post(`/teacher/assignments/${id}/close`),
  deleteAssignment: (id) => client.delete(`/teacher/assignments/${id}`),
  getAssignmentSubmissions: (id) => client.get(`/teacher/assignments/${id}/submissions`),

  // Questions
  getQuestions: () => client.get('/teacher/questions'),
  createQuestion: (data) => client.post('/teacher/questions', data),
  updateQuestion: (id, data) => client.put(`/teacher/questions/${id}`, data),
  deleteQuestion: (id) => client.delete(`/teacher/questions/${id}`),
  generateQuestion: (data) => client.post('/teacher/questions/generate', data),

  // Templates
  getTemplates: () => client.get('/teacher/templates'),
  createTemplate: (data) => client.post('/teacher/templates', data),
  deleteTemplate: (id) => client.delete(`/teacher/templates/${id}`),
  useTemplate: (id) => client.post(`/teacher/templates/${id}/create-assessment`),

  // Classes
  getClasses: () => client.get('/teacher/classes'),
  createClass: (data) => client.post('/teacher/classes', data),
  updateClass: (id, data) => client.put(`/teacher/classes/${id}`, data),
  deleteClass: (id) => client.delete(`/teacher/classes/${id}`),
  getClassAssignments: (classId) => client.get(`/teacher/classes/${classId}/assignments`),

  // Students
  getStudent: (id) => client.get(`/teacher/students/${id}`),
  addStudent: (classId, data) => client.post(`/teacher/classes/${classId}/students`, data),
  updateStudent: (classId, studentId, data) =>
    client.put(`/teacher/classes/${classId}/students/${studentId}`, data),
  deleteStudent: (classId, studentId) =>
    client.delete(`/teacher/classes/${classId}/students/${studentId}`),

  // Submissions
  getAttempts: (assessmentId) => client.get(`/teacher/assessments/${assessmentId}/attempts`),
  getAttempt: (id) => client.get(`/teacher/attempts/${id}`),
  getEnhancedAttempt: (id) => client.get(`/teacher/submissions/${id}/enhanced`),
  markEnhancedAttempt: (id, data) => client.post(`/teacher/submissions/${id}/mark-enhanced`, data),
  autoMarkAttempt: (id) => client.post(`/teacher/submissions/${id}/auto-mark`),

  // Analytics
  getAnalytics: () => client.get('/teacher/analytics/dashboard'),
  getAssessmentAnalytics: (id) => client.get(`/teacher/analytics/assessment/${id}/full`),
  getMathAnalytics: (params) => client.get('/teacher/analytics/math-performance', { params }),

  // Usage
  getUsage: () => client.get('/teacher/usage'),

  // Profile
  getProfile: () => client.get('/teacher/profile'),
  updateProfile: (data) => client.put('/teacher/profile', data),
  changePassword: (data) => client.put('/teacher/change-password', data),
};

// ─── Public endpoints (student-facing) ───────────────────────────────────────

export const publicApi = {
  joinAssessment: (data) => client.post('/public/join', data),
  submitAnswer: (attemptId, data) => client.post(`/public/attempt/${attemptId}/submit`, data),
  submitEnhancedAnswer: (attemptId, data) =>
    client.post(`/public/enhanced-attempt/${attemptId}/submit`, data),
  getAttemptStatus: (attemptId) => client.get(`/public/attempt/${attemptId}/status`),
};

// ─── Admin endpoints ──────────────────────────────────────────────────────────

export const adminApi = {
  getTeachers: () => client.get('/admin/teachers'),
  updateTeacherRole: (teacherId, role) =>
    client.put(`/admin/teachers/${teacherId}/role`, null, { params: { role } }),
  getAllUsage: () => client.get('/admin/usage'),
  getUserUsage: (userId) => client.get(`/admin/usage/${userId}`),
  updateUserUsage: (userId, data) => client.put(`/admin/usage/${userId}`, data),
  resetUserUsage: (userId) => client.post(`/admin/usage/${userId}/reset`),
  getAllAssessments: () => client.get('/admin/assessments'),
};

// ─── Auth endpoints ───────────────────────────────────────────────────────────

export const authApi = {
  login: (data) => client.post('/auth/login', data),
  register: (data) => client.post('/auth/register', data),
  logout: () => client.post('/auth/logout'),
  getMe: () => client.get('/auth/me'),
  requestPasswordReset: (data) => client.post('/auth/forgot-password', data),
  confirmPasswordReset: (data) => client.post('/auth/reset-password', data),
  loginWithGoogle: (credential) =>
    client.post('/auth/google', {}, { headers: { Authorization: `Bearer ${credential}` } }),
  loginWithMicrosoft: (accessToken) =>
    client.post('/auth/microsoft', {}, { headers: { Authorization: `Bearer ${accessToken}` } }),
  updateProfile: (data) => client.put('/auth/profile', data),
  exportMyData: () => client.get('/auth/export', { responseType: 'blob' }),
  deleteMyAccount: () => client.delete('/auth/account'),
};

// Default export for direct use when only one-off calls are needed
export default client;
