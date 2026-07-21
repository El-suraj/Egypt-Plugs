import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { Layout, TopBar } from '../components/Layout.jsx'
import { C, Badge, Btn, StatCard, Spinner, Empty, Table, TR, TD, formatCurrency, formatDate } from '../components/ui.jsx'

export default function Reports() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [byDest, setByDest] = useState([])
  const [byStatus, setByStatus] = useState([])
  const [topCustomers, setTopCustomers] = useState([])
  const [outstanding, setOutstanding] = useState([])
  const [delivery, setDelivery] = useState(null)
  const [staff, setStaff] = useState([])
  const [shipmentsByDay, setShipmentsByDay] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (dateRange.from) params.set('from', dateRange.from)
    if (dateRange.to) params.set('to', dateRange.to)
    const qs = params.toString() ? `?${params}` : ''

    const calls = [
      api.get(`/reports/summary${qs}`),
      api.get(`/reports/by-destination${qs}`),
      api.get('/reports/by-status'),
      api.get(`/reports/top-customers?limit=5${qs ? '&'+params : ''}`),
      api.get('/reports/outstanding-balances'),
      api.get('/reports/delivery-performance'),
      api.get('/reports/shipments-by-day?days=14'),
    ]
    if (user.role === 'admin') calls.push(api.get(`/reports/staff-performance${qs}`))

    Promise.all(calls).then(results => {
      setSummary(results[0].data)
      setByDest(results[1].data.data)
      setByStatus(results[2].data.data)
      setTopCustomers(results[3].data.data)
      setOutstanding(results[4].data.data)
      setDelivery(results[5].data)
      setShipmentsByDay(results[6].data.data)
      if (results[7]) setStaff(results[7].data.data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) return <Layout><Spinner /></Layout>

  const maxShipments = Math.max(...shipmentsByDay.map(d => d.parcels), 1)

  return (
    <Layout>
      <TopBar title="Reports & Analytics" subtitle="Operational insights across Cairo, Kano, Abuja and Lagos">
        <input type="date" value={dateRange.from} onChange={e => setDateRange(p => ({ ...p, from: e.target.value }))}
          style={{ padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12 }} />
        <span style={{ color: C.muted, fontSize: 12 }}>to</span>
        <input type="date" value={dateRange.to} onChange={e => setDateRange(p => ({ ...p, to: e.target.value }))}
          style={{ padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12 }} />
        <Btn size="sm" color="blue" onClick={load}><i className="ti ti-filter" /> Apply</Btn>
      </TopBar>

      {/* Summary KPIs */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 20 }}>
          <StatCard icon="ti-package" label="Total Parcels" value={summary.totalParcels} color={C.blue} />
          <StatCard icon="ti-weight" label="Total Weight" value={`${Number(summary.totalWeight).toFixed(1)} kg`} color={C.green} />
          <StatCard icon="ti-currency-dollar" label="Revenue" value={formatCurrency(summary.totalRevenue)} color={C.teal} />
          <StatCard icon="ti-users" label="Unique Customers" value={summary.uniqueCustomers} color={C.purple} />
          <StatCard icon="ti-circle-check" label="Delivered" value={summary.delivered} color={C.green} />
          <StatCard icon="ti-clock" label="Pending" value={summary.pending} color={C.orange} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Shipments by day bar chart */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px' }}>Shipment Volume — Last 14 Days</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 160 }}>
            {shipmentsByDay.map(d => (
              <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }} title={`${d.day}: ${d.parcels} parcels`}>
                <div style={{ fontSize: 9, color: C.muted, marginBottom: 2 }}>{d.parcels || ''}</div>
                <div style={{ width: '100%', background: C.blue, borderRadius: '4px 4px 0 0', height: `${Math.max(4, (d.parcels / maxShipments) * 120)}px`, transition: 'height 0.3s' }} />
                <div style={{ fontSize: 9, color: C.muted, marginTop: 4, writingMode: 'vertical-rl', textOrientation: 'mixed', height: 30 }}>
                  {new Date(d.day).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By destination */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px' }}>By Destination</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {byDest.map(d => {
              const destColor = d.destination === 'Kano' ? C.green : d.destination === 'Abuja' ? C.blue : C.red
              const pct = byDest.length ? Math.round(d.parcels / byDest.reduce((s,x)=>s+x.parcels,0) * 100) : 0
              return (
                <div key={d.destination}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{d.destination}</span>
                    <span style={{ color: C.muted }}>{d.parcels} parcels · {formatCurrency(d.revenue)}</span>
                  </div>
                  <div style={{ background: C.border, borderRadius: 4, height: 8 }}>
                    <div style={{ width: `${pct}%`, background: destColor, borderRadius: 4, height: '100%', transition: 'width 0.3s' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 10, color: C.muted, marginTop: 4 }}>
                    <span>Delivered: {d.delivered}</span>
                    <span>On Hold: {d.on_hold}</span>
                    <span>Weight: {Number(d.weight).toFixed(1)} kg</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* By status */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px' }}>Parcels by Status</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {byStatus.map(s => (
              <div key={s.status} style={{ background: C.lightGray, borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{s.count}</div>
                <div style={{ fontSize: 11, color: C.muted, textTransform: 'capitalize' }}>{s.status.replace(/_/g, ' ')}</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{Number(s.weight).toFixed(1)} kg · {formatCurrency(s.value)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery performance */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px' }}>Delivery Performance (30 days)</h2>
          {delivery?.performance?.length === 0 ? <Empty message="No delivered parcels yet" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {delivery?.performance?.map(d => (
                <div key={d.destination} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: C.lightGray, borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{d.destination}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{d.total_delivered} delivered</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.green }}>{d.avg_days_to_deliver}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>avg days</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Top customers */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Top Customers by Revenue</h2>
          {topCustomers.length === 0 ? <Empty message="No data" /> : (
            <Table headers={['#', 'Customer', 'City', 'Shipments', 'Spent', 'Outstanding']}>
              {topCustomers.map((c, i) => (
                <TR key={c.id} onClick={() => navigate(`/customers?id=${c.id}`)}>
                  <TD style={{ color: C.muted }}>{i+1}</TD>
                  <TD style={{ fontWeight: 600 }}>{c.name}</TD>
                  <TD>{c.city}</TD>
                  <TD>{c.shipments}</TD>
                  <TD style={{ color: C.green, fontWeight: 600 }}>{formatCurrency(c.total_spent)}</TD>
                  <TD style={{ color: Number(c.outstanding) > 0 ? C.red : C.green }}>{formatCurrency(c.outstanding)}</TD>
                </TR>
              ))}
            </Table>
          )}
        </div>

        {/* Outstanding balances or Staff performance */}
        {user.role === 'admin' ? (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Staff Performance</h2>
            {staff.length === 0 ? <Empty message="No data" /> : (
              <Table headers={['Staff', 'Office', 'Parcels', 'Revenue', 'Payments']}>
                {staff.map(s => (
                  <TR key={s.id}>
                    <TD style={{ fontWeight: 600 }}>{s.name}</TD>
                    <TD><Badge color={s.office === 'Cairo' ? 'blue' : s.office === 'Kano' ? 'green' : 'orange'}>{s.office}</Badge></TD>
                    <TD>{s.parcels_created}</TD>
                    <TD style={{ color: C.green, fontWeight: 600 }}>{formatCurrency(s.revenue_generated)}</TD>
                    <TD>{s.payments_recorded}</TD>
                  </TR>
                ))}
              </Table>
            )}
          </div>
        ) : (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Outstanding Balances</h2>
            {outstanding.length === 0 ? <Empty message="No outstanding balances 🎉" /> : (
              <Table headers={['Customer', 'City', 'Parcels', 'Outstanding']}>
                {outstanding.slice(0,8).map(o => (
                  <TR key={o.id}>
                    <TD style={{ fontWeight: 600 }}>{o.name}</TD>
                    <TD>{o.city}</TD>
                    <TD>{o.parcels_with_balance}</TD>
                    <TD style={{ color: C.red, fontWeight: 600 }}>{formatCurrency(o.outstanding)}</TD>
                  </TR>
                ))}
              </Table>
            )}
          </div>
        )}
      </div>

      {user.role === 'admin' && (
        <div style={{ marginTop: 20 }}>
          <Btn variant="outline" color="blue" onClick={() => navigate('/settings?tab=audit')}>
            <i className="ti ti-history" /> View Full Audit Log
          </Btn>
        </div>
      )}
    </Layout>
  )
}
