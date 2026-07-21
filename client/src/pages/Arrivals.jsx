import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { Layout, TopBar } from '../components/Layout.jsx'
import { C, Badge, Btn, Spinner, Empty, Table, TR, TD, formatDate } from '../components/ui.jsx'

export default function Arrivals() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('ready')
  const [selectedParcel, setSelectedParcel] = useState(null)
  const [showDeliverModal, setShowDeliverModal] = useState(false)
  const [collectorName, setCollectorName] = useState('')
  const [acting, setActing] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/dashboard/arrivals').then(r => {
      setData(r.data)
      if (r.data.arrived.length && !selectedParcel) setSelectedParcel(r.data.arrived[0])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (tracking_id, status, collector_name) => {
    setActing(true)
    try {
      await api.patch(`/parcels/${tracking_id}/status`, { status, collector_name })
      load()
      setShowDeliverModal(false)
      setCollectorName('')
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status')
    } finally { setActing(false) }
  }

  if (loading) return <Layout><Spinner /></Layout>
  if (!data) return <Layout><Empty message="No data" /></Layout>

  const { arrived, outForDelivery, deliveredToday } = data
  const ready = arrived.filter(p => p.status === 'arrived_destination')

  const tabData = {
    ready: ready,
    out: outForDelivery,
    delivered: [], // would need separate endpoint for full list
  }

  const stats = [
    { label: 'Arrived Today', value: arrived.length, icon: 'ti-plane-arrival', color: C.blue },
    { label: 'Ready for Delivery', value: ready.length, icon: 'ti-package', color: C.green },
    { label: 'Out for Delivery', value: outForDelivery.length, icon: 'ti-truck', color: C.orange },
    { label: 'Delivered Today', value: deliveredToday, icon: 'ti-circle-check', color: C.teal },
  ]

  return (
    <Layout>
      <TopBar title={`Arrival & Delivery (${user.office} Office)`} subtitle="Track arrivals and manage delivery to customers" />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px', textAlign: 'center' }}>
            <i className={`ti ${s.icon}`} style={{ fontSize: 22, color: s.color }} />
            <div style={{ fontSize: 24, fontWeight: 700, margin: '4px 0' }}>{s.value}</div>
            <div style={{ fontSize: 11, fontWeight: 500, color: s.color }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
        {/* Arrived parcels list */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Arrived Parcels</h2>
            <Btn size="sm" variant="outline" color="blue" onClick={load}><i className="ti ti-refresh" /> Refresh</Btn>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {[['ready', `Ready (${ready.length})`], ['out', `Out for Delivery (${outForDelivery.length})`]].map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)}
                style={{ fontSize: 11, padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', background: activeTab === key ? C.blue : C.lightGray, color: activeTab === key ? '#fff' : C.muted, fontWeight: 500 }}>
                {label}
              </button>
            ))}
          </div>

          {tabData[activeTab].length === 0 ? <Empty message="No parcels in this category" /> : (
            <Table headers={['Tracking', 'Customer', 'Sack', 'Status', '']}>
              {tabData[activeTab].map(p => (
                <TR key={p.id} onClick={() => setSelectedParcel(p)}>
                  <TD><span style={{ fontFamily: 'monospace', fontWeight: 700, color: C.blue, fontSize: 12 }}>{p.tracking_id}</span></TD>
                  <TD>{p.customer_name}</TD>
                  <TD style={{ color: C.muted, fontSize: 11 }}>{p.sack_number || '—'}</TD>
                  <TD><Badge color={p.status === 'arrived_destination' ? 'green' : 'amber'}>{p.status === 'arrived_destination' ? 'Arrived' : 'Out'}</Badge></TD>
                  <TD onClick={e => e.stopPropagation()}>
                    {p.status === 'arrived_destination' ? (
                      <Btn size="sm" color="blue" onClick={() => updateStatus(p.tracking_id, 'out_for_delivery')} disabled={acting}>
                        <i className="ti ti-truck" />
                      </Btn>
                    ) : (
                      <Btn size="sm" color="purple" onClick={() => { setSelectedParcel(p); setShowDeliverModal(true) }}>
                        <i className="ti ti-check" />
                      </Btn>
                    )}
                  </TD>
                </TR>
              ))}
            </Table>
          )}
        </div>

        {/* Selected parcel detail */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Parcel Details</h2>
          {!selectedParcel ? <Empty message="Select a parcel to view details" /> : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'monospace' }}>{selectedParcel.tracking_id}</span>
                <Badge color={selectedParcel.status === 'arrived_destination' ? 'green' : 'amber'}>
                  {selectedParcel.status === 'arrived_destination' ? 'Arrived' : 'Out for Delivery'}
                </Badge>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                <Row label="Arrived On" value={formatDate(selectedParcel.updated_at)} />
                {selectedParcel.sack_number && <Row label="Sack Number" value={selectedParcel.sack_number} mono color={C.blue} />}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 11, color: C.muted }}>CUSTOMER INFORMATION</div>
                  <div style={{ fontWeight: 600 }}>{selectedParcel.customer_name}</div>
                </div>
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 11, color: C.muted }}>RECEIVER INFORMATION</div>
                  <div style={{ fontWeight: 600 }}>{selectedParcel.receiver_name}</div>
                  <Row label="Phone" value={selectedParcel.receiver_phone} />
                </div>
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 11, color: C.muted }}>PARCEL INFORMATION</div>
                  <Row label="Type" value={selectedParcel.parcel_type} />
                  <Row label="Qty" value={selectedParcel.quantity} />
                  <Row label="Weight" value={`${Number(selectedParcel.weight).toFixed(2)} kg`} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
                <Btn color="blue" onClick={() => navigate(`/shipments/${selectedParcel.tracking_id}`)} style={{ width: '100%', justifyContent: 'center' }}>
                  <i className="ti ti-eye" /> View Full Details
                </Btn>
                {selectedParcel.status === 'arrived_destination' && (
                  <Btn color="green" onClick={() => updateStatus(selectedParcel.tracking_id, 'out_for_delivery')} disabled={acting} style={{ width: '100%', justifyContent: 'center' }}>
                    <i className="ti ti-truck" /> Mark Out for Delivery
                  </Btn>
                )}
                <Btn color="purple" onClick={() => setShowDeliverModal(true)} disabled={acting} style={{ width: '100%', justifyContent: 'center' }}>
                  <i className="ti ti-circle-check" /> Mark as Delivered
                </Btn>
                <Btn color="orange" onClick={() => updateStatus(selectedParcel.tracking_id, 'hold')} disabled={acting} style={{ width: '100%', justifyContent: 'center' }}>
                  <i className="ti ti-hand-stop" /> Hold Parcel
                </Btn>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Deliver Modal */}
      {showDeliverModal && selectedParcel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setShowDeliverModal(false)}>
          <div style={{ background: C.white, borderRadius: 14, padding: 28, width: 400 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px' }}>Mark as Delivered</h2>
            <p style={{ fontSize: 13, color: C.muted, margin: '0 0 16px' }}>
              Parcel <strong style={{ fontFamily: 'monospace' }}>{selectedParcel.tracking_id}</strong> for {selectedParcel.receiver_name}
            </p>
            <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, display: 'block', marginBottom: 5 }}>Collector's Name *</label>
            <input value={collectorName} onChange={e => setCollectorName(e.target.value)} placeholder={selectedParcel.receiver_name}
              style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <Btn color="purple" disabled={acting} style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => updateStatus(selectedParcel.tracking_id, 'delivered', collectorName || selectedParcel.receiver_name)}>
                {acting ? 'Saving...' : 'Confirm Delivery'}
              </Btn>
              <Btn variant="outline" color="gray" onClick={() => setShowDeliverModal(false)}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

function Row({ label, value, mono, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: C.muted }}>{label}</span>
      <span style={{ fontWeight: 500, fontFamily: mono ? 'monospace' : 'inherit', color: color || C.text }}>{value}</span>
    </div>
  )
}
