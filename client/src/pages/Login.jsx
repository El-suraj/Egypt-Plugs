import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { C } from '../components/ui';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left panel */}
      <div style={{ flex: 1, background: `linear-gradient(135deg, ${C.navy} 0%, #1e40af 100%)`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-plane" style={{ color: '#fff', fontSize: 24 }} />
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 20, letterSpacing: 1 }}>EGYPT PLUGS</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>AIR SHIPPING SERVICES</div>
          </div>
        </div>

        <div>
          <h1 style={{ color: '#fff', fontSize: 48, fontWeight: 800, lineHeight: 1.15, margin: '0 0 16px' }}>
            Track Your<br />Parcel
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, margin: '0 0 28px', maxWidth: 420 }}>
            Enter your tracking number to check the real-time status of your shipment from Cairo to Nigeria.
          </p>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', borderRadius: 14, padding: 5, maxWidth: 480 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, padding: '10px 14px' }}>
              <i className="ti ti-package" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 20 }} />
              <input
                placeholder="e.g. KNO-250521-0042"
                style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 14, width: '100%' }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && e.target.value) {
                    window.location.href = `/track/${e.target.value.trim()}`;
                  }
                }}
              />
            </div>
            <button
              style={{ padding: '10px 22px', background: C.blue, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
              onClick={e => {
                const val = e.target.previousSibling?.querySelector?.('input')?.value;
                if (val) window.location.href = `/track/${val.trim()}`;
              }}
            >
              Track
            </button>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
            <i className="ti ti-info-circle" /> You can track your parcel without logging in.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {[
            ['ti-clock', 'Real-time Tracking', 'Live status updates'],
            ['ti-shield-check', 'Secure & Reliable', 'Your parcels are safe'],
            ['ti-map-pin', 'Wide Coverage', 'Kano, Abuja & Lagos'],
            ['ti-headset', 'Support 24/7', 'Always here to help'],
          ].map(([icon, title, desc]) => (
            <div key={title} style={{ textAlign: 'center' }}>
              <i className={`ti ${icon}`} style={{ fontSize: 24, color: 'rgba(255,255,255,0.8)' }} />
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, marginTop: 8 }}>{title}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - login form */}
      <div style={{ width: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: 340 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <i className="ti ti-user-circle" style={{ fontSize: 36, color: C.blue }} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Staff Login</h2>
            <p style={{ fontSize: 13, color: C.muted, margin: '6px 0 0' }}>Sign in to access the staff dashboard</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, display: 'block', marginBottom: 5 }}>Username or Email</label>
              <div style={{ position: 'relative' }}>
                <i className="ti ti-user" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
                <input
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  placeholder="Enter your username"
                  required
                  style={{ width: '100%', padding: '10px 12px 10px 36px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, display: 'block', marginBottom: 5 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <i className="ti ti-lock" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Enter your password"
                  required
                  style={{ width: '100%', padding: '10px 36px 10px 36px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
            </div>

            {error && (
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.red, display: 'flex', gap: 8, alignItems: 'center' }}>
                <i className="ti ti-alert-circle" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ padding: 12, border: 'none', borderRadius: 8, background: loading ? '#93c5fd' : C.blue, color: '#fff', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {loading ? <><i className="ti ti-loader-2" style={{ animation: 'spin 0.7s linear infinite' }} /> Signing in...</> : <><i className="ti ti-lock" /> Login</>}
            </button>

            <div style={{ textAlign: 'center', fontSize: 12, color: C.muted }}>
              Don't have an account? <span style={{ color: C.blue, cursor: 'pointer', fontWeight: 500 }}>Contact Administrator</span>
            </div>
          </form>

          {/* Demo hint */}
          <div style={{ marginTop: 24, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 11, color: '#166534' }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Demo credentials:</div>
            <div>admin / admin123 (Administrator)</div>
            <div>cairo1 / staff123 (Cairo Staff)</div>
            <div>kano1 / staff123 (Kano Staff)</div>
          </div>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 11, color: C.muted }}>
            © 2025 Egypt Plugs Air Shipping Services
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
