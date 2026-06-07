import { useNavigate } from 'react-router-dom';

export function TermsOfServicePage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: June 2025</p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-amber-800">
            <strong>Early access notice:</strong> BlueAI is currently in early-stage beta. These Terms of
            Service reflect our current offering and may change as the platform evolves. We reserve the
            right to update these Terms at any time. Where changes are material, we will notify users by
            email or by posting a prominent notice on the platform. Continued use of the platform after
            changes are published constitutes acceptance of the updated Terms.
          </p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Agreement to These Terms</h2>
            <p className="text-sm">
              By creating an account or using BlueAI Assess ("BlueAI", "the platform", "we", "us"), you
              agree to be bound by these Terms of Service. If you are accessing BlueAI on behalf of a
              school or organisation, you represent that you have the authority to bind that organisation
              to these Terms.
            </p>
            <p className="mt-2 text-sm">
              If you do not agree to these Terms, do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. The Service</h2>
            <p className="text-sm">
              BlueAI is an AI-assisted educational assessment platform that allows teachers to:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm mt-2">
              <li>Create assessments and question banks</li>
              <li>Have student responses marked automatically by AI (GPT-4o)</li>
              <li>Upload and extract GCSE past paper PDFs into editable question sets</li>
              <li>Review AI-generated marks, override results, and download feedback reports</li>
              <li>Manage classes and track student performance over time</li>
            </ul>
            <p className="mt-3 text-sm">
              <strong>AI marking is a tool to assist teacher judgement, not to replace it.</strong> All
              AI-generated marks and feedback must be reviewed by the teacher. BlueAI does not guarantee
              the accuracy, completeness, or suitability of AI-generated output for any particular purpose.
              Teachers retain full responsibility for the marks they award to students.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Accounts and Eligibility</h2>
            <p className="text-sm">
              Teacher accounts may be created by individuals working in an educational context (schools,
              tuition centres, or similar organisations). You must be at least 18 years old to create a
              teacher account.
            </p>
            <p className="mt-2 text-sm">
              You are responsible for keeping your login credentials secure and for all activity that
              occurs under your account. Notify us immediately at{' '}
              <a href="mailto:hello@blueai.app" className="text-blue-600 hover:underline">hello@blueai.app</a>{' '}
              if you suspect unauthorised access.
            </p>
            <p className="mt-2 text-sm">
              Students access the platform via join codes provided by their teacher. Students do not
              create accounts — their participation is managed by the teacher.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Acceptable Use</h2>
            <p className="text-sm mb-2">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Use BlueAI for any unlawful purpose or in violation of any applicable laws</li>
              <li>Upload or input content that is abusive, discriminatory, or harmful</li>
              <li>Attempt to reverse engineer, copy, or misappropriate the platform or its AI systems</li>
              <li>Use automated tools (bots, scrapers) to access the platform</li>
              <li>Interfere with the platform's security, availability, or integrity</li>
              <li>Share access credentials with third parties not authorised to use the platform</li>
              <li>Process student data in a manner that conflicts with your obligations under data protection law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Content You Upload</h2>
            <p className="text-sm">
              You retain ownership of content you create or upload to BlueAI (assessments, questions,
              uploaded PDFs, class data). By uploading content, you grant BlueAI a limited licence to
              process that content solely for the purpose of providing the service to you.
            </p>
            <p className="mt-2 text-sm">
              You are responsible for ensuring you have the right to upload any content you provide —
              including GCSE past papers, which are typically owned by exam boards. It is your
              responsibility to verify that your use of past papers complies with the relevant exam board's
              copyright terms.
            </p>
            <p className="mt-2 text-sm">
              You must not upload content that includes the personal data of individuals unless you have a
              lawful basis for sharing that data with us (see our Privacy Policy and, where applicable,
              your Data Processing Agreement with BlueAI).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. AI and Accuracy</h2>
            <p className="text-sm">
              BlueAI uses large language models (currently OpenAI's GPT-4o) to mark student responses.
              AI marking is inherently probabilistic and may produce incorrect, inconsistent, or
              unexpected results.
            </p>
            <p className="mt-2 text-sm">
              BlueAI provides confidence scores and flagging tools to help teachers identify responses
              that warrant closer review. Teachers must not use AI-generated marks as a sole or
              definitive assessment of a student's work without applying their own professional judgement.
            </p>
            <p className="mt-2 text-sm">
              BlueAI makes no warranty as to the accuracy of AI output and accepts no liability for
              decisions made on the basis of AI-generated marks or feedback.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Usage Limits and Quotas</h2>
            <p className="text-sm">
              Different account tiers carry different usage allowances (OCR page scans, AI marking runs,
              PDF exports, number of classes and assessments). These limits are displayed in your account.
              Exceeding a limit will prevent further use of that feature until the limit is increased or
              reset. BlueAI reserves the right to adjust tier limits and pricing at any time, with
              reasonable notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Data and Privacy</h2>
            <p className="text-sm">
              Your use of BlueAI is subject to our{' '}
              <button
                onClick={() => window.scrollTo(0, 0) || navigate('/privacy')}
                className="text-blue-600 hover:underline"
              >
                Privacy Policy
              </button>
              , which is incorporated into these Terms by reference.
            </p>
            <p className="mt-2 text-sm">
              If you are using BlueAI to process personal data about students at your school, you
              (the school or organisation) are the data controller, and BlueAI is the data processor.
              A Data Processing Agreement (DPA) is available on request and is required for UK GDPR
              compliance. Contact us at{' '}
              <a href="mailto:hello@blueai.app" className="text-blue-600 hover:underline">hello@blueai.app</a>{' '}
              to request a DPA before processing student data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Availability and Modifications</h2>
            <p className="text-sm">
              BlueAI is in early-stage development. We aim to keep the platform available but do not
              guarantee uptime or uninterrupted access. We may modify, suspend, or discontinue any part
              of the service at any time.
            </p>
            <p className="mt-2 text-sm">
              During the beta period, features, limits, and pricing are subject to change with reasonable
              notice. We will communicate significant changes via email or in-app notifications.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Termination</h2>
            <p className="text-sm">
              You may delete your account at any time from your Profile page. Deletion is permanent and
              removes all associated data immediately.
            </p>
            <p className="mt-2 text-sm">
              We reserve the right to suspend or terminate accounts that violate these Terms, engage in
              abusive behaviour, or are inactive for extended periods. Where reasonably practical, we
              will give notice before termination.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Limitation of Liability</h2>
            <p className="text-sm">
              To the fullest extent permitted by law, BlueAI and its operators shall not be liable for
              any indirect, incidental, special, consequential, or punitive damages arising from your
              use of the platform, including — but not limited to — loss of data, loss of revenue, or
              harm resulting from reliance on AI-generated output.
            </p>
            <p className="mt-2 text-sm">
              BlueAI is provided "as is" and "as available" during the beta period. We make no warranties,
              express or implied, as to the fitness of the platform for any particular purpose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Governing Law</h2>
            <p className="text-sm">
              These Terms are governed by and construed in accordance with the laws of England and Wales.
              Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of
              the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Contact</h2>
            <p className="text-sm">
              Questions about these Terms should be directed to{' '}
              <a href="mailto:hello@blueai.app" className="text-blue-600 hover:underline">hello@blueai.app</a>.
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-200 py-6 mt-12">
        <div className="max-w-3xl mx-auto px-6 flex flex-wrap gap-4 text-sm text-gray-500">
          <span>© {new Date().getFullYear()} BlueAI. All rights reserved.</span>
          <button onClick={() => navigate('/privacy')} className="hover:text-gray-800">Privacy Policy</button>
          <a href="mailto:hello@blueai.app" className="hover:text-gray-800">hello@blueai.app</a>
        </div>
      </footer>
    </div>
  );
}
