import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const stats = [
  { label: 'Registered Donors', value: '12,400+' },
  { label: 'Hospitals Connected', value: '380+' },
  { label: 'Lives Saved', value: '5,200+' },
  { label: 'Requests Fulfilled', value: '8,900+' }
];

const steps = [
  { icon: '📝', title: 'Register', desc: 'Sign up as a Donor or a Hospital in under 2 minutes.' },
  { icon: '🔍', title: 'Match', desc: 'Hospitals post blood requests. Donors see nearby matches instantly.' },
  { icon: '🤝', title: 'Connect', desc: 'Donors respond to requests. Hospitals get notified in real time.' },
  { icon: '❤️', title: 'Save a Life', desc: 'One donation can save up to 3 lives. Every drop counts.' }
];

export default function Landing() {
  const { user } = useAuth();
  const dashboardPath = user?.role === 'donor' ? '/donor/dashboard' : '/hospital/dashboard';

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-red-600 to-red-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-4">🩸</div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            Connecting Donors with Hospitals,<br />
            <span className="text-red-200">One Drop at a Time</span>
          </h1>
          <p className="text-red-100 text-lg mb-8 max-w-2xl mx-auto">
            Blood Connector bridges the gap between willing donors and hospitals in urgent need.
            Real-time matching, instant notifications, and a community dedicated to saving lives.
          </p>
          {user ? (
            <Link to={dashboardPath} className="bg-white text-red-600 font-bold px-8 py-3 rounded-lg text-lg hover:bg-red-50 transition-colors inline-block">
              Go to Dashboard
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register?role=donor"
                className="bg-white text-red-600 font-bold px-8 py-3 rounded-lg text-lg hover:bg-red-50 transition-colors"
              >
                Register as Donor
              </Link>
              <Link
                to="/register?role=hospital"
                className="bg-transparent border-2 border-white text-white font-bold px-8 py-3 rounded-lg text-lg hover:bg-red-700 transition-colors"
              >
                Register as Hospital
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-red-50">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-red-600">{s.value}</p>
              <p className="text-gray-600 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">How It Works</h2>
          <p className="text-center text-gray-500 mb-10">Simple, fast, and life-saving</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="card text-center hover:shadow-md transition-shadow">
                <div className="text-4xl mb-3">{step.icon}</div>
                <h3 className="font-bold text-gray-800 mb-1">{step.title}</h3>
                <p className="text-gray-500 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blood Groups Info */}
      <section className="py-12 bg-gray-50 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">All Blood Groups Welcome</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
              <span key={bg} className="bg-red-600 text-white font-bold text-lg w-14 h-14 rounded-full flex items-center justify-center shadow">
                {bg}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="py-16 px-4 bg-red-600 text-white text-center">
          <h2 className="text-3xl font-bold mb-3">Ready to Make a Difference?</h2>
          <p className="text-red-100 mb-8 max-w-xl mx-auto">
            Join thousands of donors and hospitals already saving lives through Blood Connector.
          </p>
          <Link
            to="/register"
            className="bg-white text-red-600 font-bold px-10 py-3 rounded-lg text-lg hover:bg-red-50 transition-colors"
          >
            Get Started — It's Free
          </Link>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 text-center text-gray-400 text-sm border-t border-gray-100">
        <p>© 2024 Blood Connector. Built to save lives.</p>
      </footer>
    </div>
  );
}
