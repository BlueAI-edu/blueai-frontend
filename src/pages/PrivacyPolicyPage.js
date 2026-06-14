import { useNavigate } from 'react-router-dom';

export function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 font-semibold text-lg hover:text-blue-800"
        >
          BlueAI Assess
        </button>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: June 2025</p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-amber-800">
            <strong>Early access notice:</strong> BlueAI is currently in early-stage beta. This Privacy Policy
            reflects our current data practices and may change as the platform evolves. We reserve the right
            to update this policy at any time. Where changes are material, we will notify users by email or
            by posting a prominent notice on the platform.
          </p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Who We Are</h2>
            <p>
              BlueAI Assess ("BlueAI", "we", "us", "our") is an AI-assisted educational assessment platform
              built for secondary schools and tuition centres. We provide tools that allow teachers to set
              assessments, have student responses marked by AI, and review results with written feedback.
            </p>
            <p className="mt-2">
              For the purposes of UK GDPR, BlueAI acts as a <strong>data processor</strong> on behalf of
              schools and educational organisations, which are the data controllers responsible for their
              students' and teachers' personal data.
            </p>
            <p className="mt-2">
              You can contact us at: <a href="mailto:hello@blueai.app" className="text-blue-600 hover:underline">hello@blueai.app</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. What Data We Collect</h2>

            <h3 className="text-base font-semibold text-gray-800 mb-2">Teacher accounts</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Name, email address, school name, department</li>
              <li>Account credentials (passwords are hashed and never stored in plain text)</li>
              <li>Assessment content you create (questions, mark schemes, uploaded PDFs)</li>
              <li>Class lists and student records you import or enter</li>
              <li>Usage activity (number of assessments run, AI marking calls made, PDFs exported)</li>
              <li>Session data (login times, session tokens stored in secure httpOnly cookies)</li>
            </ul>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">Student submissions</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Student name and school email address (provided by the teacher via class list)</li>
              <li>Answers submitted during an assessment</li>
              <li>AI-generated marks and written feedback</li>
              <li>Timestamps of when assessments were joined and submitted</li>
              <li>Optional: candidate number, SEN flag, pupil premium flag, EAL flag (if your school imports these)</li>
            </ul>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">Uploaded documents</h3>
            <p className="text-sm">
              If you use our OCR or past-paper extraction features, uploaded PDF files and any extracted
              images are processed transiently and are not permanently stored on our servers after
              extraction is complete. Extracted question content and any cropped diagrams are stored within
              your assessment record in our database.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Data</h2>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>To provide and operate the BlueAI platform</li>
              <li>To process and mark student assessment responses using AI</li>
              <li>To generate feedback reports and analytics for teachers</li>
              <li>To manage your account, authentication, and session security</li>
              <li>To send transactional emails (password resets, account notifications)</li>
              <li>To enforce usage quotas and account tier limits</li>
              <li>To monitor platform reliability and investigate errors</li>
            </ul>
            <p className="mt-3 text-sm">
              We do not sell your personal data. We do not use student data for advertising or for training
              AI models beyond the immediate marking task.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Third-Party Services</h2>
            <p className="text-sm mb-3">
              BlueAI relies on the following third-party services to operate. Where student or teacher data
              is passed to these services, it is done only to the extent necessary to provide the platform.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold text-gray-800">Service</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-800">Purpose</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-800">Data shared</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 font-medium">OpenAI (GPT-4o)</td>
                    <td className="px-4 py-3">AI marking, feedback generation, OCR cleanup, past-paper extraction</td>
                    <td className="px-4 py-3">Student answers, question content, mark schemes</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-3 font-medium">MongoDB Atlas</td>
                    <td className="px-4 py-3">Database storage for all platform data</td>
                    <td className="px-4 py-3">All stored data (accounts, assessments, submissions)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Resend</td>
                    <td className="px-4 py-3">Transactional email (password resets)</td>
                    <td className="px-4 py-3">Teacher email address</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-3 font-medium">Microsoft Azure AD</td>
                    <td className="px-4 py-3">Single sign-on for schools using Microsoft 365</td>
                    <td className="px-4 py-3">Name, email (from Microsoft token)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Google OAuth</td>
                    <td className="px-4 py-3">Single sign-on via Google</td>
                    <td className="px-4 py-3">Name, email (from Google token)</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-3 font-medium">PostHog</td>
                    <td className="px-4 py-3">Product analytics on teacher sessions</td>
                    <td className="px-4 py-3">Anonymised usage events (page views, feature interactions)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Retention</h2>
            <p className="text-sm">
              We retain your data for as long as your account is active or as needed to provide the service.
              Teacher accounts and all associated data (assessments, student submissions, classes) are deleted
              when you delete your account. Session tokens expire after 24 hours. Password reset tokens
              expire after a short period.
            </p>
            <p className="mt-2 text-sm">
              We are in the process of implementing automated data retention policies. Until these are in
              place, data retention is managed manually. If you have specific data retention requirements
              (for example, under your school's data handling policy), please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Your Rights (UK GDPR)</h2>
            <p className="text-sm mb-3">Under UK GDPR, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
              <li><strong>Portability</strong> — export your data in a machine-readable format (available on your Profile page)</li>
              <li><strong>Erasure</strong> — request deletion of your account and all associated data (available on your Profile page)</li>
              <li><strong>Rectification</strong> — correct inaccurate information we hold about you</li>
              <li><strong>Restriction</strong> — ask us to restrict processing of your data in certain circumstances</li>
              <li><strong>Object</strong> — object to processing based on legitimate interests</li>
            </ul>
            <p className="mt-3 text-sm">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:hello@blueai.app" className="text-blue-600 hover:underline">hello@blueai.app</a>.
              We will respond within 30 days. If you are unsatisfied with our response, you have the right
              to lodge a complaint with the Information Commissioner's Office (ICO) at{' '}
              <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ico.org.uk</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Cookies and Tracking</h2>
            <p className="text-sm">
              BlueAI uses cookies for session management. These are httpOnly, secure cookies that are
              required for the platform to function — they are not advertising or tracking cookies.
            </p>
            <p className="mt-2 text-sm">
              We use PostHog for analytics on teacher sessions (not student sessions). PostHog may set
              cookies or use local storage. We do not use cookies for advertising or sell analytics data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Security</h2>
            <p className="text-sm">
              We take reasonable steps to protect your data, including encrypted connections (HTTPS),
              httpOnly session cookies, hashed passwords, and rate limiting on authentication endpoints.
              No system is completely secure — if you believe there has been a security incident,
              contact us immediately at{' '}
              <a href="mailto:hello@blueai.app" className="text-blue-600 hover:underline">hello@blueai.app</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Children's Data</h2>
            <p className="text-sm">
              BlueAI processes student data on behalf of schools. Schools, as data controllers, are
              responsible for ensuring they have appropriate consent or legal basis for processing
              student data (including data relating to students under 13 or 16, depending on the
              applicable legal framework). BlueAI does not knowingly collect data directly from children
              without a school or teacher acting as an intermediary.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to This Policy</h2>
            <p className="text-sm">
              As BlueAI is in early-stage development, this policy will be updated as our practices
              evolve. We reserve the right to modify this Privacy Policy at any time. Where changes are
              significant, we will take reasonable steps to notify you (for example, by email or by
              displaying a notice when you next log in). Your continued use of the platform after
              changes are published constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contact</h2>
            <p className="text-sm">
              For any questions about this policy or how we handle your data, contact us at{' '}
              <a href="mailto:hello@blueai.app" className="text-blue-600 hover:underline">hello@blueai.app</a>.
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-200 py-6 mt-12">
        <div className="max-w-3xl mx-auto px-6 flex flex-wrap gap-4 text-sm text-gray-500">
          <span>© {new Date().getFullYear()} BlueAI. All rights reserved.</span>
          <button onClick={() => navigate('/terms')} className="hover:text-gray-800">Terms of Service</button>
          <a href="mailto:hello@blueai.app" className="hover:text-gray-800">hello@blueai.app</a>
        </div>
      </footer>
    </div>
  );
}
