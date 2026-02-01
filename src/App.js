import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';

// Page Components
import { LandingPage } from './pages/LandingPage';
import { AuthCallback } from './pages/AuthCallbackPage';
import { Login } from './pages/LoginPage';
import { JoinPage } from './pages/JoinPage';
import { AttemptPage } from './pages/AttemptPage';
import { TeacherDashboard } from './pages/TeacherDashboardPage';
import { QuestionsPage } from './pages/QuestionsPage';
import { EnhancedAssessmentBuilderPage } from './pages/EnhancedAssessmentBuilderPage';
import { EnhancedAttemptPage } from './pages/EnhancedAttemptPage';
import { EnhancedAssessmentDetailPage } from './pages/EnhancedAssessmentDetailPage';
import { EnhancedSubmissionDetailPage } from './pages/EnhancedSubmissionDetailPage';

// Shared Components
import { ProtectedRoute } from './components/ProtectedRoute';
import { AssessmentsPage, AssessmentDetailPage, SubmissionDetailPage, SecurityReportPage, ProfilePage } from './components/TeacherPages';
import { AdminDashboard } from './components/AdminPages';
import { AnalyticsPage } from './components/AnalyticsPage';
import { ClassesPage, ClassDetailPage } from './components/ClassesPage';
import { CSVImportPage } from './components/CSVImportPage';
import OCRUploadPage from './components/OCRUploadPage';
import OCRReviewPage from './components/OCRReviewPage';
import OCRModerationPage from './components/OCRModerationPage';

// Configure axios
axios.defaults.withCredentials = true;

// Main App Router
function App() {
  const location = useLocation();

  // Handle OAuth callback
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/join" element={<JoinPage />} />
      <Route path="/attempt/:attemptId" element={<AttemptPage />} />
      <Route path="/enhanced-attempt/:attemptId" element={<EnhancedAttemptPage />} />
      
      {/* Teacher Auth Routes */}
      <Route path="/teacher/login" element={<Login />} />
      
      {/* Protected Teacher Routes */}
      <Route path="/teacher/dashboard" element={<ProtectedRoute>{(user) => <TeacherDashboard user={user} />}</ProtectedRoute>} />
      <Route path="/teacher/questions" element={<ProtectedRoute>{(user) => <QuestionsPage user={user} />}</ProtectedRoute>} />
      <Route path="/teacher/assessments" element={<ProtectedRoute>{(user) => <AssessmentsPage user={user} />}</ProtectedRoute>} />
      <Route path="/teacher/assessments/create" element={<ProtectedRoute>{(user) => <EnhancedAssessmentBuilderPage user={user} />}</ProtectedRoute>} />
      <Route path="/teacher/assessments/:assessmentId/edit" element={<ProtectedRoute>{(user) => <EnhancedAssessmentBuilderPage user={user} />}</ProtectedRoute>} />
      <Route path="/teacher/assessments/:assessmentId" element={<ProtectedRoute>{(user) => <AssessmentDetailPage user={user} />}</ProtectedRoute>} />
      <Route path="/teacher/assessments/:assessmentId/enhanced" element={<ProtectedRoute>{(user) => <EnhancedAssessmentDetailPage user={user} />}</ProtectedRoute>} />
      <Route path="/teacher/submissions/:attemptId/enhanced" element={<ProtectedRoute>{(user) => <EnhancedSubmissionDetailPage user={user} />}</ProtectedRoute>} />
      <Route path="/teacher/assessments/:assessmentId/security-report" element={<ProtectedRoute>{(user) => <SecurityReportPage user={user} />}</ProtectedRoute>} />
      <Route path="/teacher/classes" element={<ProtectedRoute>{(user) => <ClassesPage user={user} />}</ProtectedRoute>} />
      <Route path="/teacher/classes/import" element={<ProtectedRoute>{(user) => <CSVImportPage user={user} />}</ProtectedRoute>} />
      <Route path="/teacher/classes/:classId" element={<ProtectedRoute>{(user) => <ClassDetailPage user={user} />}</ProtectedRoute>} />
      <Route path="/teacher/classes/:classId/import" element={<ProtectedRoute>{(user) => <CSVImportPage user={user} />}</ProtectedRoute>} />
      <Route path="/teacher/analytics" element={<ProtectedRoute>{(user) => <AnalyticsPage user={user} />}</ProtectedRoute>} />
      <Route path="/teacher/submissions/:submissionId" element={<ProtectedRoute>{(user) => <SubmissionDetailPage user={user} />}</ProtectedRoute>} />
      <Route path="/teacher/profile" element={<ProtectedRoute>{(user) => <ProfilePage user={user} />}</ProtectedRoute>} />
      <Route path="/teacher/ocr-upload" element={<ProtectedRoute>{(user) => <OCRUploadPage user={user} />}</ProtectedRoute>} />
      <Route path="/teacher/ocr-review/:submissionId" element={<ProtectedRoute>{(user) => <OCRReviewPage user={user} />}</ProtectedRoute>} />
      <Route path="/teacher/ocr-moderate/:submissionId" element={<ProtectedRoute>{(user) => <OCRModerationPage user={user} />}</ProtectedRoute>} />
      
      {/* Protected Admin Routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly={true}>{(user) => <AdminDashboard user={user} />}</ProtectedRoute>} />
      
      {/* Catch-all redirect to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// App Wrapper with Router
export default function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
