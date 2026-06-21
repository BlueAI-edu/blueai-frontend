import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReactComponent as LogoSVG } from '../logo.svg';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  inkBlack:       '#05060f',
  violet:         '#1d4ed8',
  violetHover:    '#1e40af',
  violetLight:    '#dbeafe',
  violetText:     '#1e40af',
  violetInteract: '#3b82f6',
  cloudWhite:     '#ffffff',
  whisperGray:    '#f8f8f8',
  stoneGray:      '#696a6f',
  platinumGray:   '#d7d7d9',
  successGreen:   '#269432',
  successGreenBg: '#d4fcd8',
  infoBlue:       '#2571cc',
  shadowXl:       'rgba(0,19,41,0.01) 0px 10px 32px 0px, rgba(0,19,41,0.02) 0px 2px 0px 0px, rgba(0,19,41,0.02) 0px 0px 24px 0px',
  shadowSubtle:   'rgba(15,10,31,0.04) 0px 2px 2px 0px, rgba(15,10,31,0.06) 0px 2px 6px 0px',
  shadowSm:       'rgba(5,6,15,0.04) 0px 2px 4px 0px, rgba(5,6,15,0.02) 0px 0px 5px 0px',
};

// ─── Shared styles ────────────────────────────────────────────────────────────
const btnPrimary = {
  background: T.violet,
  color: T.cloudWhite,
  borderRadius: '100px',
  padding: '10px 24px',
  fontWeight: 500,
  fontSize: 14,
  border: 'none',
  cursor: 'pointer',
  transition: 'background 0.15s',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  whiteSpace: 'nowrap',
};

const btnGhost = {
  background: T.cloudWhite,
  color: T.inkBlack,
  borderRadius: '100px',
  padding: '10px 24px',
  fontWeight: 500,
  fontSize: 14,
  border: `1px solid ${T.platinumGray}`,
  cursor: 'pointer',
  transition: 'border-color 0.15s',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  whiteSpace: 'nowrap',
};

const cardStyle = {
  background: T.cloudWhite,
  borderRadius: 20,
  padding: 24,
  boxShadow: T.shadowXl,
};

const badgeViolet = {
  background: T.violetLight,
  color: T.violetText,
  borderRadius: 6,
  padding: '4px 8px',
  fontWeight: 500,
  fontSize: 12,
  display: 'inline-block',
};

