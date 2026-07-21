import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api.js'
import { Layout, TopBar } from '../components/Layout.jsx'
import { C, Badge, Btn, Spinner, Empty, Table, TR, TD, formatCurrency, formatDate } from '../components/ui.jsx'

const SACK_STATUS_COLORS = { open:'green', closed:'blue', shipped:'orange', arrived:'purple', cancelled:'red' }

export default function Sacks() {
  const navigate = useNavigate()
  const [sacks, setSacks] = useState([])
  const [activeSack, setActiveSack] = useState(null)
  const [sackParcels, setSackParcels] = useState([])
  const [loading, setLoading] = useState(true)
  const [previewNum, setPreviewNum] = useState('')
  const [scanInput, setScanInput] = useState('')
  const [scanFeedback, setScanFeedback] = useState(null)
  const [recentlyAdded, setRecentlyAdded] = useState([])
  const [creating, setCreating] = useState(false)
  const [newSack, setNewSack] = useState({ destination: 'Kano', flight_batch: '', capacity: 50 })

  const loadSacks = async () => {
    setLoading(true)
    try {
      const res = await api.get('/sacks')
      setSacks(res.data.sacks)
      const open = res.data.sacks.find(s => s.status === 'open')
      if (open && !activeSack) selectSack(open)
    } finally { setLoading(false) }
  }

  const selectSack = async (sack) => {
    setActiveSack(sack)
    const res = await api.get(`/sacks/${sack.id}`)
    setSackParcels(res.data.parcels)
  }

  const loadPreview = async (dest) => {
    try {
      const res = await api.get(`/sacks/preview/next?destination=${dest}`)
      setPreviewNum(res.data.sack_number)
    } catch {}
  }

  useEffect(() => { loadSacks() }, [])
  useEffect(() => { loadPreview(newSack.destination) }, [newSack.destination])

  const handleCreateSack = async () => {
    setCreating(true)
    try {
      const res = await api.post('/sacks', newSack)
      await loadSacks()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create sack')
    } finally { setCreating(false) }
  }

  const handleScanAdd = async () => {
    if (!scanInput.trim() || !activeSack) return
    try {
      await api.patch(`/parcels/${scanInput.trim()}/sack`, { sack_id: activeSack.id })
      setScanFeedback({ type: 'success', msg: `✓ ${scanInput.trim()} added to sack` })
      setRecentlyAdded(p => [{ tracking: scanInput.trim() }, ...p].slice(0, 8))
      setScanInput('')
      selectSack(activeSack)
    } catch (err) {
      setScanFeedback({ type: 'error', msg: err.response?.data?.error || 'Failed to add parcel' })
    }
    setTimeout(() => setScanFeedback(null), 3000)
  }

  const handleSackStatus = async (status) => {
    if (!activeSack) return
    try {
      await api.patch(`/sacks/${activeSack.id}/status`, { status })
      await loadSacks()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update sack')
    }
  }

  return (
    <Layout>
      <TopBar title="Sack / Manifest Management" subtitle="Create sacks, pack parcels, and manage shipments" />

      {/* Active sack banner */}
      {activeSack && (
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: 0.5, marginBottom: 2 }}>ACTIVE SACK</div>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace' }}>{activeSack.sack_number}</div>
              <div style={{ display: 'flex', gap: 16, marginTop: 4, fontSize: 11, color: C.muted, flexWrap: 'wrap' }}>
                <span>Destination: <strong style={{ color: C.text }}>{activeSack.destination}</strong></span>
                {activeSack.flight_batch && <span>Flight: <strong style={{ color: C.text }}>{activeSack.flight_batch}</strong></span>}
                <span>Created: <strong style={{ color: C.text }}>{formatDate(activeSack.created_at)}</strong></span>
              </div>
            </div>
            <Badge color={SACK_STATUS_COLORS[activeSack.status] || 'gray'}>{activeSack.status.toUpperCase()}</Badge>
            <div style={{ display: 'flex', gap: 24, textAlign: 'center' }}>
              {[
                [activeSack.parcel_count || 0, 'Parcels', C.blue],
                [`${Number(activeSack.total_weight || 0).toFixed(1)} kg`, 'Weight', C.green],
                [formatCurrency(activeSack.total_value), 'Value', C.orange],
              ].map(([v, l, c]) => (
                <div key={l}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 280px', gap: 20 }}>

        {/* Left: Create + Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 14px' }}>Create New Sack</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['Destination', 'destination', ['Kano','Abuja','Lagos']], ['Sack Type', 'sack_type', ['Standard Sack','Express Sack','Bulk Sack']]].map(([label, key, opts]) => (
                <div key={key}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: C.muted, display: 'block', marginBottom: 3 }}>{label} *</label>
                  <select value={newSack[key] || opts[0]} onChange={e => setNewSack(p => ({ ...p, [key]: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, background: '#fff' }}>
                    {opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: C.muted, display: 'block', marginBottom: 3 }}>Flight / Batch</label>
                <input value={newSack.flight_batch} onChange={e => setNewSack(p => ({ ...p, flight_batch: e.target.value }))}
                  placeholder="e.g. FL-CAI-KNO-210525"
                  style={{ width: '100%', padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, boxSizing: 'border-box' }} />
              </div>
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 7, padding: '8px 10px', fontSize: 11, color: '#92400e', display: 'flex', gap: 6 }}>
                <i className="ti ti-info-circle" style={{ flexShrink: 0, marginTop: 1 }} />
                Sack number is generated automatically
              </div>
              <Btn color="blue" style={{ width: '100%', justifyContent: 'center' }} onClick={handleCreateSack} disabled={creating}>
                <i className="ti ti-plus" /> {creating ? 'Creating...' : 'Generate Sack'}
              </Btn>
              {previewNum && (
                <div style={{ background: C.lightGray, borderRadius: 7, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: C.muted }}>Next Sack Number</div>
                  <div style={{ fontSize: 15, fontWeight: 800, fontFamily: 'monospace', letterSpacing: 0.5 }}>{previewNum}</div>
                </div>
              )}
            </div>
          </div>

          {/* All sacks list */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 10px' }}>All Sacks</h2>
            {loading ? <Spinner size={20} /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sacks.slice(0, 8).map(s => (
                  <div key={s.id} onClick={() => selectSack(s)}
                    style={{ padding: '8px 10px', borderRadius: 7, border: `1px solid ${activeSack?.id === s.id ? C.blue : C.border}`, background: activeSack?.id === s.id ? '#eff6ff' : '#fafafa', cursor: 'pointer', transition: 'all 0.1s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>{s.sack_number}</span>
                      <Badge color={SACK_STATUS_COLORS[s.status] || 'gray'}>{s.status}</Badge>
                    </div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{s.destination} · {s.parcel_count || 0} parcels · {Number(s.total_weight || 0).toFixed(1)} kg</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sack actions */}
          {activeSack && activeSack.status === 'open' && (
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
              <h2 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 10px' }}>Sack Actions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Btn variant="outline" color="blue" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleSackStatus('closed')}>
                  <i className="ti ti-lock" /> Close Sack
                </Btn>
                <Btn color="blue" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleSackStatus('shipped')}>
                  <i className="ti ti-truck" /> Mark as Shipped
                </Btn>
              </div>
              {/* Progress bar */}
              {activeSack.capacity > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.muted, marginBottom: 4 }}>
                    <span>Sack Capacity</span>
                    <span style={{ fontWeight: 600 }}>{activeSack.parcel_count || 0} / {activeSack.capacity}</span>
                  </div>
                  <div style={{ background: C.border, borderRadius: 4, height: 6 }}>
                    <div style={{ width: `${Math.min(100, ((activeSack.parcel_count || 0) / activeSack.capacity) * 100)}%`, background: C.green, borderRadius: 4, height: '100%', transition: 'width 0.3s' }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Middle: Sack parcel list */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
              {activeSack ? `Parcels in ${activeSack.sack_number}` : 'Select a Sack'}
              {sackParcels.length > 0 && <span style={{ color: C.muted, fontWeight: 400 }}> ({sackParcels.length})</span>}
            </h2>
            {activeSack && (
              <div style={{ display: 'flex', gap: 6 }}>
                <Btn size="sm" variant="outline" color="blue" onClick={() => navigate(`/sacks/${activeSack.id}`)}>
                  <i className="ti ti-eye" /> View Manifest
                </Btn>
                <Btn size="sm" variant="outline" color="blue" onClick={() => window.print()}>
                  <i className="ti ti-printer" /> Print
                </Btn>
              </div>
            )}
          </div>

          {!activeSack ? (
            <Empty icon="ti-briefcase" message="Select a sack from the left to view its contents" />
          ) : sackParcels.length === 0 ? (
            <Empty icon="ti-package" message="No parcels in this sack yet. Scan or search to add." />
          ) : (
            <Table headers={['#', 'Tracking Number', 'Customer', 'Weight (kg)', 'Amount (EGP)', 'Status']}>
              {sackParcels.map((p, i) => (
                <TR key={p.id} onClick={() => navigate(`/shipments/${p.tracking_id}`)}>
                  <TD style={{ color: C.muted, fontSize: 12 }}>{i + 1}</TD>
                  <TD><span style={{ fontFamily: 'monospace', fontWeight: 700, color: C.blue, fontSize: 12 }}>{p.tracking_id}</span></TD>
                  <TD>{p.customer_name}</TD>
                  <TD>{Number(p.weight).toFixed(2)}</TD>
                  <TD>{formatCurrency(p.total_amount)}</TD>
                  <TD><Badge color={p.status === 'packed' ? 'purple' : p.status === 'shipped' ? 'orange' : 'green'}>{p.status}</Badge></TD>
                </TR>
              ))}
            </Table>
          )}

          {/* Totals row */}
          {sackParcels.length > 0 && (
            <div style={{ marginTop: 12, padding: '10px 12px', background: C.lightGray, borderRadius: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600 }}>
              <span>Total: {sackParcels.length} parcels</span>
              <span>{sackParcels.reduce((s, p) => s + Number(p.weight), 0).toFixed(2)} kg</span>
              <span>{formatCurrency(sackParcels.reduce((s, p) => s + Number(p.total_amount), 0))}</span>
            </div>
          )}
        </div>

        {/* Right: Add parcels */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Add Parcels to Sack</h2>

          {!activeSack || activeSack.status !== 'open' ? (
            <div style={{ textAlign: 'center', padding: 20, color: C.muted, fontSize: 13 }}>
              <i className="ti ti-lock" style={{ fontSize: 28, marginBottom: 8, display: 'block' }} />
              {!activeSack ? 'Select an open sack first' : 'This sack is closed or shipped'}
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 4, fontWeight: 500 }}>
                  Scan or Enter Tracking Number
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    value={scanInput}
                    onChange={e => setScanInput(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleScanAdd()}
                    placeholder="e.g. KNO-250521-0042"
                    autoFocus
                    style={{ flex: 1, padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, fontFamily: 'monospace', fontWeight: 600 }}
                  />
                  <button onClick={handleScanAdd}
                    style={{ padding: '8px 12px', border: 'none', borderRadius: 6, background: C.blue, color: '#fff', cursor: 'pointer', fontSize: 13 }}>
                    <i className="ti ti-plus" />
                  </button>
                </div>
                {scanFeedback && (
                  <div style={{ marginTop: 6, fontSize: 12, color: scanFeedback.type === 'success' ? C.green : C.red, fontWeight: 500 }}>
                    {scanFeedback.msg}
                  </div>
                )}
              </div>

              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 7, padding: '8px 10px', fontSize: 11, color: '#1e40af', marginBottom: 12 }}>
                <i className="ti ti-info-circle" /> Enter tracking number and press Enter or click +
              </div>

              {recentlyAdded.length > 0 && (
                <>
                  <h3 style={{ fontSize: 12, fontWeight: 600, margin: '0 0 8px', color: C.muted }}>Recently Added</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {recentlyAdded.map((r, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: '#f0fdf4', borderRadius: 6, fontSize: 11 }}>
                        <span style={{ color: C.blue, fontWeight: 700, fontFamily: 'monospace' }}>{r.tracking}</span>
                        <i className="ti ti-circle-check-filled" style={{ color: C.green, fontSize: 16 }} />
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setRecentlyAdded([])}
                    style={{ width: '100%', marginTop: 8, padding: 7, border: `1px solid #fca5a5`, borderRadius: 6, background: '#fee2e2', color: C.red, cursor: 'pointer', fontSize: 11 }}>
                    Clear List
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div style={{ marginTop: 14, fontSize: 11, color: C.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
        <i className="ti ti-info-circle" style={{ color: C.orange }} />
        Once a sack is closed, no parcels can be added or removed. Mark as Shipped only when the sack has physically departed.
      </div>
    </Layout>
  )
}
