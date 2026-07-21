import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../lib/api.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { Layout, TopBar } from '../components/Layout.jsx'
import { C, Badge, Btn, Spinner, Empty, Table, TR, TD, formatDate } from '../components/ui.jsx'

const ROLE_LABELS = { admin: 'Administrator', cairo_staff: 'Cairo Staff', kano_staff: 'Kano Staff', abuja_staff: 'Abuja Staff' }
const ROLE_COLORS = { admin: 'purple', cairo_staff: 'blue', kano_staff: 'green', abuja_staff: 'orange' }

export default function Settings() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') || 'profile')

  return (
    <Layout>
      <TopBar title="Settings" subtitle="Manage your account and system preferences" />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: `1px solid ${C.border}` }}>
        {[
          ['profile', 'Profile', 'ti-user'],
          ['password', 'Password', 'ti-lock'],
          ...(user.role === 'admin' ? [['users', 'Staff Users', 'ti-users'], ['audit', 'Audit Log', 'ti-history']] : []),
          ['company', 'Company Info', 'ti-building'],
        ].map(([key, label, icon]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: '10px 16px', border: 'none', borderBottom: tab === key ? `2px solid ${C.blue}` : '2px solid transparent', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === key ? 600 : 400, color: tab === key ? C.blue : C.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className={`ti ${icon}`} /> {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && <ProfileTab />}
      {tab === 'password' && <PasswordTab />}
      {tab === 'users' && user.role === 'admin' && <UsersTab />}
      {tab === 'audit' && user.role === 'admin' && <AuditTab />}
      {tab === 'company' && <CompanyTab />}
    </Layout>
  )
}

function ProfileTab() {
  const { user } = useAuth()
  const [form, setForm] = useState({ name: user.name, email: user.email || '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await api.patch('/settings/profile', form)
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, maxWidth: 480 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 18px' }}>Profile Information</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 700 }}>
          {user.name.split(' ').map(w=>w[0]).join('').slice(0,2)}
        </div>
        <div>
          <Badge color={ROLE_COLORS[user.role]}>{ROLE_LABELS[user.role]}</Badge>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{user.office} Office · @{user.username}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, display: 'block', marginBottom: 5 }}>Full Name</label>
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, display: 'block', marginBottom: 5 }}>Email</label>
          <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Btn color="blue" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Btn>
          {saved && <span style={{ color: C.green, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}><i className="ti ti-check" /> Saved!</span>}
        </div>
      </div>
    </div>
  )
}

function PasswordTab() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const save = async () => {
    if (form.newPassword !== form.confirm) return setMsg({ type: 'error', text: 'Passwords do not match' })
    if (form.newPassword.length < 6) return setMsg({ type: 'error', text: 'Password must be at least 6 characters' })
    setSaving(true); setMsg(null)
    try {
      await api.post('/settings/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword })
      setMsg({ type: 'success', text: 'Password changed successfully' })
      setForm({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to change password' })
    } finally { setSaving(false) }
  }

  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, maxWidth: 420 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 18px' }}>Change Password</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[['Current Password','currentPassword'], ['New Password','newPassword'], ['Confirm New Password','confirm']].map(([label, key]) => (
          <div key={key}>
            <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, display: 'block', marginBottom: 5 }}>{label}</label>
            <input type="password" value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
          </div>
        ))}
        {msg && <div style={{ fontSize: 13, color: msg.type === 'error' ? C.red : C.green, display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className={`ti ${msg.type === 'error' ? 'ti-alert-circle' : 'ti-check'}`} /> {msg.text}
        </div>}
        <Btn color="blue" onClick={save} disabled={saving || !form.currentPassword || !form.newPassword}>
          {saving ? 'Updating...' : 'Update Password'}
        </Btn>
      </div>
    </div>
  )
}

function UsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', name: '', email: '', role: 'cairo_staff', office: 'Cairo' })
  const [saving, setSaving] = useState(false)

  const load = () => { setLoading(true); api.get('/settings/users').then(r => setUsers(r.data.users)).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [])

  const create = async () => {
    setSaving(true)
    try {
      await api.post('/settings/users', form)
      setShowModal(false)
      setForm({ username: '', password: '', name: '', email: '', role: 'cairo_staff', office: 'Cairo' })
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create user')
    } finally { setSaving(false) }
  }

  const remove = async (id, name) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return
    try { await api.delete(`/settings/users/${id}`); load() }
    catch (err) { alert(err.response?.data?.error || 'Failed to delete') }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Staff Accounts</h2>
        <Btn color="blue" onClick={() => setShowModal(true)}><i className="ti ti-user-plus" /> Add Staff User</Btn>
      </div>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        {loading ? <Spinner /> : users.length === 0 ? <Empty message="No users" /> : (
          <Table headers={['Username', 'Name', 'Email', 'Role', 'Office', 'Last Login', '']}>
            {users.map(u => (
              <TR key={u.id}>
                <TD style={{ fontFamily: 'monospace', fontWeight: 600 }}>{u.username}</TD>
                <TD>{u.name}</TD>
                <TD style={{ color: C.muted, fontSize: 12 }}>{u.email || '—'}</TD>
                <TD><Badge color={ROLE_COLORS[u.role]}>{ROLE_LABELS[u.role]}</Badge></TD>
                <TD>{u.office}</TD>
                <TD style={{ fontSize: 11, color: C.muted }}>{u.last_login ? formatDate(u.last_login) : 'Never'}</TD>
                <TD>
                  <Btn size="sm" variant="outline" color="red" onClick={() => remove(u.id, u.name)}><i className="ti ti-trash" /></Btn>
                </TD>
              </TR>
            ))}
          </Table>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background: C.white, borderRadius: 14, padding: 28, width: 420 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 20px' }}>Add Staff User</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[['Username *','username','text'], ['Password *','password','password'], ['Full Name *','name','text'], ['Email','email','email']].map(([label, key, type]) => (
                <div key={key}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, display: 'block', marginBottom: 5 }}>{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, display: 'block', marginBottom: 5 }}>Role</label>
                  <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, background: '#fff' }}>
                    <option value="cairo_staff">Cairo Staff</option>
                    <option value="kano_staff">Kano Staff</option>
                    <option value="abuja_staff">Abuja Staff</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, display: 'block', marginBottom: 5 }}>Office</label>
                  <select value={form.office} onChange={e => setForm(p => ({ ...p, office: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, background: '#fff' }}>
                    <option>Cairo</option><option>Kano</option><option>Abuja</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <Btn color="blue" onClick={create} disabled={saving || !form.username || !form.password || !form.name} style={{ flex: 1, justifyContent: 'center' }}>
                {saving ? 'Creating...' : 'Create User'}
              </Btn>
              <Btn variant="outline" color="gray" onClick={() => setShowModal(false)}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AuditTab() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.get('/reports/audit-log?limit=100').then(r => setLogs(r.data.logs.filter(l => l.action !== 'settings_store'))).finally(() => setLoading(false)) }, [])

  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
      {loading ? <Spinner /> : logs.length === 0 ? <Empty message="No audit entries" /> : (
        <Table headers={['Action', 'Entity', 'User', 'Office', 'Details', 'Timestamp']}>
          {logs.map(l => (
            <TR key={l.id}>
              <TD><Badge color="blue">{l.action.replace(/_/g,' ')}</Badge></TD>
              <TD style={{ fontSize: 12 }}>{l.entity_type} #{l.entity_id || '—'}</TD>
              <TD>{l.user_name || '—'}</TD>
              <TD>{l.office || '—'}</TD>
              <TD style={{ fontSize: 11, color: C.muted, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.details}</TD>
              <TD style={{ fontSize: 11, color: C.muted }}>{formatDate(l.created_at)}</TD>
            </TR>
          ))}
        </Table>
      )}
    </div>
  )
}

function CompanyTab() {
  const [settings, setSettings] = useState(null)
  useEffect(() => { api.get('/settings').then(r => setSettings(r.data)) }, [])
  if (!settings) return <Spinner />

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px' }}>Company Information</h2>
        {Object.entries(settings.company).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
            <span style={{ color: C.muted, textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}</span>
            <span style={{ fontWeight: 600 }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px' }}>Shipping Configuration</h2>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Destinations</div>
          <div style={{ display: 'flex', gap: 6 }}>{settings.shipping.destinations.map(d => <Badge key={d} color="blue">{d}</Badge>)}</div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Parcel Types</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{settings.shipping.parcelTypes.map(t => <Badge key={t} color="gray">{t}</Badge>)}</div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Payment Methods</div>
          <div style={{ display: 'flex', gap: 6 }}>{settings.shipping.paymentMethods.map(m => <Badge key={m} color="green">{m}</Badge>)}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: `1px solid ${C.border}`, fontSize: 13 }}>
          <span style={{ color: C.muted }}>Sack Capacity</span>
          <span style={{ fontWeight: 600 }}>{settings.shipping.sackCapacity} parcels</span>
        </div>
      </div>
    </div>
  )
}
