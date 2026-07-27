import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileUp,
  KeyRound,
  Menu,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { BlueAILogo } from '@/components/ui/BlueAI-logo';

/**
 * Public landing page.
 *
 * Conversion-first layout: one primary action (start a free trial) repeated at
 * hero, mid-page, and footer; a single clearly-separated student path (/join);
 * and just enough product detail to earn the click. Deep feature content lives
 * behind sign-up, not here.
 *
 * The old early-access waitlist modal was removed deliberately — its submit
 * handler only simulated a request, so "leads" were silently discarded.
 * Demo requests now go to mailto:hello@blueai.app.
 */

const DEMO_MAILTO =
  'mailto:hello@blueai.app?subject=BlueAI%20demo%20request&body=Hi%20BlueAI%20team%2C%0A%0AI%27d%20like%20a%20demo.%0A%0ASchool%2Fcentre%3A%0ARole%3A%0A';

// ─── Small building blocks ────────────────────────────────────────────────────

const PrimaryButton = ({ children, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center justify-center gap-2 rounded-full bg-blue-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
  >
    {children}
  </button>
);

const GhostButton = ({ children, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
  >
    {children}
  </button>
);

// Static mockup of a marked submission — shows the product outcome (a marked
// answer with feedback) without loading real data on a public page.
const MarkedAnswerMockup = () => (
  <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60">
    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
      <div>
        <p className="text-sm font-semibold text-slate-900">Q3 — Solve 3x² − 12 = 0</p>
        <p className="text-xs text-slate-500">Amira K · submitted 14:02</p>
      </div>
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        4 / 4 marks
      </span>
    </div>

    <div className="space-y-2 py-3">
      {[
        ['M1', 'Rearranges to x² = 4'],
        ['M1', 'Square-roots both sides'],
        ['A2', 'States x = 2 and x = −2'],
      ].map(([mark, point]) => (
        <div key={point} className="flex items-start gap-2 text-sm">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          <span className="text-slate-700">
            <span className="mr-1.5 rounded bg-blue-50 px-1.5 py-0.5 text-xs font-semibold text-blue-700">{mark}</span>
            {point}
          </span>
        </div>
      ))}
    </div>

    <div className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
      <span className="font-semibold text-slate-800">Feedback: </span>
      Clear method, Amira — both roots stated. Next: remember to check for solutions the question
      excludes before your final answer.
    </div>

    <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
      <span>AI confidence 0.94</span>
      <span className="font-medium text-blue-700">Review &amp; override →</span>
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const startTrial = () => navigate('/teacher/login');

  const steps = [
    {
      icon: FileUp,
      title: 'Build or upload',
      body: 'Write questions, generate them with AI, or upload a GCSE past paper PDF — questions and mark scheme are extracted for you.',
    },
    {
      icon: KeyRound,
      title: 'Students join with a code',
      body: 'Share a 6-character code. Students answer in the browser on any device — no accounts, no app, no setup.',
    },
    {
      icon: ClipboardCheck,
      title: 'AI marks, you review',
      body: 'Every answer is marked against the mark scheme with written feedback. Anything uncertain is flagged for you to check.',
    },
  ];

  const benefits = [
    {
      icon: Clock,
      title: 'Get your evenings back',
      body: 'A full class set marked with personalised written feedback in minutes — you moderate instead of marking from scratch.',
    },
    {
      icon: Sparkles,
      title: 'Real exam questions, not quizzes',
      body: 'Long-form answers, maths notation, structured 1a/1b/1c questions, even scanned handwriting — marked like an examiner would.',
    },
    {
      icon: BarChart3,
      title: 'Know what to reteach',
      body: 'Per-question difficulty, topic gaps, and at-risk students surface automatically after every assessment. No spreadsheets.',
    },
  ];

  const faqs = [
    {
      q: 'Can I trust the AI’s marks?',
      a: 'Every mark comes with a confidence score, and low-confidence or unusual answers are flagged for your review. You can override any mark or comment before feedback reaches a student — the AI drafts, you decide.',
    },
    {
      q: 'Do my students need accounts?',
      a: 'No. Students join with a 6-character code (plus their school email for class-linked assessments) and answer in the browser on any device.',
    },
    {
      q: 'Which subjects does it work for?',
      a: 'Any subject with written answers — maths (with full equation support), sciences, humanities, English and languages. GCSE-style structured questions and past-paper PDFs are first-class citizens.',
    },
    {
      q: 'What does it cost?',
      a: 'Your first 30 days are free — no card required. Paid plans launch soon; early users get advance notice and priority pricing.',
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      {/* ── Nav ── */}
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-shadow ${
          scrolled ? 'bg-white/95 shadow-sm backdrop-blur' : 'bg-white/80 backdrop-blur'
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <BlueAILogo className="h-8 w-auto" />

          <div className="hidden items-center gap-3 sm:flex">
            <button
              onClick={() => navigate('/join')}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              Student? Enter code
            </button>
            <button
              onClick={() => navigate('/teacher/login')}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              Sign in
            </button>
            <PrimaryButton onClick={startTrial} className="!px-5 !py-2">
              Start free trial
            </PrimaryButton>
          </div>

          <button
            className="p-2 sm:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {menuOpen && (
          <div className="border-t border-slate-100 bg-white px-4 py-4 sm:hidden">
            <div className="flex flex-col gap-3">
              <PrimaryButton onClick={startTrial}>Start free trial</PrimaryButton>
              <GhostButton onClick={() => navigate('/teacher/login')}>Teacher sign in</GhostButton>
              <GhostButton onClick={() => navigate('/join')}>Student? Enter code</GhostButton>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-32 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="mb-4 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            AI marking for UK secondary schools — now in beta
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Mark a class set in minutes, <span className="text-blue-700">not evenings</span>.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            BlueAI marks real written answers — essays, maths, structured GCSE questions — against
            your mark scheme, and writes the feedback for you. You review and stay in control.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <PrimaryButton onClick={startTrial}>
              Start your free 30-day trial
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </PrimaryButton>
            <a
              href={DEMO_MAILTO}
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
            >
              or request a demo
            </a>
          </div>
          <p className="mt-3 text-sm text-slate-400">No card required · set up in under 5 minutes</p>
        </div>

        <MarkedAnswerMockup />
      </section>

      {/* ── Proof strip ── */}
      <section className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-center sm:grid-cols-3 sm:px-6">
          {[
            ['5–10 hrs', 'of weekly marking a typical teacher hands to BlueAI'],
            ['Minutes', 'from student submission to written feedback'],
            ['~60 sec', 'to turn a past-paper PDF into a ready assessment'],
          ].map(([stat, label]) => (
            <div key={label}>
              <p className="text-3xl font-bold text-blue-700">{stat}</p>
              <p className="mt-1 text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          From question to feedback in three steps
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className="relative rounded-2xl border border-slate-200 p-6">
              <span className="absolute -top-3 left-6 rounded-full bg-blue-700 px-2.5 py-0.5 text-xs font-bold text-white">
                {i + 1}
              </span>
              <Icon className="h-6 w-6 text-blue-700" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="bg-slate-900 py-20 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Built for the way you actually teach
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {benefits.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl bg-slate-800/60 p-6">
                <Icon className="h-6 w-6 text-blue-400" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{body}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-12 flex max-w-3xl flex-col items-center gap-4 rounded-2xl border border-slate-700 p-6 text-center sm:flex-row sm:text-left">
            <ShieldCheck className="h-8 w-8 shrink-0 text-blue-400" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-slate-300">
              <span className="font-semibold text-white">You stay in control.</span> Uncertain
              marking is flagged for review, every mark can be overridden, feedback is only
              released when you say so — and your data can be exported or deleted at any time.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight">Common questions</h2>
        <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
          {faqs.map(({ q, a }) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-left text-base font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                {q}
                <span className="ml-4 text-slate-400 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-blue-700">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Your next class set could mark itself.
          </h2>
          <PrimaryButton
            onClick={startTrial}
            className="!bg-white !text-blue-700 hover:!bg-blue-50"
          >
            Start your free 30-day trial
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </PrimaryButton>
          <p className="text-sm text-blue-200">Free for 30 days · no card · cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row sm:px-6">
          <BlueAILogo className="h-7 w-auto" />
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <button onClick={() => navigate('/join')} className="hover:text-slate-900">Student join</button>
            <button onClick={() => navigate('/teacher/login')} className="hover:text-slate-900">Teacher sign in</button>
            <button onClick={() => navigate('/privacy')} className="hover:text-slate-900">Privacy</button>
            <button onClick={() => navigate('/terms')} className="hover:text-slate-900">Terms</button>
            <a href="mailto:hello@blueai.app" className="hover:text-slate-900">hello@blueai.app</a>
          </nav>
        </div>
        <p className="pb-8 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} BlueAI. AI marking for the real classroom.
        </p>
      </footer>
    </div>
  );
};