const badgeSuccess = {
  background: T.successGreenBg,
  color: T.successGreen,
  borderRadius: 6,
  padding: '4px 8px',
  fontWeight: 500,
  fontSize: 12,
  display: 'inline-block',
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const CheckIcon = ({ size = 16, color = T.violet }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ArrowRight = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.stoneGray}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.inkBlack}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const PathIcon = ({ d, size = 20, color = T.stoneGray }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const LogoMark = ({ size = 32, dark = false }) => (
  <LogoSVG
    style={{
      height: size,
      width: 'auto',
      filter: dark ? 'brightness(0) invert(1)' : 'none',
    }}
  />
);
// ─── Waitlist Modal ───────────────────────────────────────────────────────────
const WaitlistModal = ({ onClose, interestType = 'Join Early Access' }) => {
  const [form, setForm] = useState({ name: '', email: '', role: '', school: '', interest: interestType });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const roles = ['Teacher', 'Head of Department', 'Assistant Headteacher', 'Headteacher', 'Other'];
  const interests = ['Join Early Access', 'Request a Demo', 'Pilot Interest'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
  };

  const inputStyle = {
    width: '100%',
    border: `1px solid ${T.platinumGray}`,
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 14,
    color: T.inkBlack,
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: T.inkBlack,
    marginBottom: 6,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      background: 'rgba(5,6,15,0.55)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: T.cloudWhite, borderRadius: 20, boxShadow: T.shadowXl, width: '100%', maxWidth: 440, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <XIcon />
        </button>

        {!submitted ? (
          <div style={{ padding: 32 }}>
            <div style={{ marginBottom: 24 }}>
              <span style={badgeViolet}>Early Access</span>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: T.inkBlack, margin: '12px 0 6px', letterSpacing: '-0.3px' }}>
                Join BlueAI Assess early access
              </h2>
              <p style={{ fontSize: 14, color: T.stoneGray, lineHeight: 1.6 }}>
                Be first to access teacher-reviewed assessment, OCR, marking drafts, feedback, and reporting.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Full name *</label>
                <input required type="text" value={form.name} placeholder="Your name"
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Work email *</label>
                <input required type="email" value={form.email} placeholder="you@school.org"
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Role *</label>
                <select required value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  style={{ ...inputStyle, background: T.cloudWhite }}>
                  <option value="">Select your role</option>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>School / Organisation <span style={{ fontWeight: 400, color: T.stoneGray }}>(optional)</span></label>
                <input type="text" value={form.school} placeholder="School name"
                  onChange={e => setForm(f => ({ ...f, school: e.target.value }))}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>I'm interested in</label>
                <select value={form.interest}
                  onChange={e => setForm(f => ({ ...f, interest: e.target.value }))}
                  style={{ ...inputStyle, background: T.cloudWhite }}>
                  {interests.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <button type="submit" disabled={loading}
                style={{ ...btnPrimary, justifyContent: 'center', padding: '12px 24px', fontSize: 14, opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Submitting…' : 'Register Interest'}
              </button>
              <p style={{ textAlign: 'center', fontSize: 12, color: T.stoneGray }}>No spam. No commitment. Early access priority.</p>
            </form>
          </div>
        ) : (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: T.violetLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckIcon size={22} color={T.violet} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: T.inkBlack, marginBottom: 8 }}>You're on the list</h2>
            <p style={{ fontSize: 14, color: T.stoneGray, lineHeight: 1.6, marginBottom: 24 }}>
              Thanks, {form.name.split(' ')[0]}. We'll be in touch with early access details and pilot information.
            </p>
            <button onClick={onClose} style={{ ...btnPrimary, padding: '10px 24px' }}>Back to BlueAI</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Dashboard Mockup ─────────────────────────────────────────────────────────
const DashboardMockup = () => (
  <div style={{ position: 'relative', width: '100%', maxWidth: 560 }}>
    <div style={{ borderRadius: 20, overflow: 'hidden', boxShadow: T.shadowXl, background: T.cloudWhite, border: `1px solid ${T.platinumGray}` }}>
      {/* Browser chrome */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderBottom: `1px solid ${T.platinumGray}`, background: T.whisperGray }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fca5a5' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fcd34d' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#86efac' }} />
        <div style={{ marginLeft: 12, flex: 1, background: T.cloudWhite, border: `1px solid ${T.platinumGray}`, borderRadius: 6, padding: '3px 10px', fontSize: 11, color: T.stoneGray }}>
          blueai.app/teacher/assessments
        </div>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.inkBlack }}>Year 10 Physics — Forces Assessment</div>
            <div style={{ fontSize: 11, color: T.stoneGray, marginTop: 2 }}>32 scripts uploaded · OCR complete · Mark scheme applied</div>
          </div>
          <span style={badgeSuccess}>Feedback drafts ready</span>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {[
            { label: 'Class avg', value: '67%', color: T.infoBlue },
            { label: 'Drafted', value: '32/32', color: T.violet },
            { label: 'Need review', value: '3', color: '#d97706' },
            { label: 'Reports', value: 'Drafts', color: T.successGreen },
          ].map(s => (
            <div key={s.label} style={{ background: T.whisperGray, borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: T.stoneGray, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Student rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { name: 'Amara Johnson', q1: 4, q2: 3, total: 7, flag: null },
            { name: 'Thomas Chen',   q1: 5, q2: 4, total: 9, flag: null },
            { name: 'Sofia Patel',   q1: 2, q2: 2, total: 4, flag: 'Low-confidence OCR' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: i % 2 === 0 ? T.cloudWhite : T.whisperGray }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: T.violetLight, color: T.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {s.name[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.inkBlack }}>{s.name}</div>
                <div style={{ fontSize: 11, color: T.stoneGray }}>Q1: {s.q1}/5 · Q2: {s.q2}/5</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.inkBlack }}>{s.total}/10</div>
              {s.flag && <span style={{ ...badgeViolet, fontSize: 10, padding: '2px 7px' }}>Review required</span>}
            </div>
          ))}
        </div>

        {/* AI feedback preview */}
        <div style={{ background: T.violetLight, borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: T.violet, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: T.cloudWhite, fontSize: 9, fontWeight: 700 }}>AI</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.violetText }}>Draft Feedback · Sofia Patel</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: T.violet, cursor: 'pointer', fontWeight: 500 }}>Edit &amp; approve →</span>
          </div>
          <p style={{ fontSize: 11, color: T.violetText, lineHeight: 1.6, margin: 0 }}>
            "You selected the correct resultant force but missed one unit conversion. Recheck the newtons to kilonewtons step before final approval."
          </p>
        </div>
      </div>
    </div>
  </div>
);

// ─── Section label ─────────────────────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <div style={{ ...badgeViolet, marginBottom: 16, fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
    {children}
  </div>
);

