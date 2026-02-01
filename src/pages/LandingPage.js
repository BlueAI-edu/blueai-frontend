import { useNavigate } from 'react-router-dom';

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full" data-testid="landing-container">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2" data-testid="landing-title">BlueAI Assessment</h1>
          <p className="text-gray-600">AI-Powered Assessment Platform</p>
        </div>

        <div className="space-y-4">
          <button
            data-testid="student-join-btn"
            onClick={() => navigate('/join')}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Student Join
          </button>

          <button
            data-testid="teacher-login-btn"
            onClick={() => navigate('/teacher/login')}
            className="w-full bg-white text-blue-600 py-3 px-6 rounded-lg font-medium border-2 border-blue-600 hover:bg-blue-50 transition-colors"
          >
            Teacher Login
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          Students: Join with your assessment code<br />
          Teachers: Login to create and manage assessments
        </p>
      </div>
    </div>
  );
};
