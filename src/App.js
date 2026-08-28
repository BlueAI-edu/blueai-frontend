import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import axios from 'axios';
import { Toaster } from '@/components/ui/toaster';
import { PageLoader } from '@/components/common';
import ErrorBoundary from '@/components/ErrorBoundary';
import './Chunkerrorhandler'; // Import chunk error handler (runs on load)

const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage').then(m => ({ default: m.TermsOfServicePage })));
const Login = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.Login })));
const JoinPage = lazy(() => import('./pages/JoinPage').then(m => ({ default: m.JoinPage })));
const AttemptPage = lazy(() => import('./pages/AttemptPage').then(m => ({ default: m.AttemptPage })));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboardPage').then(m => ({ default: m.TeacherDashboard })));
const QuestionsPage = lazy(() => import('./pages/QuestionsPage').then(m => ({ default: m.QuestionsPage })));
const EnhancedAssessmentBuilderPage = lazy(() => import('./pages/EnhancedAssessmentBuilderPage').then(m => ({ default: m.EnhancedAssessmentBuilderPage })));
const EnhancedAttemptPage = lazy(() => import('./pages/EnhancedAttemptPage').then(m => ({ default: m.EnhancedAttemptPage })));
const EnhancedAssessmentDetailPage = lazy(() => import('./pages/EnhancedAssessmentDetailPage').then(m => ({ default: m.EnhancedAssessmentDetailPage })));
const EnhancedSubmissionDetailPage = lazy(() => import('./pages/EnhancedSubmissionDetailPage').then(m => ({ default: m.EnhancedSubmissionDetailPage })));
const AssessmentAnalyticsPage = lazy(() => import('./pages/AssessmentAnalyticsPage').then(m => ({ default: m.AssessmentAnalyticsPage })));

const AssessmentsPage = lazy(() => import('./components/TeacherPages').then(m => ({ default: m.AssessmentsPage })));
const AssessmentDetailPage = lazy(() => import('./components/TeacherPages').then(m => ({ default: m.AssessmentDetailPage })));
const SubmissionDetailPage = lazy(() => import('./components/TeacherPages').then(m => ({ default: m.SubmissionDetailPage })));
const SecurityReportPage = lazy(() => import('./components/TeacherPages').then(m => ({ default: m.SecurityReportPage })));
const ProfilePage = lazy(() => import('./components/TeacherPages').then(m => ({ default: m.ProfilePage })));