// ─── Landing Page ─────────────────────────────────────────────────────────────
export const LandingPage = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInterest, setModalInterest] = useState('Join Early Access');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const openModal = (interest = 'Join Early Access') => { setModalInterest(interest); setModalOpen(true); };
  const scrollTo  = (id) => { setMenuOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };

  const navLinks = [
    { label: 'Features',     id: 'features'     },
    { label: 'How It Works', id: 'how-it-works'  },
    { label: 'Use Cases',    id: 'use-cases'     },
    { label: 'About',        id: 'about'         },
  ];

  const base = { fontFamily: 'Inter, system-ui, sans-serif', color: T.inkBlack };

  return (
    <div style={{ ...base, minHeight: '100vh', background: T.cloudWhite }}>
      {modalOpen && <WaitlistModal onClose={() => setModalOpen(false)} interestType={modalInterest} />}

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
        background: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
        borderBottom: scrolled ? `1px solid ${T.platinumGray}` : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(8px)' : 'none',
        transition: 'all 0.2s',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <LogoMark />
          </div>

          {/* Desktop nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="hidden-mobile">
            {navLinks.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px', fontSize: 14, fontWeight: 500, color: T.stoneGray, borderRadius: 8, fontFamily: 'inherit' }}
                onMouseEnter={e => { e.currentTarget.style.color = T.inkBlack; }}
                onMouseLeave={e => { e.currentTarget.style.color = T.stoneGray; }}>
                {l.label}
              </button>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="hidden-mobile">
            <button onClick={() => navigate('/join')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px', fontSize: 14, fontWeight: 500, color: T.stoneGray, fontFamily: 'inherit' }}>
              Student Join
            </button>
            <button onClick={() => navigate('/teacher/login')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px', fontSize: 14, fontWeight: 500, color: T.stoneGray, fontFamily: 'inherit' }}>
              Teacher Sign In
            </button>
            <button onClick={() => openModal('Join Early Access')}
              style={btnPrimary}
              onMouseEnter={e => e.currentTarget.style.background = T.violetHover}
              onMouseLeave={e => e.currentTarget.style.background = T.violet}>
              Join Early Access
            </button>
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'none' }}
            className="show-mobile">
            <MenuIcon />
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div style={{ background: T.cloudWhite, borderTop: `1px solid ${T.platinumGray}`, padding: '12px 24px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {navLinks.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px 12px', fontSize: 14, fontWeight: 500, color: T.inkBlack, textAlign: 'left', borderRadius: 8, fontFamily: 'inherit' }}>
                {l.label}
              </button>
            ))}
            <div style={{ borderTop: `1px solid ${T.platinumGray}`, marginTop: 8, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => navigate('/join')}
                style={{ ...btnGhost, justifyContent: 'center', width: '100%' }}>Student Join</button>
              <button onClick={() => navigate('/teacher/login')}
                style={{ ...btnGhost, justifyContent: 'center', width: '100%' }}>Teacher Sign In</button>
              <button onClick={() => openModal('Join Early Access')}
                style={{ ...btnPrimary, justifyContent: 'center', width: '100%' }}>Join Early Access</button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile / desktop responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: block !important; }
          .hero-grid { grid-template-columns: 1fr !important; }
          .two-col { grid-template-columns: 1fr !important; }
          .three-col { grid-template-columns: 1fr 1fr !important; }
          .four-col { grid-template-columns: 1fr 1fr !important; }
          .six-col { grid-template-columns: 1fr 1fr !important; }
          .mockup-hide { display: none !important; }
          .hero-headline { font-size: 36px !important; }
          .display-text { font-size: 36px !important; }
          .cta-btns { flex-direction: column !important; align-items: stretch !important; }
          .cta-btns button { justify-content: center !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section style={{ background: T.cloudWhite, paddingTop: 96, paddingBottom: 80 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
            {/* Left */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...badgeViolet, marginBottom: 24 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.violet, display: 'inline-block' }} />
                Early access for teachers now open
              </div>

              <h1 className="hero-headline" style={{
                fontSize: 52, fontWeight: 700, color: T.inkBlack,
                lineHeight: 1.12, letterSpacing: '-1.45px',
                margin: '0 0 20px',
              }}>
                From assessment to feedback, faster — with teachers in control
              </h1>

              <p style={{ fontSize: 16, color: T.stoneGray, lineHeight: 1.7, marginBottom: 32, maxWidth: 480 }}>
                BlueAI helps teachers create structured assessments, extract responses from scanned scripts, draft mark-scheme-aligned feedback, and review everything before it is shared.
              </p>

              <div className="cta-btns" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
                <button onClick={() => openModal('Join Early Access')}
                  style={{ ...btnPrimary, padding: '12px 28px', fontSize: 15 }}
                  onMouseEnter={e => e.currentTarget.style.background = T.violetHover}
                  onMouseLeave={e => e.currentTarget.style.background = T.violet}>
                  Join Early Access <ArrowRight size={14} />
                </button>
                <button onClick={() => openModal('Request a Demo')}
                  style={{ ...btnGhost, padding: '12px 28px', fontSize: 15 }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = T.stoneGray}
                  onMouseLeave={e => e.currentTarget.style.borderColor = T.platinumGray}>
                  Request a Demo
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Assessment Builder', 'OCR Extraction', 'Marking Drafts', 'Teacher Review', 'Feedback & Reports'].map(tag => (
                  <span key={tag} style={{ fontSize: 12, fontWeight: 500, color: T.stoneGray, background: T.whisperGray, borderRadius: 100, padding: '4px 12px', border: `1px solid ${T.platinumGray}` }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Right mockup */}
            <div className="mockup-hide" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── Workflow strip ─────────────────────────────────────────────────── */}
      <div style={{ background: T.whisperGray, borderTop: `1px solid ${T.platinumGray}`, borderBottom: `1px solid ${T.platinumGray}`, padding: '14px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          {['Create', 'Upload', 'Extract', 'Mark', 'Review', 'Export', 'Analyse'].map((step, i, arr) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.inkBlack }}>{step}</span>
              {i < arr.length - 1 && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.platinumGray} strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Problem ────────────────────────────────────────────────────────── */}
      <section style={{ background: T.cloudWhite, padding: '80px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ maxWidth: 600, margin: '0 auto 48px', textAlign: 'center' }}>
            <SectionLabel>The problem</SectionLabel>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: T.inkBlack, lineHeight: 1.33, letterSpacing: '-0.5px', margin: '0 0 16px' }}>
              Assessment is the most time-intensive part of teaching
            </h2>
            <p style={{ fontSize: 16, color: T.stoneGray, lineHeight: 1.7, margin: 0 }}>
              Teachers spend hours creating papers, marking scripts, writing feedback and turning results into action — often outside the school day.
            </p>
          </div>

          <div className="three-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[
              { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Marking takes too long', body: 'A class of 30 scripts can take hours to mark, with little time left for meaningful written feedback.' },
              { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', title: 'Feedback is hard to personalise', body: 'Writing tailored comments for every student at scale is near-impossible within a standard working week.' },
              { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', title: 'Paper scripts are difficult to organise at scale', body: 'Handwritten student responses are difficult to organise, store, and review systematically at volume.' },
              { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', title: 'Assessment data rarely becomes action quickly enough', body: 'Even when results exist, turning assessment data into class-level interventions requires planning time few teachers have.' },
              { icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', title: 'Creating exam-style papers is time-consuming', body: 'Building structured, mark-scheme-aligned assessments from scratch requires significant preparation time every term.' },
              { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Teachers want support, not replacement', body: 'Generic AI tools don\'t fit assessment workflows. Teachers need targeted support that respects professional judgement.' },
            ].map((item, i) => (
              <div key={i} style={{ ...cardStyle, boxShadow: T.shadowSm }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: T.violetLight, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <PathIcon d={item.icon} color={T.violet} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: T.inkBlack, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: T.stoneGray, lineHeight: 1.6, margin: 0 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solution overview ──────────────────────────────────────────────── */}
      <section style={{ background: T.whisperGray, padding: '80px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ maxWidth: 600, margin: '0 auto 48px', textAlign: 'center' }}>
            <SectionLabel>The solution</SectionLabel>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: T.inkBlack, lineHeight: 1.33, letterSpacing: '-0.5px', margin: '0 0 16px' }}>
              One connected assessment workflow
            </h2>
            <p style={{ fontSize: 16, color: T.stoneGray, lineHeight: 1.7, margin: 0 }}>
              BlueAI Assess connects every stage of assessment into a single, teacher-controlled platform — from paper creation through to class-level analytics.
            </p>
          </div>

          <div className="six-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 }}>
            {[
              { n: '01', title: 'Create',  body: 'Build or generate structured, mark-scheme-aligned assessments.',   highlight: false },
              { n: '02', title: 'Upload',  body: 'Upload scanned student scripts or digital responses in bulk.',      highlight: false },
              { n: '03', title: 'Extract', body: 'OCR extracts and organises each student\'s answers automatically.', highlight: false },
              { n: '04', title: 'Draft',   body: 'AI-supported marking drafts are prepared against your mark scheme.', highlight: false },
              { n: '05', title: 'Review',  body: 'You review, edit, and approve all marks and feedback.',            highlight: true  },
              { n: '06', title: 'Export',  body: 'Download PDF reports and view class analytics.',                   highlight: false },
            ].map((s, i) => (
              <div key={i} style={{
                background: T.cloudWhite,
                borderRadius: 20,
                padding: 20,
                border: s.highlight ? `2px solid ${T.violet}` : `1px solid ${T.platinumGray}`,
                boxShadow: s.highlight ? T.shadowXl : 'none',
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: s.highlight ? T.violet : T.violetLight, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.highlight ? T.cloudWhite : T.violet }}>{s.n}</span>
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: T.inkBlack, marginBottom: 6 }}>{s.title}</h3>
                <p style={{ fontSize: 12, color: T.stoneGray, lineHeight: 1.6, margin: 0 }}>{s.body}</p>
                {s.highlight && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10 }}>
                    <CheckIcon size={12} color={T.violet} />
                    <span style={{ fontSize: 11, fontWeight: 500, color: T.violet }}>Teacher in control</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature highlights ─────────────────────────────────────────────── */}
      <section id="features" style={{ background: T.cloudWhite, padding: '80px 0', scrollMarginTop: 64 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ maxWidth: 600, margin: '0 auto 48px', textAlign: 'center' }}>
            <SectionLabel>Features</SectionLabel>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: T.inkBlack, lineHeight: 1.33, letterSpacing: '-0.5px', margin: '0 0 16px' }}>
              Everything you need. Nothing you don't.
            </h2>
            <p style={{ fontSize: 16, color: T.stoneGray, lineHeight: 1.7, margin: 0 }}>
              Built specifically for assessment workflows — not adapted from a generic AI tool.
            </p>
          </div>

          <div className="three-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[
              { icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', title: 'Assessment Builder', body: 'Create structured, mark-scheme-aligned assessments with multiple question types. Generate questions with AI or build from your own bank.', tags: ['GCSE-ready', 'Structured questions', 'Mark scheme'] },
              { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', title: 'OCR & Response Extraction', body: 'Upload scanned scripts and BlueAI extracts each answer. Review and correct OCR output before marking begins.', tags: ['Handwritten scripts', 'OCR moderation', 'Confidence flags'] },
              { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', title: 'AI-supported marking drafts', body: 'BlueAI drafts mark-scheme-aligned marks for every student response. You review and approve before anything is finalised.', tags: ['Mark-scheme aligned', 'Teacher approval', 'Override support'] },
              { icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', title: 'Personalised Feedback', body: 'BlueAI drafts targeted written feedback for each student based on their specific answers. Edit and approve before sharing.', tags: ['Per-student', 'Editable drafts', 'Specific comments'] },
              { icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z', title: 'PDF Reports', body: 'Generate downloadable feedback reports for individual students. Clear, professional, and ready to share with students and parents.', tags: ['Student reports', 'One-click export', 'Professional layout'] },
              { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', title: 'Analytics', body: 'Class-level performance dashboards showing score distributions, question-level analysis, and intervention insights by topic.', tags: ['Class overview', 'Question analysis', 'Intervention flags'] },
            ].map((f, i) => (
              <div key={i} style={cardStyle}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: T.violetLight, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <PathIcon d={f.icon} color={T.violet} size={20} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: T.inkBlack, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: T.stoneGray, lineHeight: 1.65, marginBottom: 16 }}>{f.body}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {f.tags.map(t => (
                    <span key={t} style={badgeViolet}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ background: T.whisperGray, padding: '80px 0', scrollMarginTop: 64 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ maxWidth: 600, margin: '0 auto 48px', textAlign: 'center' }}>
            <SectionLabel>How it works</SectionLabel>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: T.inkBlack, lineHeight: 1.33, letterSpacing: '-0.5px', margin: 0 }}>
              From blank page to class report in six steps
            </h2>
          </div>

          <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { n: '01', title: 'Create or generate an assessment',     body: 'Use the Assessment Builder to create structured exam-style questions with mark schemes. Generate questions using AI, or build from your existing bank. Export as a printable PDF.',  note: null,  highlight: false },
              { n: '02', title: 'Upload student responses',              body: 'Scan or photograph completed student scripts and upload them in bulk. BlueAI organises them automatically by student.',   note: null,  highlight: false },
              { n: '03', title: 'BlueAI extracts and organises answers', body: 'OCR reads each handwritten or typed answer and extracts it into a structured format. Low-confidence extractions are flagged for your review before marking begins.', note: null, highlight: false },
              { n: '04', title: 'BlueAI drafts marks and feedback',      body: 'Using your mark scheme, BlueAI drafts marks and written feedback for each response. This is a draft only — nothing is finalised without your approval.', note: null, highlight: false },
              { n: '05', title: 'You review, edit, and approve',         body: 'You have complete oversight of every mark and feedback comment. Review drafts, make any changes, add your own comments, and approve before results are returned.', note: 'Teacher remains in control. All marks require your approval. Override any AI suggestion at any point.', highlight: true },
              { n: '06', title: 'Export reports and view insights',      body: 'Download individual student PDF reports, view class-level dashboards, and identify students and topics that need further attention.', note: null, highlight: false },
            ].map((s, i) => (
              <div key={i} style={{
                display: 'flex', gap: 20, padding: 20, borderRadius: 20,
                background: T.cloudWhite,
                border: s.highlight ? `2px solid ${T.violet}` : `1px solid ${T.platinumGray}`,
                boxShadow: s.highlight ? T.shadowXl : 'none',
              }}>
                <div style={{ flexShrink: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: s.highlight ? T.violet : T.violetLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: s.highlight ? T.cloudWhite : T.violet }}>{s.n}</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: T.inkBlack, margin: '0 0 6px' }}>{s.title}</h3>
                  <p style={{ fontSize: 13, color: T.stoneGray, lineHeight: 1.65, margin: 0 }}>{s.body}</p>
                  {s.note && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 12, background: T.violetLight, borderRadius: 10, padding: '10px 14px' }}>
                      <CheckIcon size={13} color={T.violet} />
                      <p style={{ fontSize: 12, fontWeight: 500, color: T.violetText, margin: 0, lineHeight: 1.5 }}>{s.note}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why BlueAI ─────────────────────────────────────────────────────── */}
      <section style={{ background: T.cloudWhite, padding: '80px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ maxWidth: 760, margin: '0 auto 48px', textAlign: 'center' }}>
            <SectionLabel>Positioning</SectionLabel>
            <h2 style={{ fontSize: 40, fontWeight: 700, color: T.inkBlack, lineHeight: 1.22, letterSpacing: '-0.7px', margin: '0 0 12px' }}>
              Built for assessment. Not adapted from a chatbot.
            </h2>
            <p style={{ fontSize: 16, color: T.stoneGray, lineHeight: 1.7, margin: 0 }}>
              Generic AI tools generate text. BlueAI Assess is designed around the teacher assessment workflow — from mark scheme to moderation to personalised feedback at class scale.
            </p>
          </div>

          <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>
            <div>
              <SectionLabel>Why BlueAI</SectionLabel>
              <h2 style={{ fontSize: 32, fontWeight: 700, color: T.inkBlack, lineHeight: 1.33, letterSpacing: '-0.5px', margin: '0 0 16px' }}>
                Assessment support that fits how teachers work
              </h2>
              <p style={{ fontSize: 15, color: T.stoneGray, lineHeight: 1.7, marginBottom: 32 }}>
                The product is shaped around exam-style assessment, handwritten scripts, teacher moderation, and the reality that feedback must be useful, timely, and professionally reviewed.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  { title: 'Exam-aware design',              body: 'Built to support structured exam-style questions, mark schemes, and the specific demands of GCSE and formal assessment.' },
                  { title: 'End-to-end in one platform',     body: 'OCR extraction, AI marking, personalised feedback, PDF reports, and analytics — connected, not fragmented.' },
                  { title: 'Moderation and override built in', body: 'Every AI-generated mark and feedback comment requires teacher review. You can override any suggestion at any point.' },
                  { title: 'Assessment-specific',            body: 'Not a worksheet generator. Not a quiz builder. A structured marking and feedback platform for real assessment workflows.' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14 }}>
                    <div style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: T.violetLight, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                      <CheckIcon size={11} color={T.violet} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: T.inkBlack, margin: '0 0 3px' }}>{item.title}</p>
                      <p style={{ fontSize: 13, color: T.stoneGray, lineHeight: 1.65, margin: 0 }}>{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparison table */}
            <div style={{ borderRadius: 20, overflow: 'hidden', border: `1px solid ${T.platinumGray}`, boxShadow: T.shadowSm }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', background: T.whisperGray, borderBottom: `1px solid ${T.platinumGray}` }}>
                <div style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: T.stoneGray, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Feature</div>
                <div style={{ padding: '12px 20px', textAlign: 'center' }}>
                  <span style={{ ...badgeViolet, fontSize: 11 }}>BlueAI</span>
                </div>
                <div style={{ padding: '12px 20px', textAlign: 'center', fontSize: 11, fontWeight: 500, color: T.stoneGray, whiteSpace: 'nowrap' }}>Generic AI</div>
              </div>
              {[
                'Structured assessment creation',
                'OCR from handwritten scripts',
                'Mark-scheme-aligned marking',
                'Per-student feedback drafts',
                'Teacher moderation & override',
                'PDF student reports',
                'Class-level analytics',
                'Exam-aware question types',
              ].map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', borderBottom: i < 7 ? `1px solid ${T.platinumGray}` : 'none', background: i % 2 === 1 ? T.whisperGray : T.cloudWhite }}>
                  <div style={{ padding: '11px 16px', fontSize: 13, color: T.inkBlack }}>{row}</div>
                  <div style={{ padding: '11px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckIcon size={15} color={T.violet} />
                  </div>
                  <div style={{ padding: '11px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.platinumGray} strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Use cases ──────────────────────────────────────────────────────── */}
      <section id="use-cases" style={{ background: T.whisperGray, padding: '80px 0', scrollMarginTop: 64 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ maxWidth: 600, margin: '0 auto 48px', textAlign: 'center' }}>
            <SectionLabel>Use cases</SectionLabel>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: T.inkBlack, lineHeight: 1.33, letterSpacing: '-0.5px', margin: '0 0 16px' }}>
              How teachers are using BlueAI
            </h2>
            <p style={{ fontSize: 16, color: T.stoneGray, lineHeight: 1.7, margin: 0 }}>
              From quick formative checks to full mock preparation.
            </p>
          </div>

          <div className="three-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[
              { badge: 'Formative',  title: 'Classroom formative checks',       body: 'Quick end-of-lesson or end-of-topic structured questions. Get a fast class overview of who understood and who needs support.' },
              { badge: 'Summative',  title: 'End-of-topic summative assessment', body: 'Build and administer mark-scheme-aligned papers at the end of a topic. Generate class reports without hours of manual marking.' },
              { badge: 'Exam prep',  title: 'GCSE structured question practice', body: 'Create structured exam-style questions aligned to GCSE mark schemes. Give students practice and personalised feedback on technique.' },
              { badge: 'Mock exams', title: 'Full mock preparation',             body: 'Run full mock assessments and return marked, personalised feedback reports to students — significantly reducing marking time.' },
              { badge: 'Feedback',   title: 'Faster feedback return',            body: 'Return meaningful written feedback to every student within days rather than weeks. Keep students engaged with timely, targeted comments.' },
              { badge: 'Analytics',  title: 'Data-led intervention planning',    body: 'Identify which students and topics need support from actual assessment data. Plan interventions from evidence, not impression.' },
            ].map((uc, i) => (
              <div key={i} style={{ ...cardStyle, boxShadow: T.shadowSm }}>
                <span style={badgeViolet}>{uc.badge}</span>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: T.inkBlack, margin: '12px 0 8px' }}>{uc.title}</h3>
                <p style={{ fontSize: 13, color: T.stoneGray, lineHeight: 1.65, margin: 0 }}>{uc.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust ──────────────────────────────────────────────────────────── */}
      <section style={{ background: T.cloudWhite, padding: '80px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ maxWidth: 600, margin: '0 auto 48px', textAlign: 'center' }}>
            <SectionLabel>Trust &amp; control</SectionLabel>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: T.inkBlack, lineHeight: 1.33, letterSpacing: '-0.5px', margin: '0 0 16px' }}>
              Designed to support teachers, not replace them
            </h2>
            <p style={{ fontSize: 16, color: T.stoneGray, lineHeight: 1.7, margin: 0 }}>
              Every BlueAI workflow keeps you in control. AI produces drafts. You make the decisions.
            </p>
          </div>

          <div className="four-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 48 }}>
            {[
              { icon: '✓', title: 'Teacher approval required',   body: 'No mark or feedback reaches a student without your review and sign-off.' },
              { icon: '⚡', title: 'Override at any point',       body: 'Change any AI-suggested mark or feedback comment with a single edit. Your judgement always takes priority.' },
              { icon: '⚑',  title: 'OCR confidence flags',       body: 'Uncertain extractions are automatically flagged for your review before marking begins.' },
              { icon: '◻',  title: 'Professional presentation',  body: 'Reports and dashboards are designed to the standard expected by schools, parents, and school leaders.' },
            ].map((t, i) => (
              <div key={i} style={{ ...cardStyle, textAlign: 'center', boxShadow: T.shadowSm }}>
                <div style={{ fontSize: 22, marginBottom: 12 }}>{t.icon}</div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: T.inkBlack, marginBottom: 8 }}>{t.title}</h3>
                <p style={{ fontSize: 13, color: T.stoneGray, lineHeight: 1.65, margin: 0 }}>{t.body}</p>
              </div>
            ))}
          </div>

          <div style={{ maxWidth: 640, margin: '0 auto', background: T.violetLight, borderRadius: 20, padding: 32, textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: T.cloudWhite, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: T.shadowSm }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.violet} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <p style={{ fontSize: 14, color: T.violetText, lineHeight: 1.7, fontWeight: 500, margin: '0 0 8px' }}>
              "BlueAI is designed so that every mark and feedback comment is a draft for your approval — not an automatic output. Assessment is a professional act, and BlueAI is built to support that."
            </p>
            <span style={{ fontSize: 12, color: T.violet }}>BlueAI design principle</span>
          </div>
        </div>
      </section>

      {/* ── About / Founder ────────────────────────────────────────────────── */}
      <section id="about" style={{ background: T.whisperGray, padding: '80px 0', scrollMarginTop: 64 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ maxWidth: 680 }}>
            <SectionLabel>Our approach</SectionLabel>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: T.inkBlack, lineHeight: 1.33, letterSpacing: '-0.5px', margin: '0 0 24px' }}>
              Built with teachers, for real assessment workflows
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                'BlueAI is being developed with direct classroom insight from UK teaching practice. It is designed around real assessment pain points: marking workload, feedback turnaround, OCR from student scripts, teacher moderation, and class-level intervention planning.',
                'The platform is designed around the reality of classroom assessment: structured questions, mark schemes, handwritten responses, the need for speed, and the professional responsibility that teachers carry when they mark and return work to students.',
                'Student responses remain part of a teacher-controlled workflow. AI-generated marks and feedback are drafts for teacher review, not final decisions.',
              ].map((p, i) => (
                <p key={i} style={{ fontSize: 15, color: T.stoneGray, lineHeight: 1.7, margin: 0 }}>{p}</p>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24 }}>
              {['Designed around real teacher workflows', 'Teacher review and override built in', 'Responsible AI use', 'Early pilot access available'].map(tag => (
                <span key={tag} style={{ fontSize: 13, fontWeight: 500, color: T.inkBlack, background: T.cloudWhite, borderRadius: 100, padding: '6px 16px', border: `1px solid ${T.platinumGray}` }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section style={{ background: T.violet, padding: '80px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 500, color: T.cloudWhite, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 24 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.cloudWhite, display: 'inline-block' }} />
            Phase 1 — Early access open
          </div>

          <h2 className="display-text" style={{ fontSize: 48, fontWeight: 700, color: T.cloudWhite, lineHeight: 1.2, letterSpacing: '-0.96px', margin: '0 0 16px' }}>
            Be among the first teachers to use BlueAI
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, maxWidth: 520, margin: '0 auto 40px' }}>
            Join the waitlist for early access. We are currently inviting teachers and small pilot groups to test BlueAI in real classroom assessment workflows.
          </p>

          <div className="cta-btns" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
            <button onClick={() => openModal('Join Early Access')}
              style={{ ...btnPrimary, background: T.cloudWhite, color: T.violet, padding: '12px 28px', fontSize: 15 }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f8f8f8'; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.cloudWhite; }}>
              Join Early Access <ArrowRight size={14} color={T.violet} />
            </button>
            <button onClick={() => openModal('Request a Demo')}
              style={{ ...btnGhost, background: 'transparent', color: T.cloudWhite, borderColor: 'rgba(255,255,255,0.4)', padding: '12px 28px', fontSize: 15 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.cloudWhite; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; }}>
              Request a Demo
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
            {['Free to join waitlist', 'No commitment required', 'Priority early access'].map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                <CheckIcon size={13} color="rgba(255,255,255,0.75)" />
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer style={{ background: T.inkBlack, padding: '56px 0 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <LogoMark size={28} dark />
              </div>
              <p style={{ fontSize: 13, color: T.stoneGray, lineHeight: 1.7, maxWidth: 260, margin: 0 }}>
                AI-supported assessment and feedback for teachers. Built for real classroom workflows.
              </p>
            </div>

            {[
              { heading: 'Product',   links: [{ label: 'Features', action: () => scrollTo('features') }, { label: 'How It Works', action: () => scrollTo('how-it-works') }, { label: 'Use Cases', action: () => scrollTo('use-cases') }] },
              { heading: 'Access',    links: [{ label: 'Student Join', action: () => navigate('/join') }, { label: 'Teacher Sign In', action: () => navigate('/teacher/login') }, { label: 'Join Early Access', action: () => openModal('Join Early Access') }, { label: 'Request a Demo', action: () => openModal('Request a Demo') }] },
              { heading: 'Legal',     links: [{ label: 'Privacy Policy', action: () => navigate('/privacy') }, { label: 'Terms of Service', action: () => navigate('/terms') }, { label: 'hello@blueai.app', action: null, href: 'mailto:hello@blueai.app' }] },
            ].map(col => (
              <div key={col.heading}>
                <h4 style={{ fontSize: 12, fontWeight: 600, color: T.cloudWhite, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col.heading}</h4>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map(l => (
                    <li key={l.label}>
                      {l.href
                        ? <a href={l.href} style={{ fontSize: 13, color: T.stoneGray, textDecoration: 'none' }}>{l.label}</a>
                        : <button onClick={l.action} style={{ background: 'none', border: 'none', cursor: l.action ? 'pointer' : 'default', padding: 0, fontSize: 13, color: T.stoneGray, fontFamily: 'inherit' }}
                            onMouseEnter={e => { if (l.action) e.currentTarget.style.color = T.cloudWhite; }}
                            onMouseLeave={e => { e.currentTarget.style.color = T.stoneGray; }}>
                            {l.label}
                          </button>
                      }
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <p style={{ fontSize: 12, color: T.stoneGray, margin: 0 }}>&copy; {new Date().getFullYear()} BlueAI. All rights reserved.</p>
            <p style={{ fontSize: 12, color: T.stoneGray, margin: 0 }}>AI-supported assessment for teachers. Teacher approval required for all AI outputs.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
