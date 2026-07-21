import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../lib/api.js'
import { Layout, TopBar } from '../components/Layout.jsx'
import { C, Badge, Btn, Spinner, STATUS_COLORS, STATUS_LABELS, formatCurrency, formatDate } from '../components/ui.jsx'

const STATUS_STEPS = ['received_cairo','packed','shipped','arrived_destination','out_for_delivery','delivered']

export default function ParcelDetail() {
  const { tracking_id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(tracking_id || searchParams.get('q') || '')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [collectorName, setCollectorName] = useState('')
  const [updating, setUpdating] = useState(false)

  const load = async (id) => {
    if (!id) return
    setLoading(true); setError(null)
    try {
      const res = await api.get(`/parcels/${id}`)
      setData(res.data)
    } catch (err) {
      setError(err.response?.status === 404 ? `No parcel found with tracking number "${id}"` : 'Server error')
      setData(null)
    } finally {
      setLoading(false) }
  }

  useEffect(() => { if (tracking_id) load(tracking_id) }, [tracking_id])

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) navigate(`/shipments/${query.trim().toUpperCase()}`)
  }

  const handleStatusUpdate = async () => {
    if (!newStatus) return
    setUpdating(true)
    try {
      await api.patch(`/parcels/${data.parcel.tracking_id}/status`, {
        status: newStatus, note: statusNote, collector_name: collectorName
      })
      setShowStatusModal(false)
      load(data.parcel.tracking_id)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status')
    } finally { setUpdating(false) }
  }

  const p = data?.parcel
  const timeline = data?.timeline || []

  return (
    <Layout>
      <TopBar title="Parcel Details" subtitle="View full shipment information and tracking timeline" />

      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, maxWidth: 500 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <i className="ti ti-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
            <input value={query} onChange={e => setQuery(e.target.value.toUpperCase())}
              placeholder="Enter tracking number e.g. KNO-250521-0042"
              style={{ width: '100%', padding: '10px 12px 10px 36px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box', fontFamily: 'monospace', fontWeight: 600 }} />
          </div>
          <Btn type="submit" color="blue"><i className="ti ti-search" /> Search</Btn>
        </div>
      </form>

      {loading && <Spinner />}

      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 12, padding: 24, textAlign: 'center' }}>
          <i className="ti ti-package-off" style={{ fontSize: 40, color: C.red, marginBottom: 12, display: 'block' }} />
          <p style={{ color: C.red, fontWeight: 600, margin: 0 }}>{error}</p>
        </div>
      )}

      {p && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Header card */}
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                <div style={{ width: 56, height: 56, background: '#dbeafe', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="ti ti-package" style={{ fontSize: 30, color: C.blue }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>TRACKING NUMBER</div>
                  <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 1.5, fontFamily: 'monospace' }}>{p.tracking_id}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                    <Badge color={STATUS_COLORS[p.status]}>{STATUS_LABELS[p.status]}</Badge>
                    <Badge color="blue">{p.destination} Office</Badge>
                    {p.sack_number && <Badge color="purple">{p.sack_number}</Badge>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ width: 80, height: 80, background: C.lightGray, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ti ti-qrcode" style={{ fontSize: 40, color: C.muted }} />
                  </div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Scan to view</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, color: C.muted }}>
                  Created <strong>{formatDate(p.created_at)}</strong> by <strong>{p.created_by_name}</strong>
                </div>
                {p.updated_by_name && (
                  <div style={{ fontSize: 11, color: C.muted, marginLeft: 'auto' }}>
                    Updated by <strong>{p.updated_by_name}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Parcel info grid */}
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 14px' }}>Parcel Information</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  ['Parcel Type', p.parcel_type, 'ti-package'],
                  ['Quantity', p.quantity, 'ti-list-numbers'],
                  ['Weight', `${Number(p.weight).toFixed(2)} kg`, 'ti-weight'],
                  ['Declared Value', formatCurrency(p.declared_value), 'ti-currency-dollar'],
                  ['Amount Paid', formatCurrency(p.amount_paid), 'ti-cash'],
                  ['Payment Method', p.payment_method, 'ti-credit-card'],
                ].map(([label, val, icon]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: C.lightGray, borderRadius: 8 }}>
                    <i className={`ti ${icon}`} style={{ fontSize: 16, color: C.blue, marginTop: 1, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, color: C.muted }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{val}</div>
                    </div>
                  </div>
                ))}
              </div>
              {(p.description || p.notes) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                  {p.description && (
                    <div style={{ padding: '10px 12px', background: C.lightGray, borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: C.muted }}>Description</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{p.description}</div>
                    </div>
                  )}
                  {p.notes && (
                    <div style={{ padding: '10px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: '#92400e' }}>Notes</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#78350f' }}>{p.notes}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Customer + Receiver */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { title: 'Customer Information', name: p.customer_name, phone: p.customer_phone, email: p.customer_email, extra: null },
                { title: 'Receiver Information', name: p.receiver_name, phone: p.receiver_phone, extra: `Destination: ${p.destination}` },
              ].map(info => (
                <div key={info.title} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                  <h2 style={{ fontSize: 11, fontWeight: 600, margin: '0 0 12px', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{info.title}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.blue, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                      {info.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{info.name}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{info.phone}</div>
                      {info.email && <div style={{ fontSize: 11, color: C.muted }}>{info.email}</div>}
                      {info.extra && <div style={{ fontSize: 11, color: C.blue, fontWeight: 500, marginTop: 2 }}>{info.extra}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tracking Timeline */}
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Tracking Timeline</h2>
                {p.sack_number && (
                  <Btn size="sm" variant="outline" color="blue" onClick={() => navigate(`/sacks`)}>
                    <i className="ti ti-briefcase" /> View Sack
                  </Btn>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                {STATUS_STEPS.map((step, i) => {
                  const evt = timeline.find(t => t.status === step)
                  const done = !!evt
                  const current = p.status === step
                  const isLast = i === STATUS_STEPS.length - 1
                  return (
                    <div key={step} style={{ display: 'flex', gap: 14, marginBottom: isLast ? 0 : 24, position: 'relative' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: done ? C.green : current ? C.blue : C.border, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, border: current ? `3px solid ${C.blue}` : 'none', transition: 'all 0.2s' }}>
                          <i className={`ti ${done ? 'ti-check' : current ? 'ti-clock' : 'ti-circle'}`} style={{ fontSize: 14, color: done || current ? '#fff' : C.muted }} />
                        </div>
                        {!isLast && <div style={{ width: 2, flex: 1, background: done ? C.green : C.border, margin: '4px 0', minHeight: 20 }} />}
                      </div>
                      <div style={{ flex: 1, paddingBottom: 4 }}>
                        <div style={{ fontWeight: done || current ? 600 : 400, fontSize: 13, color: done || current ? C.text : C.muted }}>
                          {STATUS_LABELS[step]}
                        </div>
                        {evt && (
                          <>
                            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{evt.note}</div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 11, color: C.muted }}>{formatDate(evt.created_at)}</span>
                              {evt.office && <Badge color={evt.office === 'Cairo' ? 'blue' : 'green'}>{evt.office} Office</Badge>}
                            </div>
                          </>
                        )}
                        {!done && !current && <div style={{ fontSize: 11, color: C.muted }}>Pending</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right — Actions */}
          <div style={{ position: 'sticky', top: 20 }}>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Actions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Btn color="blue" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowStatusModal(true)}>
                  <i className="ti ti-refresh" /> Update Status
                </Btn>
                <button style={{ padding: '9px 14px', border: `1px solid ${C.border}`, borderRadius: 8, background: C.white, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                  onClick={() => window.print()}>
                  <i className="ti ti-printer" /> Reprint Label
                </button>
                <a href={`/track/${p.tracking_id}`} target="_blank" rel="noreferrer"
                  style={{ padding: '9px 14px', border: `1px solid ${C.border}`, borderRadius: 8, background: C.white, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: C.text }}>
                  <i className="ti ti-external-link" /> Public Tracking Link
                </a>
                {p.status !== 'hold' ? (
                  <button style={{ padding: '9px 14px', border: `1px solid #fca5a5`, borderRadius: 8, background: '#fee2e2', color: C.red, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="ti ti-circle-x" /> Mark as Hold
                  </button>
                ) : (
                  <button style={{ padding: '9px 14px', border: `1px solid #86efac`, borderRadius: 8, background: '#dcfce7', color: C.green, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="ti ti-circle-check" /> Remove Hold
                  </button>
                )}
              </div>
            </div>

            {/* Balance box */}
            {Number(p.total_amount) > Number(p.amount_paid) && (
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 12, color: '#9a3412', fontWeight: 600, marginBottom: 4 }}>⚠ Outstanding Balance</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.orange }}>
                  {formatCurrency(Number(p.total_amount) - Number(p.amount_paid))}
                </div>
                <div style={{ fontSize: 11, color: '#9a3412', marginTop: 4 }}>
                  Paid: {formatCurrency(p.amount_paid)} of {formatCurrency(p.total_amount)}
                </div>
                <Btn color="orange" size="sm" style={{ marginTop: 10, width: '100%', justifyContent: 'center' }}
                  onClick={() => navigate('/payments')}>
                  <i className="ti ti-credit-card" /> Record Payment
                </Btn>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setShowStatusModal(false)}>
          <div style={{ background: C.white, borderRadius: 14, padding: 28, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 20px' }}>Update Parcel Status</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, display: 'block', marginBottom: 5 }}>New Status *</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, background: '#fff' }}>
                  <option value="">— Select status —</option>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              {newStatus === 'delivered' && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, display: 'block', marginBottom: 5 }}>Collector's Name *</label>
                  <input value={collectorName} onChange={e => setCollectorName(e.target.value)}
                    placeholder="Full name of person who collected" style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              )}
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, display: 'block', marginBottom: 5 }}>Note (Optional)</label>
                <input value={statusNote} onChange={e => setStatusNote(e.target.value)}
                  placeholder="e.g. Arrived via EK-501, collected by staff" style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <Btn color="blue" onClick={handleStatusUpdate} disabled={updating || !newStatus} style={{ flex: 1, justifyContent: 'center' }}>
                {updating ? 'Updating...' : 'Update Status'}
              </Btn>
              <Btn variant="outline" color="gray" onClick={() => setShowStatusModal(false)}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
