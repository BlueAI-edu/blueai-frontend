import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { handleApiError, showSuccess } from "@/lib/handle-error";
import { teacherApi, authApi } from "@/services/api";
import { useAsync } from "@/hooks/use-async";
import { Navbar } from "@/components/Navbar";

// Teacher Profile Page
export const ProfilePage = ({ user, onProfileUpdate }) => {
  const [profile, setProfile] = useState({
    name: user.name || "",
    display_name: user.display_name || "",
    school_name: user.school_name || "",
    department: user.department || "",
  });
  const [runSave, saving] = useAsync();
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [questionsRes, assessmentsRes, classesRes] = await Promise.all([
        teacherApi.getQuestions(),
        teacherApi.getAssessments(),
        teacherApi.getClasses(),
      ]);

      // Calculate stats
      const totalQuestions = questionsRes.data.length;
      const totalAssessments = assessmentsRes.data.length;
      const totalClasses = (classesRes.data.classes || []).length;
      const activeAssessments = assessmentsRes.data.filter(
        (a) => a.status === "started",
      ).length;

      setStats({
        totalQuestions,
        totalAssessments,
        totalClasses,
        activeAssessments,
      });
    } catch (error) {
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    return runSave(
      async () => {
        await authApi.updateProfile(profile);
        showSuccess("Profile updated successfully!");
        if (onProfileUpdate) {
          onProfileUpdate({ ...user, ...profile });
        }
      },
      (e) => handleApiError(e, "Failed to update profile"),
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate("/teacher/dashboard")}
          className="text-sm text-gray-600 hover:text-blue-600 mb-4 flex items-center gap-1"
        >
          ← Back to Dashboard
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Form */}
          <div className="md:col-span-2 bg-white p-6 rounded-lg shadow">
            <h2
              className="text-xl font-bold text-gray-900 mb-6"
              data-testid="profile-title"
            >
              Profile Settings
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                  data-testid="profile-name-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name (shown on reports)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={profile.display_name}
                  onChange={(e) =>
                    setProfile({ ...profile, display_name: e.target.value })
                  }
                  placeholder="e.g., Mr. Smith, Ms. Johnson"
                  data-testid="profile-display-name-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  School Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={profile.school_name}
                  onChange={(e) =>
                    setProfile({ ...profile, school_name: e.target.value })
                  }
                  data-testid="profile-school-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={profile.department}
                  onChange={(e) =>
                    setProfile({ ...profile, department: e.target.value })
                  }
                  placeholder="e.g., Science, Mathematics"
                  data-testid="profile-department-input"
                />
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  data-testid="save-profile-btn"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Account Information
              </h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  <span className="font-medium">Email:</span> {user.email}
                </p>
                <p>
                  <span className="font-medium">Role:</span> {user.role}
                </p>
                <p>
                  <span className="font-medium">Auth Provider:</span>{" "}
                  {user.auth_provider || "Email"}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Your Stats
              </h3>
              {stats ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Questions Created</span>
                    <span
                      className="text-2xl font-bold text-blue-600"
                      data-testid="stat-questions"
                    >
                      {stats.totalQuestions}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Assessments</span>
                    <span
                      className="text-2xl font-bold text-green-600"
                      data-testid="stat-assessments"
                    >
                      {stats.totalAssessments}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active Assessments</span>
                    <span
                      className="text-2xl font-bold text-amber-600"
                      data-testid="stat-active"
                    >
                      {stats.activeAssessments}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Classes</span>
                    <span
                      className="text-2xl font-bold text-purple-600"
                      data-testid="stat-classes"
                    >
                      {stats.totalClasses}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Loading stats...</p>
              )}
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-lg shadow text-white">
              <h3 className="font-semibold mb-2">Quick Tips</h3>
              <ul className="text-sm space-y-2 text-blue-100">
                <li>• Set your display name for professional PDF reports</li>
                <li>• Add your school name to personalize feedback</li>
                <li>• Link assessments to classes for better tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
