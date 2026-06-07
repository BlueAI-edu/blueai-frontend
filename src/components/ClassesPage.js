// Backward-compat re-exports — App.js lazy-imports from this module.
// All component logic has been moved to focused files:
//   - src/pages/ClassesPage.js
//   - src/pages/ClassDetailPage.js
//   - src/pages/StudentDetailPage.js
//   - src/components/classes/CreateClassModal.jsx
//   - src/components/classes/EditClassModal.jsx
//   - src/components/classes/AddStudentModal.jsx
//   - src/components/classes/AssignAssessmentModal.jsx
//   - src/components/classes/ClassAnalyticsTab.jsx

export { ClassesPage } from '@/pages/ClassesPage';
export { ClassDetailPage } from '@/pages/ClassDetailPage';
export { StudentDetailPage } from '@/pages/StudentDetailPage';

export { default } from '@/pages/ClassesPage';
