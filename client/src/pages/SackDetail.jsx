import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api.js'
import { Layout, TopBar } from '../components/Layout.jsx'
import { C, Badge, Btn, Spinner, Table, TR, TD, formatCurrency, formatDate } from '../components/ui.jsx'

const SACK_STATUS_COLORS = { open:'green', closed:'blue', shipped:'orange', arrived:'purple', cancelled:'red' }

export default function SackDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/reports/sack-manifest/${id}`).then(r => setData(r.data)).finally(() => setLoading(false))
  }, [id])

  if (loading) return <Layout><Spinner /></Layout>
  if (!data) return <Layout><TopBar title="Sack Not Found" /></Layout>

  const { sack, parcels, totals } = data

  return (
    <Layout>
      <TopBar title={`Manifest — ${sack.sack_number}`} subtitle="Printable sack manifest">
        <Btn variant="outline" color="blue" onClick={() => navigate('/sacks')}>
          <i className="ti ti-arrow-left" /> Back to Sacks
        </Btn>
        <Btn color="blue" onClick={() => window.print()}>
          <i className="ti ti-printer" /> Print
        </Btn>
      </TopBar>

      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
        {/* Letterhead */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `2px solid ${C.navy}`, paddingBottom: 16, marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: C.blue, borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-plane" style={{ color: '#fff', fontSize: 18 }} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>EGYPT PLUGS</div>
                <div style={{ fontSize: 10, color: C.muted }}>AIR SHIPPING SERVICES</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
              Cairo: +20 123 456 7890 · Kano: +234 803 123 4567 · Abuja: +234 803 987 6543
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: 1 }}>SACK MANIFEST</div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace' }}>{sack.sack_number}</div>
            <Badge color={SACK_STATUS_COLORS[sack.status]}>{sack.status.toUpperCase()}</Badge>
          </div>
        </div>

        {/* Sack info */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            ['Destination', sack.destination],
            ['Flight / Batch', sack.flight_batch || '—'],
            ['Created By', sack.created_by_name],
            ['Created At', formatDate(sack.created_at)],
          ].map(([l, v]) => (
            <div key={l} style={{ background: C.lightGray, borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, color: C.muted }}>{l}</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          <div style={{ background: '#eff6ff', borderRadius: 8, padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.blue }}>{totals.count}</div>
            <div style={{ fontSize: 11, color: C.muted }}>Total Parcels</div>
          </div>
          <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.green }}>{totals.weight.toFixed(2)} kg</div>
            <div style={{ fontSize: 11, color: C.muted }}>Total Weight</div>
          </div>
          <div style={{ background: '#fff7ed', borderRadius: 8, padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.orange }}>{formatCurrency(totals.value)}</div>
            <div style={{ fontSize: 11, color: C.muted }}>Declared Value</div>
          </div>
        </div>

        {/* Manifest table */}
        <Table headers={['#', 'Tracking ID', 'Customer', 'Receiver', 'Type', 'Qty', 'Weight (kg)', 'Amount', 'Status']}>
          {parcels.map((p, i) => (
            <TR key={p.tracking_id}>
              <TD style={{ color: C.muted }}>{i + 1}</TD>
              <TD><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{p.tracking_id}</span></TD>
              <TD>
                <div>{p.customer_name}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{p.customer_phone}</div>
              </TD>
              <TD>
                <div>{p.receiver_name}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{p.receiver_phone}</div>
              </TD>
              <TD>{p.parcel_type}</TD>
              <TD>{p.quantity}</TD>
              <TD>{Number(p.weight).toFixed(2)}</TD>
              <TD>{formatCurrency(p.total_amount)}</TD>
              <TD><Badge color={p.status === 'packed' ? 'purple' : p.status === 'shipped' ? 'orange' : 'green'}>{p.status}</Badge></TD>
            </TR>
          ))}
        </Table>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.muted }}>
          <span>Generated {formatDate(new Date().toISOString())}</span>
          <span>Egypt Plugs Air Shipping Services — Internal Manifest</span>
        </div>
      </div>
    </Layout>
  )
}
