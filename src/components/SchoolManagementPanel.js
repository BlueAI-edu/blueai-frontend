import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API } from '@/config';
import { handleApiError, showSuccess } from '@/lib/handle-error';
import { LoadingSpinner } from '@/components/common';

/**
 * School Admin console — teacher/class visibility (#307).
 *
 * The Entra connector panel (EntraConnectorPanel.js, #269) lets a
 * school_admin CONNECT their tenant and PROVISION new teachers/classes; this
 * panel is the missing other half — viewing and lightly managing the
 * teachers/classes/students that already exist in BlueAI once provisioned.
 * Every request is scoped server-side to the caller's own organisation
 * (routes/school_admin_routes.py) — this component never sends an
 * organisation_id of its own when used as the school_admin, matching
 * EntraConnectorPanel's dual-use convention (pass organisationId only when
 * reused from the platform Admin Dashboard's Organisations tab).
 */
export function SchoolManagementPanel({ organisationId = null }) {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [misconceptions, setMisconceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedClass, setExpandedClass] = useState(null);
  const [roster, setRoster] = useState(null);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const orgParams = useCallback(
    (extra = {}) => ({
      params: organisationId ? { organisation_id: organisationId, ...extra } : extra,
    }),
    [organisationId]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [teachersRes, classesRes, misconceptionsRes] = await Promise.all([
        axios.get(`${API}/admin/school/teachers`, orgParams()),
        axios.get(`${API}/admin/school/classes`, orgParams()),
        axios.get(`${API}/admin/school/misconceptions`, orgParams()),
      ]);
      setTeachers(teachersRes.data.teachers || []);
      setClasses(classesRes.data.classes || []);
      setMisconceptions(misconceptionsRes.data.misconceptions || []);
    } catch (error) {
      handleApiError(error, 'Failed to load your school');
    } finally {
      setLoading(false);
    }
  }, [orgParams]);

  useEffect(() => { load(); }, [load]);

  const toggleRoster = async (classId) => {
    if (expandedClass === classId) {
      setExpandedClass(null);
      setRoster(null);
      return;
    }
    setExpandedClass(classId);
    setRoster(null);
    setRosterLoading(true);
    try {
      const res = await axios.get(`${API}/admin/school/classes/${classId}/students`, orgParams());
      setRoster(res.data.students || []);
    } catch (error) {
      handleApiError(error, 'Failed to load class roster');
      setExpandedClass(null);
    } finally {
      setRosterLoading(false);
    }
  };

  const handleRemoveTeacher = async (teacherId, teacherName) => {
    if (!window.confirm(
      `Remove ${teacherName} from your school? Their classes and assessments are kept — they'll just become an unaffiliated individual account.`
    )) return;
    setRemovingId(teacherId);
    try {
      await axios.delete(`${API}/admin/school/teachers/${teacherId}`, orgParams());
      showSuccess(`${teacherName} removed from your school`);
      await load();
    } catch (error) {
      handleApiError(error, 'Failed to remove teacher');
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8 mt-8">
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Teachers ({teachers.length})</h2>
        {teachers.length === 0 ? (
          <p className="text-sm text-gray-500">No teachers yet — provision some from your directory above.</p>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Name</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Email</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Classes</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Assessments</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teachers.map((t) => (
                  <tr key={t.user_id}>
                    <td className="px-4 py-2 text-gray-900">{t.name}</td>
                    <td className="px-4 py-2 text-gray-600">{t.email}</td>
                    <td className="px-4 py-2 text-gray-600">{t.class_count}</td>
                    <td className="px-4 py-2 text-gray-600">{t.assessment_count}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleRemoveTeacher(t.user_id, t.name)}
                        disabled={removingId === t.user_id}
                        className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        {removingId === t.user_id ? 'Removing…' : 'Remove from school'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Classes ({classes.length})</h2>
        {classes.length === 0 ? (
          <p className="text-sm text-gray-500">No classes yet — import some when provisioning teachers above.</p>
        ) : (
          <div className="space-y-2">
            {classes.map((c) => (
              <div key={c.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleRoster(c.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.class_name}</p>
                    <p className="text-xs text-gray-500">{c.teacher_name} · {c.student_count} student{c.student_count === 1 ? '' : 's'}</p>
                  </div>
                  <span className="text-xs text-gray-400">{expandedClass === c.id ? 'Hide roster ▲' : 'View roster ▼'}</span>
                </button>
                {expandedClass === c.id && (
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                    {rosterLoading ? (
                      <LoadingSpinner size={20} />
                    ) : roster && roster.length > 0 ? (
                      <ul className="text-sm text-gray-700 space-y-1">
                        {roster.map((s) => (
                          <li key={s.id}>{s.preferred_name || s.first_name} {s.last_name}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No students in this class yet.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Misconceptions Across Your School</h2>
        <p className="text-xs text-gray-500 mb-3">
          Read-only — misconceptions are reviewed and confirmed by each teacher on their own assessment;
          this is a school-wide view of patterns across all your teachers, not something to action here.
        </p>
        {misconceptions.length === 0 ? (
          <p className="text-sm text-gray-500">No misconceptions detected yet across your school.</p>
        ) : (
          <div className="space-y-2">
            {misconceptions.map((m) => (
              <div key={m.canonical_tag} className="border border-gray-200 rounded-lg px-4 py-3">
                <p className="text-sm font-medium text-gray-900">{m.description}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {m.topic}{m.subtopic ? ` · ${m.subtopic}` : ''} · affects {m.affected_student_count} student{m.affected_student_count === 1 ? '' : 's'} across your school ({m.occurrence_count} occurrence{m.occurrence_count === 1 ? '' : 's'})
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default SchoolManagementPanel;
