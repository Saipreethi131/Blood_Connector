import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const stats = [
  { label: 'Registered Donors', value: 12400, suffix: '+' },
  { label: 'Hospitals Connected', value: 380, suffix: '+' },
  { label: 'Lives Saved', value: 5200, suffix: '+' },
  { label: 'Requests Fulfilled', value: 8900, suffix: '+' },
];

const steps = [
  { icon: '📝', step: '01', title: 'Register', desc: 'Sign up as a Donor or a Hospital in under 2 minutes. No paperwork needed.' },
  { icon: '🔍', step: '02', title: 'Match', desc: 'Hospitals post blood requests. Donors see nearby matches sorted by distance.' },
  { icon: '❤️', step: '03', title: 'Save a Life', desc: 'Donors respond in real time. One donation can save up to 3 lives.' },
];

const testimonials = [
  { name: 'Dr. Priya Sharma', role: 'Apollo Hospital, Hyderabad', text: 'Blood Connector helped us find 3 O- donors within 20 minutes during an emergency. Truly life-saving.' },
  { name: 'Rahul Menon', role: 'Blood Donor, Bangalore', text: 'I\'ve donated 8 times through this platform. The process is seamless and the impact is real.' },
  { name: 'KIMS Hospital', role: 'Secunderabad', text: 'The critical alert system ensures the right donors are notified instantly. Our fulfillment rate is up 60%.' },
];

function AnimatedCounter({ target, suffix = '', duration = 1800 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(current));
        }, duration / steps);
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

export default function Landing() {
  const { user } = useAuth();
  const dashboardPath = user?.role === 'donor' ? '/donor/dashboard' : '/hospital/dashboard';

  return (
    <div className="bg-cream overflow-x-hidden">
      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="hero-gradient min-h-[92vh] flex items-center justify-center px-4 py-20 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #FFD700 0%, transparent 70%)' }} />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-sm font-medium px-4 py-2 rounded-full mb-8 backdrop-blur-sm"
            style={{ animation: 'fadeIn 0.6s ease-out' }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Real-time blood matching platform
          </div>

          {/* Headline */}
          <h1 className="text-white font-bold leading-tight mb-6"
            style={{ fontSize: 'clamp(2.4rem, 6vw, 4rem)', fontFamily: 'Poppins, sans-serif', animation: 'fadeInUp 0.7s ease-out' }}>
            Every Drop Counts.<br />
            <span style={{ color: '#FFD700' }}>Connect. Donate. Save Lives.</span>
          </h1>

          <p className="text-white/75 text-lg mb-10 max-w-2xl mx-auto leading-relaxed"
            style={{ animation: 'fadeInUp 0.8s ease-out' }}>
            Blood Connector bridges the gap between willing donors and hospitals in urgent need.
            Real-time matching, instant notifications, and a community dedicated to saving lives.
          </p>

          {user ? (
            <Link to={dashboardPath}
              className="inline-flex items-center gap-2 bg-white text-[#C0162C] font-bold px-10 py-4 rounded-2xl text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-200"
              style={{ animation: 'fadeInUp 0.9s ease-out' }}>
              Go to Dashboard →
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center"
              style={{ animation: 'fadeInUp 0.9s ease-out' }}>
              <Link to="/register?role=donor"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#C0162C] font-bold px-8 py-4 rounded-2xl text-base shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-200">
                🤝 Register as Donor
              </Link>
              <Link to="/register?role=hospital"
                className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white/60 text-white font-bold px-8 py-4 rounded-2xl text-base hover:bg-white/10 hover:-translate-y-1 transition-all duration-200">
                🏥 Register Hospital
              </Link>
            </div>
          )}

          {/* Scroll indicator */}
          <div className="mt-16 flex flex-col items-center gap-2 text-white/40 text-xs"
            style={{ animation: 'fadeIn 1.2s ease-out' }}>
            <span>Scroll to explore</span>
            <div className="w-5 h-8 rounded-full border-2 border-white/30 flex items-start justify-center p-1">
              <div className="w-1 h-2 rounded-full bg-white/60 animate-bounce" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats ────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label} className="space-y-1">
              <p className="text-4xl font-bold text-[#C0162C]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <AnimatedCounter target={s.value} suffix={s.suffix} />
              </p>
              <p className="text-gray-500 text-sm font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How it Works ────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-[#FAFAFA]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-[#C0162C] text-sm font-bold tracking-widest uppercase mb-3">Simple Process</span>
            <h2 className="text-4xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Poppins, sans-serif' }}>
              How It Works
            </h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto">Three simple steps between a request and a life saved</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden sm:block absolute top-8 left-[calc(16.7%+12px)] right-[calc(16.7%+12px)] h-0.5 bg-gradient-to-r from-[#C0162C]/30 via-[#C0162C] to-[#C0162C]/30" />

            {steps.map((s, i) => (
              <div key={i} className="card-hover text-center relative z-10 group">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl
                  bg-gradient-to-br from-red-50 to-[#FFF0F0] border-2 border-[#C0162C]/20
                  group-hover:scale-110 transition-transform duration-200">
                  {s.icon}
                </div>
                <span className="inline-block text-xs font-bold text-[#C0162C]/60 tracking-widest mb-2">
                  STEP {s.step}
                </span>
                <h3 className="text-lg font-bold text-[#1A1A2E] mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {s.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Blood Groups ────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            All Blood Groups Welcome
          </h2>
          <p className="text-gray-500 mb-10 text-sm">Every type matters. Every donor counts.</p>
          <div className="flex flex-wrap justify-center gap-4">
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg, i) => (
              <div key={bg} className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-white text-lg
                shadow-lg hover:scale-110 hover:-translate-y-1 transition-all duration-200 cursor-default"
                style={{
                  background: 'linear-gradient(135deg, #C0162C, #8B0000)',
                  animationDelay: `${i * 0.05}s`,
                  boxShadow: '0 6px 20px rgba(192,22,44,0.3)',
                }}>
                {bg}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #2d1b4e 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#FFD700] text-sm font-bold tracking-widest uppercase">Stories</span>
            <h2 className="text-3xl font-bold text-white mt-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Lives Changed
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="card-glass p-6 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <div className="text-[#FFD700] text-2xl mb-4">"</div>
                <p className="text-white/80 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/10">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                    style={{ background: 'linear-gradient(135deg, #C0162C, #8B0000)' }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-white/50 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────────────── */}
      {!user && (
        <section className="py-20 px-4 bg-[#FFF0F0]">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-5xl mb-6">🩸</div>
            <h2 className="text-3xl font-bold text-[#1A1A2E] mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Ready to Make a Difference?
            </h2>
            <p className="text-gray-500 mb-8 max-w-xl mx-auto leading-relaxed">
              Join thousands of donors and hospitals already saving lives through Blood Connector.
              Register free — it takes under 2 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register?role=donor" className="btn-primary px-8 py-3 text-base">
                Become a Donor
              </Link>
              <Link to="/register?role=hospital" className="btn-secondary px-8 py-3 text-base">
                Register Hospital
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="py-10 px-4 bg-[#1A1A2E] text-white/60">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🩸</span>
            <span className="font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Blood Connector</span>
          </div>
          <p className="text-sm text-center">© 2024 Blood Connector. Built to save lives. Every drop counts.</p>
          <div className="flex gap-6 text-sm">
            <Link to="/login" className="hover:text-white transition-colors">Login</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
