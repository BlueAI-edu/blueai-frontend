import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/config';
import { Navbar } from './Navbar';
import StudentPerformancePanel from '@/components/analytics/StudentPerformancePanel';
import AssessmentInsightsPanel from '@/components/analytics/AssessmentInsightsPanel';
import InterventionPanel from '@/components/analytics/InterventionPanel';
import MathAnalyticsPanel from '@/components/analytics/MathAnalyticsPanel';
import CostsPanel from '@/components/analytics/CostsPanel';
import StudentProfileModal from '@/components/analytics/StudentProfileModal';

// Main Analytics Page
export const AnalyticsPage = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Data states
  const [overview, setOverview] = useState(null);
  const [studentsData, setStudentsData] = useState(null);
  const [assessmentsData, setAssessmentsData] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    loadAnalyticsData();
    loadClasses();
  }, []);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const [overviewRes, studentsRes, assessmentsRes] = await Promise.all([
        axios.get(`${API}/teacher/analytics/overview`),
        axios.get(`${API}/teacher/analytics/students`),
        axios.get(`${API}/teacher/analytics/assessments`)
      ]);

      setOverview(overviewRes.data);
      setStudentsData(studentsRes.data);
      setAssessmentsData(assessmentsRes.data.assessments);
    } catch (error) {
    }
    setLoading(false);
  };

  const loadClasses = async () => {
    try {
      const response = await axios.get(`${API}/teacher/classes`);
      setClasses(response.data.classes || []);
    } catch (error) {
    }
  };

  const loadStudentProfile = async (studentName) => {
    try {
      const response = await axios.get(`${API}/teacher/analytics/student/${encodeURIComponent(studentName)}`);
      setStudentProfile(response.data);
      setSelectedStudent(studentName);
    } catch (error) {
    }
  };

  const generateInsights = async () => {
    setInsightsLoading(true);
    try {
      const response = await axios.post(`${API}/teacher/analytics/generate-insights`);
      setAiInsights(response.data);
    } catch (error) {
    }
    setInsightsLoading(false);
  };

  const exportCSV = async () => {
    try {
      const response = await axios.get(`${API}/teacher/analytics/export/csv`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'analytics_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
    }
  };

  const exportPDF = async () => {
    try {
      const response = await axios.get(`${API}/teacher/analytics/export/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'class_analytics.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
    }
  };

  const exportStudentPDF = async (studentName) => {
    try {
      const response = await axios.get(`${API}/teacher/analytics/student/${encodeURIComponent(studentName)}/export-pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${studentName}_analytics.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900" data-testid="analytics-title">Analytics Dashboard</h2>
            <p className="text-gray-600">Track student performance and identify areas for intervention</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportCSV}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              data-testid="export-csv-btn"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
            <button
              onClick={exportPDF}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              data-testid="export-pdf-btn"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'students'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Student Performance
          </button>
          <button
            onClick={() => setActiveTab('assessments')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'assessments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Assessment Analysis
          </button>
          <button
            onClick={() => setActiveTab('math')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'math'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Math Analytics
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'support'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Intervention Support
          </button>
          <button
            onClick={() => setActiveTab('costs')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'costs'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Costs
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'students' && (
          <StudentPerformancePanel
            students={studentsData?.students || []}
            heatmapData={studentsData?.heatmap}
            onStudentClick={loadStudentProfile}
          />
        )}

        {activeTab === 'assessments' && (
          <AssessmentInsightsPanel assessments={assessmentsData} />
        )}

        {activeTab === 'math' && (
          <MathAnalyticsPanel
            classes={classes}
            assessments={assessmentsData}
          />
        )}

        {activeTab === 'support' && (
          <InterventionPanel
            overview={overview}
            aiInsights={aiInsights}
            onGenerateInsights={generateInsights}
            loading={insightsLoading}
          />
        )}

        {activeTab === 'costs' && <CostsPanel />}
      </div>

      {/* Student Profile Modal */}
      {selectedStudent && studentProfile && (
        <StudentProfileModal
          student={studentProfile}
          onClose={() => {
            setSelectedStudent(null);
            setStudentProfile(null);
          }}
          onExportPDF={() => exportStudentPDF(selectedStudent)}
        />
      )}
    </div>
  );
};
