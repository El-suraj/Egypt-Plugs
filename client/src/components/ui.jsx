// Shared design tokens
export const C = {
  navy: '#0d1b3e',
  blue: '#2563eb',
  green: '#16a34a',
  orange: '#ea580c',
  purple: '#7c3aed',
  teal: '#0891b2',
  red: '#dc2626',
  amber: '#d97706',
  gray: '#6b7280',
  lightGray: '#f3f4f6',
  border: '#e5e7eb',
  white: '#ffffff',
  text: '#111827',
  muted: '#6b7280',
};

const BADGE_COLORS = {
  green: { bg: '#dcfce7', text: '#166534' },
  blue: { bg: '#dbeafe', text: '#1e40af' },
  orange: { bg: '#ffedd5', text: '#9a3412' },
  red: { bg: '#fee2e2', text: '#991b1b' },
  gray: { bg: '#f3f4f6', text: '#374151' },
  purple: { bg: '#ede9fe', text: '#5b21b6' },
  amber: { bg: '#fef3c7', text: '#92400e' },
  teal: { bg: '#ccfbf1', text: '#0f766e' },
};

export function Badge({ color = 'gray', children }) {
  const c = BADGE_COLORS[color] || BADGE_COLORS.gray;
  return (
    <span style={{ background: c.bg, color: c.text, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12, whiteSpace: 'nowrap', display: 'inline-block' }}>
      {children}
    </span>
  );
}

export function StatCard({ icon, label, value, sub, subColor, color }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className={`ti ${icon}`} style={{ color, fontSize: 18 }} />
        </div>
        <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: subColor || C.green, marginTop: 4, fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

export function Spinner({ size = 24 }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
      <div style={{
        width: size, height: size, border: `3px solid ${C.border}`,
        borderTopColor: C.blue, borderRadius: '50%',
        animation: 'spin 0.7s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function Card({ children, style = {} }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, ...style }}>
      {children}
    </div>
  );
}

export function Btn({ children, color = 'blue', variant = 'solid', size = 'md', onClick, type = 'button', disabled, style = {} }) {
  const colors = { blue: C.blue, green: C.green, red: C.red, orange: C.orange, gray: C.gray };
  const bg = colors[color] || C.blue;
  const pad = size === 'sm' ? '5px 10px' : size === 'lg' ? '12px 24px' : '8px 16px';
  const fontSize = size === 'sm' ? 12 : size === 'lg' ? 15 : 13;

  const solidStyle = { background: bg, color: '#fff', border: 'none' };
  const outlineStyle = { background: 'transparent', color: bg, border: `1px solid ${bg}` };
  const ghostStyle = { background: 'transparent', color: bg, border: 'none' };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: pad, fontSize, fontWeight: 600, borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 6, opacity: disabled ? 0.6 : 1,
        transition: 'opacity 0.15s',
        ...(variant === 'solid' ? solidStyle : variant === 'outline' ? outlineStyle : ghostStyle),
        ...style
      }}
    >
      {children}
    </button>
  );
}

export function Input({ label, required, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 500, color: C.muted }}>
          {label} {required && <span style={{ color: C.red }}>*</span>}
        </label>
      )}
      <input
        {...props}
        style={{
          padding: '8px 12px', border: `1px solid ${error ? C.red : C.border}`, borderRadius: 8,
          fontSize: 13, width: '100%', outline: 'none', boxSizing: 'border-box',
          ...props.style
        }}
      />
      {error && <span style={{ fontSize: 11, color: C.red }}>{error}</span>}
    </div>
  );
}

export function Select({ label, required, children, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 500, color: C.muted }}>
          {label} {required && <span style={{ color: C.red }}>*</span>}
        </label>
      )}
      <select
        {...props}
        style={{
          padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 8,
          fontSize: 13, width: '100%', background: '#fff', boxSizing: 'border-box',
          ...props.style
        }}
      >
        {children}
      </select>
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: C.muted, margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
      {children && <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>{children}</div>}
    </div>
  );
}

export function Empty({ icon = 'ti-inbox', message = 'No data found' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, color: C.muted }}>
      <i className={`ti ${icon}`} style={{ fontSize: 48, marginBottom: 12 }} />
      <p style={{ fontSize: 14, margin: 0 }}>{message}</p>
    </div>
  );
}

export function Table({ headers, children, style = {} }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, ...style }}>
      <thead>
        <tr style={{ background: C.lightGray }}>
          {headers.map(h => (
            <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 600, color: C.muted, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

export function TR({ children, onClick }) {
  return (
    <tr
      onClick={onClick}
      style={{ borderBottom: `1px solid ${C.border}`, cursor: onClick ? 'pointer' : 'default', transition: 'background 0.1s' }}
      onMouseEnter={e => onClick && (e.currentTarget.style.background = '#f9fafb')}
      onMouseLeave={e => onClick && (e.currentTarget.style.background = '')}
    >
      {children}
    </tr>
  );
}

export function TD({ children, style = {} }) {
  return <td style={{ padding: '10px 12px', ...style }}>{children}</td>;
}

// Status color maps
export const STATUS_COLORS = {
  received_cairo: 'blue',
  packed: 'purple',
  shipped: 'orange',
  arrived_destination: 'green',
  out_for_delivery: 'amber',
  delivered: 'green',
  hold: 'red',
  returned: 'gray',
};

export const STATUS_LABELS = {
  received_cairo: 'Received Cairo',
  packed: 'Packed',
  shipped: 'Shipped',
  arrived_destination: 'Arrived',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  hold: 'On Hold',
  returned: 'Returned',
};

export function formatCurrency(n) {
  return `EGP ${Number(n || 0).toLocaleString('en-EG', { minimumFractionDigits: 0 })}`;
}

export function formatDate(s) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(s) {
  if (!s) return '—';
  const diff = Date.now() - new Date(s);
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}
