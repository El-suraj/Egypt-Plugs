import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api.js'
import { Layout, TopBar } from '../components/Layout.jsx'
import { C, Badge, Btn, StatCard, Spinner, Empty, Table, TR, TD, PageHeader, formatCurrency, formatDate, timeAgo } from '../components/ui.jsx'

const TYPE_COLORS = { VIP: 'purple', Frequent: 'blue', Regular: 'green', New: 'teal', Dormant: 'gray' }
const STATUS_COLORS = { Active: 'green', Dormant: 'gray', Blocked: 'red' }

export default function Customers() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [stats, setStats] = useState(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState({ search: '', city: '', status: '', type: '' })
  const [showAddModal, setShowAddModal] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', city: 'Kano', type: 'New' })
  const [saving, setSaving] = useState(false)
  const PAGE_SIZE = 8

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.city) params.set('city', filters.city)
    if (filters.status) params.set('status', filters.status)
    if (filters.type) params.set('type', filters.type)
    params.set('limit', PAGE_SIZE); params.set('offset', page * PAGE_SIZE)
    api.get(`/customers?${params}`).then(r => { setCustomers(r.data.customers); setTotal(r.data.total) }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filters, page])
  useEffect(() => { api.get('/customers/stats').then(r => setStats(r.data)) }, [])

  const handleAddCustomer = async () => {
    setSaving(true)
    try {
      await api.post('/customers', newCustomer)
      setShowAddModal(false)
      setNewCustomer({ name: '', phone: '', email: '', city: 'Kano', type: 'New' })
      load(); api.get('/customers/stats').then(r => setStats(r.data))
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add customer')
    } finally { setSaving(false) }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <Layout>
      <PageHeader title="Customer Management" subtitle="Manage your customers and build lasting relationships">
        <Btn color="blue" onClick={() => setShowAddModal(true)}>
          <i className="ti ti-user-plus" /> Add New Customer
        </Btn>
      </PageHeader>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
          <StatCard icon="ti-users" label="Total Customers" value={stats.total?.toLocaleString()} sub={`+${stats.thisMonth} this month`} color={C.blue} />
          <StatCard icon="ti-user-check" label="Active Customers" value={stats.active?.toLocaleString()} sub={`${stats.total ? Math.round(stats.active/stats.total*100) : 0}% of total`} color={C.green} />
          <StatCard icon="ti-star" label="VIP Customers" value={stats.vip?.toLocaleString()} sub={`${stats.total ? Math.round(stats.vip/stats.total*100) : 0}% of total`} color={C.amber} />
          <StatCard icon="ti-user-plus" label="New This Month" value={stats.thisMonth?.toLocaleString()} sub="recently added" color={C.orange} />
          <StatCard icon="ti-currency-dollar" label="Total Revenue" value={formatCurrency(stats.revenue)} sub="from all customers" color={C.purple} />
        </div>
      )}

      {/* Table */}
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
            <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, fontSize: 14 }} />
            <input placeholder="Search by name, phone or email..." value={filters.search}
              onChange={e => { setFilters(p => ({ ...p, search: e.target.value })); setPage(0) }}
              style={{ width: '100%', padding: '7px 10px 7px 32px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, boxSizing: 'border-box' }} />
          </div>
          <select value={filters.city} onChange={e => { setFilters(p => ({ ...p, city: e.target.value })); setPage(0) }}
            style={{ padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, background: '#fff' }}>
            <option value="">All Cities</option><option>Kano</option><option>Abuja</option><option>Lagos</option>
          </select>
          <select value={filters.status} onChange={e => { setFilters(p => ({ ...p, status: e.target.value })); setPage(0) }}
            style={{ padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, background: '#fff' }}>
            <option value="">All Status</option><option>Active</option><option>Dormant</option><option>Blocked</option>
          </select>
          <select value={filters.type} onChange={e => { setFilters(p => ({ ...p, type: e.target.value })); setPage(0) }}
            style={{ padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, background: '#fff' }}>
            <option value="">All Types</option><option>VIP</option><option>Frequent</option><option>Regular</option><option>New</option><option>Dormant</option>
          </select>
        </div>

        {loading ? <Spinner /> : customers.length === 0 ? <Empty message="No customers found" /> : (
          <Table headers={['Customer', 'Contact', 'City', 'Shipments', 'Total Weight', 'Total Spent', 'Balance', 'Last Shipment', 'Status', 'Actions']}>
            {customers.map(c => {
              const initials = c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
              const balance = Number(c.outstanding_balance || 0)
              return (
                <TR key={c.id} onClick={() => navigate(`/customers?id=${c.id}`)}>
                  <TD>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.blue + '20', color: C.blue, fontWeight: 700, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initials}</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                        <Badge color={TYPE_COLORS[c.type] || 'gray'}>{c.type}</Badge>
                      </div>
                    </div>
                  </TD>
                  <TD>
                    <div>{c.phone}</div>
                    {c.email && <div style={{ color: C.muted, fontSize: 11 }}>{c.email}</div>}
                  </TD>
                  <TD>{c.city || '—'}</TD>
                  <TD>{c.total_shipments}<br /><span style={{ color: C.muted, fontSize: 10 }}>Parcels</span></TD>
                  <TD>{Number(c.total_weight || 0).toFixed(2)} kg</TD>
                  <TD style={{ fontWeight: 600, color: C.green }}>{formatCurrency(c.total_spent)}</TD>
                  <TD style={{ fontWeight: 600, color: balance > 0 ? C.red : C.green }}>{formatCurrency(balance)}</TD>
                  <TD>
                    <div>{formatDate(c.last_shipment_at)?.split(',')[0] || '—'}</div>
                    <div style={{ color: C.muted, fontSize: 10 }}>{timeAgo(c.last_shipment_at)}</div>
                  </TD>
                  <TD><Badge color={STATUS_COLORS[c.status] || 'gray'}>{c.status}</Badge></TD>
                  <TD onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Btn size="sm" variant="outline" color="blue" onClick={() => navigate(`/shipments?search=${encodeURIComponent(c.name)}`)}>
                        <i className="ti ti-package" />
                      </Btn>
                    </div>
                  </TD>
                </TR>
              )
            })}
          </Table>
        )}

        {!loading && total > 0 && (
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
            <span style={{ color: C.muted }}>Showing {page * PAGE_SIZE + 1} to {Math.min((page + 1) * PAGE_SIZE, total)} of {total} customers</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                style={{ width: 28, height: 28, border: `1px solid ${C.border}`, borderRadius: 5, background: C.white, cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1 }}>‹</button>
              <span style={{ padding: '0 10px', display: 'flex', alignItems: 'center', fontSize: 12, color: C.muted }}>Page {page + 1} of {totalPages || 1}</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                style={{ width: 28, height: 28, border: `1px solid ${C.border}`, borderRadius: 5, background: C.white, cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page >= totalPages - 1 ? 0.4 : 1 }}>›</button>
            </div>
          </div>
        )}

        <div style={{ padding: '10px 16px', background: '#eff6ff', borderTop: `1px solid #bfdbfe`, fontSize: 11, color: '#1e40af', display: 'flex', gap: 6, alignItems: 'center' }}>
          <i className="ti ti-info-circle" />
          Use customer data responsibly and obtain consent before sending marketing messages.
        </div>
      </div>

      {/* Add customer modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setShowAddModal(false)}>
          <div style={{ background: C.white, borderRadius: 14, padding: 28, width: 420 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 20px' }}>Add New Customer</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[['Name *','name','text'], ['Phone *','phone','text'], ['Email','email','email']].map(([label, key, type]) => (
                <div key={key}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, display: 'block', marginBottom: 5 }}>{label}</label>
                  <input type={type} value={newCustomer[key]} onChange={e => setNewCustomer(p => ({ ...p, [key]: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, display: 'block', marginBottom: 5 }}>City</label>
                  <select value={newCustomer.city} onChange={e => setNewCustomer(p => ({ ...p, city: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, background: '#fff' }}>
                    <option>Kano</option><option>Abuja</option><option>Lagos</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, display: 'block', marginBottom: 5 }}>Type</label>
                  <select value={newCustomer.type} onChange={e => setNewCustomer(p => ({ ...p, type: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, background: '#fff' }}>
                    <option>New</option><option>Regular</option><option>Frequent</option><option>VIP</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <Btn color="blue" onClick={handleAddCustomer} disabled={saving || !newCustomer.name || !newCustomer.phone} style={{ flex: 1, justifyContent: 'center' }}>
                {saving ? 'Saving...' : 'Add Customer'}
              </Btn>
              <Btn variant="outline" color="gray" onClick={() => setShowAddModal(false)}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
