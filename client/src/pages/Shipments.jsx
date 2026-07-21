import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Layout } from '../components/Layout';
import { TopBar } from '../components/Layout';
import { Badge, Btn, Table, TR, TD, Spinner, Empty, PageHeader, C, STATUS_COLORS, STATUS_LABELS, formatCurrency, formatDate } from '../components/ui';

export default function Shipments() {
  const [parcels, setParcels] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', destination: '' });
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.status) params.set('status', filters.status);
    if (filters.destination) params.set('destination', filters.destination);
    params.set('limit', '30');
    api.get(`/parcels?${params}`).then(r => {
      setParcels(r.data.parcels);
      setTotal(r.data.total);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filters]);

  return (
    <Layout>
      <PageHeader title="Shipments" subtitle={`${total} total parcels`}>
        <Btn color="green" onClick={() => navigate('/shipments/new')}>
          <i className="ti ti-plus" /> New Shipment
        </Btn>
      </PageHeader>

      {/* Filters */}
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, fontSize: 14 }} />
          <input
            placeholder="Search by tracking ID, customer or receiver..."
            value={filters.search}
            onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
            style={{ width: '100%', padding: '8px 10px 8px 32px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, boxSizing: 'border-box' }}
          />
        </div>
        <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
          style={{ padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, background: '#fff' }}>
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filters.destination} onChange={e => setFilters(p => ({ ...p, destination: e.target.value }))}
          style={{ padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, background: '#fff' }}>
          <option value="">All Destinations</option>
          <option>Kano</option><option>Abuja</option><option>Lagos</option>
        </select>
        <Btn variant="outline" color="blue" onClick={load} size="sm">
          <i className="ti ti-refresh" /> Refresh
        </Btn>
      </div>

      {/* Table */}
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        {loading ? <Spinner /> : parcels.length === 0 ? <Empty message="No shipments found" /> : (
          <Table headers={['Tracking ID', 'Customer', 'Receiver', 'Destination', 'Weight', 'Amount', 'Status', 'Date', 'Actions']}>
            {parcels.map(p => (
              <TR key={p.id} onClick={() => navigate(`/shipments/${p.tracking_id}`)}>
                <TD>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.blue, fontFamily: 'monospace' }}>{p.tracking_id}</div>
                  {p.sack_number && <div style={{ fontSize: 10, color: C.muted }}>{p.sack_number}</div>}
                </TD>
                <TD>
                  <div style={{ fontWeight: 600 }}>{p.customer_name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{p.customer_phone}</div>
                </TD>
                <TD>
                  <div>{p.receiver_name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{p.receiver_phone}</div>
                </TD>
                <TD><Badge color={p.destination === 'Kano' ? 'green' : p.destination === 'Abuja' ? 'blue' : 'orange'}>{p.destination}</Badge></TD>
                <TD>{Number(p.weight).toFixed(2)} kg</TD>
                <TD>
                  <div style={{ fontWeight: 600 }}>{formatCurrency(p.total_amount)}</div>
                  {Number(p.total_amount) !== Number(p.amount_paid) && (
                    <div style={{ fontSize: 10, color: C.red }}>Bal: {formatCurrency(Number(p.total_amount) - Number(p.amount_paid))}</div>
                  )}
                </TD>
                <TD><Badge color={STATUS_COLORS[p.status]}>{STATUS_LABELS[p.status]}</Badge></TD>
                <TD style={{ fontSize: 11, color: C.muted }}>{formatDate(p.created_at)}</TD>
                <TD onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Btn size="sm" variant="outline" color="blue" onClick={() => navigate(`/shipments/${p.tracking_id}`)}>
                      <i className="ti ti-eye" />
                    </Btn>
                  </div>
                </TD>
              </TR>
            ))}
          </Table>
        )}

        {!loading && total > 0 && (
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: C.muted }}>
            <span>Showing {parcels.length} of {total} shipments</span>
          </div>
        )}
      </div>
    </Layout>
  );
}
