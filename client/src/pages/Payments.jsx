import { useState, useEffect } from 'react'
import api from '../lib/api.js'
import { Layout } from '../components/Layout.jsx'
import { C, Badge, Btn, StatCard, Spinner, Empty, Table, TR, TD, PageHeader, formatCurrency, formatDate } from '../components/ui.jsx'

const STATUS_COLORS = { Paid: 'green', Partial: 'amber', Unpaid: 'red' }
const METHOD_COLORS = { Cash: 'green', 'Bank Transfer': 'blue', 'Mobile Money': 'purple', Outstanding: 'red' }

export default function Payments() {
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [balances, setBalances] = useState([])
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [customers, setCustomers] = useState([])
  const [form, setForm] = useState({ customer_id: '', amount: '', payment_method: 'Cash', type: 'payment', notes: '' })
  const [saving, setSaving] = useState(false)
  const PAGE_SIZE = 7

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/payments/stats'),
      api.get('/payments/balances'),
      api.get('/payments?limit=8'),
    ]).then(([s, b, r]) => {
      setStats(s.data); setBalances(b.data.balances); setRecent(r.data.payments)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])
  useEffect(() => { if (showModal) api.get('/customers?limit=100').then(r => setCustomers(r.data.customers)) }, [showModal])

  const handleRecordPayment = async () => {
    setSaving(true)
    try {
      await api.post('/payments', form)
      setShowModal(false)
      setForm({ customer_id: '', amount: '', payment_method: 'Cash', type: 'payment', notes: '' })
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to record payment')
    } finally { setSaving(false) }
  }

  if (loading) return <Layout><Spinner /></Layout>

  const totalPages = Math.ceil(balances.length / PAGE_SIZE)
  const pagedBalances = balances.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const aging = stats?.aging || {}
  const agingTotal = (aging.d30||0)+(aging.d60||0)+(aging.d90||0)+(aging.d90plus||0)
  const pct = (v) => agingTotal ? Math.round(v / agingTotal * 100) : 0

  // Payment summary for donut
  const paidTotal = balances.filter(b => b.payment_status === 'Paid').reduce((s,b) => s + Number(b.total_spent), 0)
  const partialTotal = balances.filter(b => b.payment_status === 'Partial').reduce((s,b) => s + Number(b.total_paid), 0)
  const unpaidTotal = stats?.outstanding || 0
  const summaryTotal = paidTotal + partialTotal + unpaidTotal || 1

  return (
    <Layout>
      <PageHeader title="Payments & Balances" subtitle="Track customer payments, balances and transaction history">
        <Btn color="blue" onClick={() => setShowModal(true)}>
          <i className="ti ti-plus" /> Record Payment
        </Btn>
      </PageHeader>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard icon="ti-currency-dollar" label="Total Revenue (All Time)" value={formatCurrency(stats.revenue)} color={C.blue} />
        <StatCard icon="ti-cash" label="Received This Month" value={formatCurrency(stats.thisMonth)} color={C.green} />
        <StatCard icon="ti-alert-triangle" label="Outstanding Balance" value={formatCurrency(stats.outstanding)} subColor={C.red} sub={`${stats.customersWithBalance} customers`} color={C.red} />
        <StatCard icon="ti-users" label="Customers with Balance" value={stats.customersWithBalance} color={C.orange} />
        <StatCard icon="ti-list" label="Transactions This Month" value={stats.txCount} color={C.purple} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        <div>
          {/* Balances table */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, fontWeight: 600, fontSize: 14 }}>Customer Balances</div>
            {balances.length === 0 ? <Empty message="No balance records" /> : (
              <Table headers={['Customer', 'City', 'Shipments', 'Total Spent', 'Paid', 'Balance', 'Status', 'Action']}>
                {pagedBalances.map(b => (
                  <TR key={b.id}>
                    <TD>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.blue + '20', color: C.blue, fontWeight: 700, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {b.name.split(' ').map(w=>w[0]).join('').slice(0,2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{b.name}</div>
                          <div style={{ fontSize: 10, color: C.muted }}>{b.phone}</div>
                        </div>
                      </div>
                    </TD>
                    <TD>{b.city || '—'}</TD>
                    <TD>{b.total_shipments}</TD>
                    <TD style={{ fontWeight: 600 }}>{formatCurrency(b.total_spent)}</TD>
                    <TD style={{ color: C.green, fontWeight: 600 }}>{formatCurrency(b.total_paid)}</TD>
                    <TD style={{ color: Number(b.balance) === 0 ? C.green : C.red, fontWeight: 600 }}>{formatCurrency(b.balance)}</TD>
                    <TD><Badge color={STATUS_COLORS[b.payment_status]}>{b.payment_status}</Badge></TD>
                    <TD>
                      {Number(b.balance) > 0 && (
                        <Btn size="sm" color="green" onClick={() => { setForm(f => ({ ...f, customer_id: b.id, amount: b.balance })); setShowModal(true) }}>
                          <i className="ti ti-cash" />
                        </Btn>
                      )}
                    </TD>
                  </TR>
                ))}
              </Table>
            )}
            {balances.length > PAGE_SIZE && (
              <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                <span style={{ color: C.muted }}>Showing {page*PAGE_SIZE+1}-{Math.min((page+1)*PAGE_SIZE, balances.length)} of {balances.length}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button disabled={page===0} onClick={() => setPage(p=>p-1)} style={{ width: 26, height: 26, border: `1px solid ${C.border}`, borderRadius: 5, background: '#fff', cursor: page===0?'not-allowed':'pointer', opacity: page===0?0.4:1 }}>‹</button>
                  <button disabled={page>=totalPages-1} onClick={() => setPage(p=>p+1)} style={{ width: 26, height: 26, border: `1px solid ${C.border}`, borderRadius: 5, background: '#fff', cursor: page>=totalPages-1?'not-allowed':'pointer', opacity: page>=totalPages-1?0.4:1 }}>›</button>
                </div>
              </div>
            )}
          </div>

          {/* Aging summary */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Aging Summary (Outstanding Balances)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                ['0–30 Days', aging.d30, C.green],
                ['31–60 Days', aging.d60, C.blue],
                ['61–90 Days', aging.d90, C.amber],
                ['90+ Days', aging.d90plus, C.red],
              ].map(([range, amount, color]) => (
                <div key={range} style={{ background: C.lightGray, borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{range}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color }}>{formatCurrency(amount)}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{pct(amount)}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Donut */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Payment Summary</h2>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <DonutChart segments={[
                { value: paidTotal, color: C.green },
                { value: partialTotal, color: C.blue },
                { value: unpaidTotal, color: C.red },
              ]} total={summaryTotal} label="EGP" sub={formatCurrency(summaryTotal).replace('EGP ','')} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, marginTop: 8 }}>
              {[['Paid', paidTotal, C.green], ['Partial', partialTotal, C.blue], ['Unpaid', unpaidTotal, C.red]].map(([l,v,c]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />{l}</div>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(v)} ({Math.round(v/summaryTotal*100)}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent transactions */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Recent Transactions</h2>
            {recent.length === 0 ? <Empty message="No transactions yet" /> : recent.map((t, i) => (
              <div key={t.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10, paddingBottom: 10, borderBottom: i < recent.length-1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: t.type === 'payment' ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`ti ${t.type === 'payment' ? 'ti-arrow-down' : 'ti-arrow-up'}`} style={{ fontSize: 13, color: t.type === 'payment' ? C.green : C.red }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{t.type === 'payment' ? 'Payment from' : 'Balance for'} {t.customer_name}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{formatDate(t.created_at)} {t.tracking_id && `· ${t.tracking_id}`}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: t.type === 'payment' ? C.green : C.red }}>{formatCurrency(t.amount)}</div>
                  <Badge color={METHOD_COLORS[t.payment_method] || 'gray'}>{t.payment_method}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Record payment modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background: C.white, borderRadius: 14, padding: 28, width: 420 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 20px' }}>Record Payment</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, display: 'block', marginBottom: 5 }}>Customer *</label>
                <select value={form.customer_id} onChange={e => setForm(p => ({ ...p, customer_id: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, background: '#fff' }}>
                  <option value="">— Select customer —</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, display: 'block', marginBottom: 5 }}>Amount (EGP) *</label>
                  <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, display: 'block', marginBottom: 5 }}>Method</label>
                  <select value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, background: '#fff' }}>
                    <option>Cash</option><option>Bank Transfer</option><option>Mobile Money</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, display: 'block', marginBottom: 5 }}>Notes</label>
                <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional"
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <Btn color="green" onClick={handleRecordPayment} disabled={saving || !form.customer_id || !form.amount} style={{ flex: 1, justifyContent: 'center' }}>
                {saving ? 'Saving...' : 'Record Payment'}
              </Btn>
              <Btn variant="outline" color="gray" onClick={() => setShowModal(false)}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

function DonutChart({ segments, total, label, sub }) {
  const r = 50; const circ = 2 * Math.PI * r
  let offset = 0
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      {segments.map((s, i) => {
        const pct = total ? s.value / total : 0
        const dash = pct * circ
        const el = <circle key={i} cx="70" cy="70" r={r} fill="none" stroke={s.color} strokeWidth="20"
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={-offset} transform="rotate(-90 70 70)" />
        offset += dash
        return el
      })}
      <text x="70" y="66" textAnchor="middle" fontSize="11" fontWeight="700" fill={C.text}>{label}</text>
      <text x="70" y="80" textAnchor="middle" fontSize="9" fill={C.muted}>{sub}</text>
    </svg>
  )
}
