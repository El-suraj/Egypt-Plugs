import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api.js'
import { C, Spinner } from '../components/ui.jsx'

export default function Track() {
  const { tracking_id } = useParams()
  const navigate = useNavigate()
  const [query, setQuery] = useState(tracking_id || '')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const search = async (id) => {
    if (!id?.trim()) return
    setLoading(true); setError(null); setData(null)
    try {
      const res = await api.get(`/tracking/${id.trim().toUpperCase()}`)
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Parcel not found. Please check your tracking number.')
    } finally { setLoading(false) }
  }

  useEffect(() => { if (tracking_id) search(tracking_id) }, [tracking_id])

  const handleSubmit = (e) => {
    e.preventDefault()
    navigate(`/track/${query.trim().toUpperCase()}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${C.navy} 0%, #1e40af 100%)`, padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-plane" style={{ color: '#fff', fontSize: 22 }} />
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: 1 }}>EGYPT PLUGS</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10 }}>AIR SHIPPING SERVICES</div>
          </div>
        </div>
        <button onClick={() => navigate('/login')}
          style={{ padding: '8px 18px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
          <i className="ti ti-login" /> Staff Login
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 8px', color: C.text }}>Track Your Parcel</h1>
          <p style={{ color: C.muted, fontSize: 15 }}>Enter your tracking number to check real-time shipment status</p>
        </div>

        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 520, marginBottom: 40 }}>
          <div style={{ display: 'flex', background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, padding: '10px 14px' }}>
              <i className="ti ti-package" style={{ color: C.muted, fontSize: 20 }} />
              <input value={query} onChange={e => setQuery(e.target.value.toUpperCase())}
                placeholder="e.g. KNO-260610-0042" autoFocus
                style={{ border: 'none', outline: 'none', fontSize: 15, width: '100%', fontFamily: 'monospace', fontWeight: 600 }} />
            </div>
            <button type="submit" style={{ padding: '12px 28px', background: C.blue, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
              {loading ? <i className="ti ti-loader-2" style={{ animation: 'spin 0.7s linear infinite' }} /> : 'Track'}
            </button>
          </div>
        </form>

        {loading && <Spinner />}

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 12, padding: 20, maxWidth: 480, textAlign: 'center' }}>
            <i className="ti ti-package-off" style={{ fontSize: 36, color: C.red, marginBottom: 8, display: 'block' }} />
            <p style={{ color: C.red, fontWeight: 500, margin: 0, fontSize: 14 }}>{error}</p>
          </div>
        )}

        {data && (
          <div style={{ width: '100%', maxWidth: 600, background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: 1 }}>TRACKING NUMBER</div>
                <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'monospace', letterSpacing: 1 }}>{data.tracking_id}</div>
              </div>
              <div style={{ padding: '8px 16px', borderRadius: 20, background: data.is_delivered ? '#dcfce7' : data.is_held ? '#fee2e2' : '#dbeafe', color: data.is_delivered ? '#166534' : data.is_held ? '#991b1b' : '#1e40af', fontWeight: 700, fontSize: 13 }}>
                {data.status_label}
              </div>
            </div>

            {/* Quick info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
              {[
                ['Destination', data.destination],
                ['Weight', `${Number(data.weight).toFixed(2)} kg`],
                ['Parcel Type', data.parcel_type],
              ].map(([l, v]) => (
                <div key={l} style={{ background: C.lightGray, borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: C.muted }}>{l}</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Timeline */}
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px' }}>Shipment Timeline</h3>
            <div>
              {data.timeline.map((step, i) => (
                <div key={step.status} style={{ display: 'flex', gap: 14, marginBottom: i < data.timeline.length - 1 ? 20 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: step.done ? C.green : step.current ? C.blue : C.border, display: 'flex', alignItems: 'center', justifyContent: 'center', border: step.current ? `3px solid ${C.blue}` : 'none' }}>
                      <i className={`ti ${step.done ? 'ti-check' : step.current ? 'ti-clock' : 'ti-circle'}`} style={{ fontSize: 13, color: step.done || step.current ? '#fff' : C.muted }} />
                    </div>
                    {i < data.timeline.length - 1 && <div style={{ width: 2, flex: 1, background: step.done ? C.green : C.border, margin: '4px 0', minHeight: 16 }} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: step.done || step.current ? 600 : 400, fontSize: 14, color: step.done || step.current ? C.text : C.muted }}>{step.label}</div>
                    {step.timestamp && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{new Date(step.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>}
                    {step.status === 'delivered' && data.collector_name && <div style={{ fontSize: 12, color: C.green, marginTop: 2, fontWeight: 500 }}>Collected by: {data.collector_name}</div>}
                  </div>
                </div>
              ))}
            </div>

            {data.is_held && (
              <div style={{ marginTop: 20, background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: C.red }}>
                <i className="ti ti-alert-triangle" /> This parcel is currently on hold. Please contact our office for more information.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ background: C.navy, padding: '24px 40px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, textAlign: 'center' }}>
        {[
          ['ti-clock', 'Real-time Tracking', 'Live status updates'],
          ['ti-shield-check', 'Secure & Reliable', 'Your parcels are safe'],
          ['ti-map-pin', 'Wide Coverage', 'Kano, Abuja & Lagos'],
          ['ti-headset', 'Support 24/7', 'Always here to help'],
        ].map(([icon, title, desc]) => (
          <div key={title}>
            <i className={`ti ${icon}`} style={{ fontSize: 22, color: 'rgba(255,255,255,0.8)' }} />
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, marginTop: 6 }}>{title}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>{desc}</div>
          </div>
        ))}
      </div>
      <div style={{ background: C.navy, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.4)', padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        © 2025 Egypt Plugs Air Shipping Services. All rights reserved.
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
