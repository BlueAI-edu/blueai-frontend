import { useNavigate } from 'react-router-dom';
import { authApi } from '@/services/api';
import { BlueAILogo } from '@/components/ui/BlueAI-logo';
import { EntraConnectorPanel } from '@/components/EntraConnectorPanel';

/**
 * School admin console (#269 Phase A).
 *
 * The landing surface for the school_admin role — a school/MAT's named IT
 * contact. Deliberately not the teacher Navbar: school admins have no teacher
 * surface (assessments, classes, analytics all 403 for them). MVP scope is
 * the Entra connection + teacher/class provisioning for their organisation;
 * the backend scopes every call to their own org.
 */
export const SchoolAdminPage = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // best-effort — clear the client side regardless
    }
    navigate('/teacher/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BlueAILogo className="h-8 w-auto" />
            <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
              School Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name || user?.email}</span>
            <button
              onClick={handleLogout}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900" data-testid="school-admin-title">
          Your school on BlueAI
        </h1>
        <p className="mt-1 mb-6 text-sm text-gray-500 max-w-2xl">
          Connect your Microsoft tenant, then add your teachers and their classes from your directory.
        </p>
        <EntraConnectorPanel />
      </main>
    </div>
  );
};

export default SchoolAdminPage;
