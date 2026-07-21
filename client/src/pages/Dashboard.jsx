import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Layout, TopBar } from '../components/Layout';
import { StatCard, C, Spinner, formatCurrency } from '../components/ui';

const DEST_COLORS = { Kano: C.green, Abuja: C.blue, Lagos: C.red };

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data)).finally(() => setLoading(false));
    const interval = setInterval(() => {
      api.get('/dashboard/stats').then(r => setStats(r.data)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const quickActions = [
    { label: 'New Shipment', icon: 'ti-plus', color: C.green, to: '/shipments/new' },
    { label: 'Create Sack', icon: 'ti-briefcase', color: C.blue, to: '/sacks/new' },
    { label: 'Search Parcel', icon: 'ti-search', color: C.purple, to: '/search' },
    { label: 'Arrivals', icon: 'ti-plane-arrival', color: C.orange, to: '/arrivals' },
    { label: 'Payments', icon: 'ti-credit-card', color: C.teal, to: '/payments' },
  ];

  const pctStr = (n) => {
    if (!n && n !== 0) return null;
    return n >= 0 ? `↑ ${n}% vs yesterday` : `↓ ${Math.abs(n)}% vs yesterday`;
  };

  return (
    <Layout>
      <TopBar title="Dashboard" subtitle="Welcome back — here's what's happening today" />

      {loading ? <Spinner /> : stats && (
        <>
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
            <StatCard icon="ti-package" label="Parcels Today" value={stats.parcelsToday}
              sub={pctStr(stats.changes?.parcels)} color={C.blue} />
            <StatCard icon="ti-weight" label="Total Weight"
              value={`${Number(stats.weightToday || 0).toFixed(1)} kg`}
              sub={pctStr(stats.changes?.weight)} color={C.green} />
            <StatCard icon="ti-truck" label="Pending Shipments" value={stats.pendingShipments}
              sub="Awaiting dispatch" subColor={C.orange} color={C.orange} />
            <StatCard icon="ti-clock" label="Awaiting Pickup" value={stats.awaitingPickup}
              sub="Arrived at destination" color={C.purple} />
            <StatCard icon="ti-currency-dollar" label="Revenue Today"
              value={formatCurrency(stats.revenueToday)}
              sub={pctStr(stats.changes?.revenue)} color={C.teal} />
          </div>

          {/* Quick actions */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: C.text }}>Quick Actions</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
              {quickActions.map(a => (
                <button key={a.to} onClick={() => navigate(a.to)}
                  style={{ background: a.color, border: 'none', borderRadius: 12, padding: '20px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#fff', transition: 'opacity 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <i className={`ti ${a.icon}`} style={{ fontSize: 26 }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Activity + Destinations */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Live Activity */}
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Live Activity</h2>
                <button onClick={() => navigate('/shipments')} style={{ fontSize: 12, color: C.blue, background: 'none', border: 'none', cursor: 'pointer' }}>View All</button>
              </div>
              {stats.activity?.length === 0 ? (
                <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: 20 }}>No activity today yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(stats.activity || []).slice(0, 6).map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.blue + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="ti ti-package" style={{ fontSize: 14, color: C.blue }} />
                      </div>
                      <div style={{ flex: 1, fontSize: 12 }}>
                        <span style={{ fontWeight: 500 }}>New shipment </span>
                        <span
                          style={{ color: C.blue, fontWeight: 600, cursor: 'pointer' }}
                          onClick={() => navigate(`/shipments/${a.ref}`)}
                        >{a.ref}</span>
                        <span style={{ color: C.muted }}> by {a.staff_name}</span>
                      </div>
                      <span style={{ fontSize: 10, color: C.muted, flexShrink: 0 }}>
                        {new Date(a.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Destinations */}
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px' }}>Top Destinations (Today)</h2>
              {stats.destinations?.length === 0 ? (
                <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: 20 }}>No shipments today yet.</p>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                    <DonutChart data={stats.destinations || []} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(stats.destinations || []).map(d => (
                      <div key={d.destination} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: DEST_COLORS[d.destination] || C.gray }} />
                          <span>{d.destination}</span>
                        </div>
                        <span style={{ fontWeight: 600 }}>{d.count} parcels</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      <div style={{ marginTop: 32, textAlign: 'center', fontSize: 11, color: C.muted, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
        © 2025 Egypt Plugs Air Shipping Services · Version 1.0.0
      </div>
    </Layout>
  );
}

function DonutChart({ data }) {
  if (!data.length) return null;
  const total = data.reduce((s, d) => s + d.count, 0);
  const colors = [C.green, C.blue, C.red, C.amber, C.purple];
  let offset = 0;
  const r = 60;
  const circ = 2 * Math.PI * r;

  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      {data.map((d, i) => {
        const pct = d.count / total;
        const dash = pct * circ;
        const el = (
          <circle key={d.destination} cx="80" cy="80" r={r} fill="none"
            stroke={colors[i % colors.length]} strokeWidth="28"
            strokeDasharray={`${dash} ${circ}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 80 80)" />
        );
        offset += dash;
        return el;
      })}
      <text x="80" y="85" textAnchor="middle" fontSize="13" fontWeight="700" fill={C.text}>{total}</text>
    </svg>
  );
}
