import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { STORIES, StoryCard, StoryModal } from './Stories.jsx';
import { BLOGS, BlogCard, BlogModal } from './Blogs.jsx';

const stats = [
  { label: 'Total Donors', value: 12400, suffix: '+' },
  { label: 'Requests Fulfilled', value: 8900, suffix: '+' },
  { label: 'Cities', value: 10, suffix: '' },
  { label: 'Lives Saved', value: 5200, suffix: '+' },
];

function AnimatedCounter({ target, suffix = '', duration = 1800 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const totalSteps = 60;
        const increment = target / totalSteps;
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(current));
        }, duration / totalSteps);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref}>
      {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}{suffix}
    </span>
  );
}

function DonationIllustration() {
  return (
    <svg viewBox="0 0 360 360" className="w-full max-w-md mx-auto" aria-hidden="true">
      <circle cx="180" cy="180" r="160" fill="#FFF5F5" />
      <circle cx="80" cy="90" r="14" fill="#FFD7DB" />
      <circle cx="300" cy="270" r="20" fill="#FFD7DB" />
      <circle cx="300" cy="80" r="9" fill="#C0162C" opacity="0.25" />
      <path d="M180 70 C 140 130, 105 175, 105 215 a75 75 0 0 0 150 0 C 255 175, 220 130, 180 70 Z"
        fill="#C0162C" />
      <path d="M180 70 C 160 100, 142 128, 134 155 a 46 46 0 0 0 18 18 C 144 145, 158 118, 180 95 Z"
        fill="#FF6B6B" opacity="0.55" />
      <circle cx="180" cy="225" r="10" fill="#FFF5F5" opacity="0.85" />
      <g opacity="0.7">
        <path d="M236 250 C 224 268, 209 280, 209 292 a18 18 0 0 0 36 0 C 245 280, 248 268, 236 250 Z" fill="#8B0000" />
      </g>
      <g opacity="0.5">
        <path d="M120 260 C 112 272, 102 280, 102 289 a13 13 0 0 0 26 0 C 128 280, 128 272, 120 260 Z" fill="#FFD700" />
      </g>
    </svg>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const dashboardPath = user?.role === 'donor' ? '/donor/dashboard' : '/hospital/dashboard';
  const [activeStory, setActiveStory] = useState(null);
  const [activeBlog, setActiveBlog] = useState(null);
  const campCta = user
    ? (user.role === 'donor' ? '/donor/dashboard' : user.role === 'hospital' ? '/hospital/dashboard' : '/admin/dashboard')
    : '/register?role=donor';

  return (
    <div className="bg-white overflow-x-hidden">
      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="px-4 py-20 lg:py-28">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div style={{ animation: 'fadeInUp 0.6s ease-out' }}>
            <div className="inline-flex items-center gap-2 bg-[#FFF5F5] text-[#C0162C] text-sm font-semibold px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-[#C0162C] animate-pulse" />
              Real-time blood matching platform
            </div>
            <h1 className="text-[#1A1A2E] font-bold leading-tight mb-5"
              style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', fontFamily: 'Poppins, sans-serif' }}>
              Every Drop Counts.<br />
              <span className="text-[#C0162C]">Connect. Donate. Save Lives.</span>
            </h1>
            <p className="text-slate-500 text-lg mb-8 max-w-lg leading-relaxed">
              Blood Connector bridges the gap between willing donors and hospitals in urgent need —
              real-time matching, instant notifications, and a community dedicated to saving lives.
            </p>

            {user ? (
              <Link to={dashboardPath} className="btn-primary px-8 py-3.5 text-base">
                Go to Dashboard →
              </Link>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register?role=donor" className="btn-primary px-8 py-3.5 text-base">
                  🤝 Register as Donor
                </Link>
                <Link to="/register?role=hospital" className="btn-secondary px-8 py-3.5 text-base">
                  🏥 Register as Hospital
                </Link>
              </div>
            )}
          </div>

          <div className="hidden lg:block" style={{ animation: 'fadeIn 0.8s ease-out' }}>
            <DonationIllustration />
          </div>
        </div>
      </section>

      {/* ─── Stats ────────────────────────────────────────────────────────── */}
      <section className="py-14 px-4 bg-[#FFF5F5]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label} className="space-y-1">
              <p className="text-4xl font-bold text-[#C0162C]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <AnimatedCounter target={s.value} suffix={s.suffix} />
              </p>
              <p className="text-slate-500 text-sm font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Recent Stories ─────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-3">
            <div>
              <span className="inline-block text-[#C0162C] text-sm font-bold tracking-widest uppercase mb-2">Community Stories</span>
              <h2 className="text-3xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Lives Changed by Donors Like You
              </h2>
            </div>
            <Link to="/stories" className="text-sm font-semibold text-[#C0162C] hover:underline flex-shrink-0">
              View All Stories →
            </Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {STORIES.slice(0, 3).map((s) => <StoryCard key={s.id} story={s} onRead={setActiveStory} />)}
          </div>
        </div>
      </section>

      {/* ─── Recent Blogs ────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-3">
            <div>
              <span className="inline-block text-[#C0162C] text-sm font-bold tracking-widest uppercase mb-2">From the Blog</span>
              <h2 className="text-3xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Insights &amp; Updates
              </h2>
            </div>
            <Link to="/blogs" className="text-sm font-semibold text-[#C0162C] hover:underline flex-shrink-0">
              View All Blogs →
            </Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {BLOGS.slice(0, 3).map((b) => <BlogCard key={b.id} blog={b} onRead={setActiveBlog} />)}
          </div>
        </div>
      </section>

      {/* ─── Blood Camp announcement ────────────────────────────────────── */}
      <section className="py-16 px-4 bg-[#FFF5F5]">
        <div className="max-w-3xl mx-auto card text-center py-12 px-8">
          <div className="text-5xl mb-4">📍</div>
          <h2 className="text-2xl font-bold text-[#1A1A2E] mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Blood Camps Happening Near You
          </h2>
          <p className="text-slate-500 mb-7 max-w-lg mx-auto leading-relaxed">
            Hospitals across the city schedule donation camps every week. Find one nearby and donate
            without waiting for an emergency.
          </p>
          <Link to={campCta} className="btn-primary px-8 py-3 text-base">
            Find a Camp Near You →
          </Link>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="py-10 px-4 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🩸</span>
            <span className="font-bold text-[#1A1A2E]" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Blood <span className="text-[#C0162C]">Connector</span>
            </span>
          </div>
          <p className="text-sm text-slate-400 text-center">© 2024 Blood Connector. Built to save lives. Every drop counts.</p>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link to="/" className="hover:text-[#C0162C] transition-colors">Home</Link>
            <Link to="/stories" className="hover:text-[#C0162C] transition-colors">Stories</Link>
            <Link to="/blogs" className="hover:text-[#C0162C] transition-colors">Blogs</Link>
            <Link to="/leaderboard" className="hover:text-[#C0162C] transition-colors">Leaderboard</Link>
          </div>
        </div>
      </footer>

      {activeStory && <StoryModal story={activeStory} onClose={() => setActiveStory(null)} />}
      {activeBlog && <BlogModal blog={activeBlog} onClose={() => setActiveBlog(null)} />}
    </div>
  );
}