const AdminDashboard = lazy(() => import('./components/AdminPages').then(m => ({ default: m.AdminDashboard })));
const SchoolAdminPage = lazy(() => import('./pages/SchoolAdminPage').then(m => ({ default: m.SchoolAdminPage })));
const AnalyticsPage = lazy(() => import('./components/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const ClassesPage = lazy(() => import('./components/ClassesPage').then(m => ({ default: m.ClassesPage })));
const ClassDetailPage = lazy(() => import('./components/ClassesPage').then(m => ({ default: m.ClassDetailPage })));
const StudentDetailPage = lazy(() => import('./components/ClassesPage').then(m => ({ default: m.StudentDetailPage })));
const CSVImportPage = lazy(() => import('./components/CSVImportPage').then(m => ({ default: m.CSVImportPage })));
const OCRUploadPage = lazy(() => import('./components/OCRUploadPage').then(m => ({ default: m.default || m.OCRUploadPage })));
const OCRReviewPage = lazy(() => import('./components/OCRReviewPage').then(m => ({ default: m.default || m.OCRReviewPage })));
const OCRModerationPage = lazy(() => import('./components/OCRModerationPage').then(m => ({ default: m.default || m.OCRModerationPage })));
const BulkUploadPage = lazy(() => import('./components/BulkUploadPage').then(m => ({ default: m.default || m.BulkUploadPage })));
const BulkUploadReviewPage = lazy(() => import('./components/BulkUploadReviewPage').then(m => ({ default: m.default || m.BulkUploadReviewPage })));
const HelpPage = lazy(() => import('./pages/HelpPage').then(m => ({ default: m.HelpPage })));

const ProtectedRoute = lazy(() => import('./components/ProtectedRoute').then(m => ({ default: m.ProtectedRoute })));

axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const LazyProtectedRoute = ({ children, adminOnly = false, roles = null }) => {
  return (
    <Suspense fallback={<PageLoader />}>
      <ProtectedRoute adminOnly={adminOnly} roles={roles}>
        {(user) => children(user)}
      </ProtectedRoute>
    </Suspense>
  );
};

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/attempt/:attemptId" element={<AttemptPage />} />
        <Route path="/enhanced-attempt/:attemptId" element={<EnhancedAttemptPage />} />
        
        <Route path="/teacher/login" element={<Login />} />
        
        <Route path="/teacher/dashboard" element={<LazyProtectedRoute>{(user) => <TeacherDashboard user={user} />}</LazyProtectedRoute>} />
        <Route path="/teacher/questions" element={<LazyProtectedRoute>{(user) => <QuestionsPage user={user} />}</LazyProtectedRoute>} />
        <Route path="/teacher/assessments" element={<LazyProtectedRoute>{(user) => <AssessmentsPage user={user} />}</LazyProtectedRoute>} />
        <Route path="/teacher/assessments/create" element={<LazyProtectedRoute>{(user) => <EnhancedAssessmentBuilderPage user={user} />}</LazyProtectedRoute>} />
        <Route path="/teacher/assessments/:assessmentId/edit" element={<LazyProtectedRoute>{(user) => <EnhancedAssessmentBuilderPage user={user} />}</LazyProtectedRoute>} />
        <Route path="/teacher/assessments/:assessmentId" element={<LazyProtectedRoute>{(user) => <AssessmentDetailPage user={user} />}</LazyProtectedRoute>} />
        <Route path="/teacher/assessments/:assessmentId/enhanced" element={<LazyProtectedRoute>{(user) => <EnhancedAssessmentDetailPage user={user} />}</LazyProtectedRoute>} />
        <Route path="/teacher/assessments/:assessmentId/analytics" element={<LazyProtectedRoute>{(user) => <AssessmentAnalyticsPage user={user} />}</LazyProtectedRoute>} />
        <Route path="/teacher/submissions/:attemptId/enhanced" element={<LazyProtectedRoute>{(user) => <EnhancedSubmissionDetailPage user={user} />}</LazyProtectedRoute>} />
        <Route path="/teacher/assessments/:assessmentId/security-report" element={<LazyProtectedRoute>{(user) => <SecurityReportPage user={user} />}</LazyProtectedRoute>} />
        <Route path="/teacher/classes" element={<LazyProtectedRoute>{(user) => <ClassesPage user={user} />}</LazyProtectedRoute>} />
        <Route path="/teacher/classes/import" element={<LazyProtectedRoute>{(user) => <CSVImportPage user={user} />}</LazyProtectedRoute>} />
        <Route path="/teacher/classes/:classId" element={<LazyProtectedRoute>{(user) => <ClassDetailPage user={user} />}</LazyProtectedRoute>} />
        <Route path="/teacher/classes/:classId/import" element={<LazyProtectedRoute>{(user) => <CSVImportPage user={user} />}</LazyProtectedRoute>} />
        <Route path="/teacher/students/:studentId" element={<LazyProtectedRoute>{(user) => <StudentDetailPage user={user} />}</LazyProtectedRoute>} />
        <Route path="/teacher/analytics" element={<LazyProtectedRoute>{(user) => <AnalyticsPage user={user} />}</LazyProtectedRoute>} />
        <Route path="/teacher/submissions/:submissionId" element={<LazyProtectedRoute>{(user) => <SubmissionDetailPage user={user} />}</LazyProtectedRoute>} />
        <Route path="/teacher/profile" element={<LazyProtectedRoute>{(user) => <ProfilePage user={user} />}</LazyProtectedRoute>} />
        <Route path="/teacher/ocr-upload" element={<LazyProtectedRoute>{(user) => <OCRUploadPage user={user} />}</LazyProtectedRoute>} />
        <Route path="/teacher/ocr-review/:submissionId" element={<LazyProtectedRoute>{(user) => <OCRReviewPage user={user} />}</LazyProtectedRoute>} />
        <Route path="/teacher/ocr-moderate/:submissionId" element={<LazyProtectedRoute>{(user) => <OCRModerationPage user={user} />}</LazyProtectedRoute>} />
        <Route path="/teacher/ocr-bulk-upload" element={<LazyProtectedRoute>{(user) => <BulkUploadPage user={user} />}</LazyProtectedRoute>} />
        <Route path="/teacher/ocr-bulk-review/:batchId" element={<LazyProtectedRoute>{(user) => <BulkUploadReviewPage user={user} />}</LazyProtectedRoute>} />
        <Route path="/teacher/help" element={<LazyProtectedRoute>{(user) => <HelpPage user={user} />}</LazyProtectedRoute>} />
        <Route path="/admin/dashboard" element={<LazyProtectedRoute adminOnly={true}>{(user) => <AdminDashboard user={user} />}</LazyProtectedRoute>} />
        <Route path="/school-admin" element={<LazyProtectedRoute roles={['school_admin', 'admin']}>{(user) => <SchoolAdminPage user={user} />}</LazyProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

/**
 * AppWrapper with ErrorBoundary
 * Wraps the entire app with error handling:
 * - ErrorBoundary catches React rendering errors
 * - chunkErrorHandler catches chunk loading errors
 * - Provides fallback UI instead of the crash popup
 */
export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        <Toaster />
      </BrowserRouter>
    </ErrorBoundary>
  );
}