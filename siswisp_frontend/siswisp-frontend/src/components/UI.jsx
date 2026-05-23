// ── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: 20, ...style,
    }}>
      {children}
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon, color = 'var(--accent)', sub }) {
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '20px 24px',
      borderTop: `2px solid ${color}`, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color, fontFamily: 'var(--mono)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>{sub}</div>}
      <div style={{ position: 'absolute', right: 16, top: 16, fontSize: 28, opacity: 0.08 }}>{icon}</div>
    </div>
  );
}

// ── Button ───────────────────────────────────────────────────────────────────
export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, style = {} }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    border: 'none', borderRadius: 'var(--radius)', fontFamily: 'var(--font)',
    fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1, transition: 'all 0.15s',
    fontSize: size === 'sm' ? 12 : 13,
    padding: size === 'sm' ? '6px 12px' : '10px 18px',
    ...style,
  };
  const variants = {
    primary:  { background: 'var(--accent)', color: '#000' },
    success:  { background: 'var(--green)', color: '#000' },
    danger:   { background: 'transparent', color: 'var(--red)', border: '1px solid var(--red)' },
    ghost:    { background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border)' },
    warning:  { background: 'transparent', color: 'var(--amber)', border: '1px solid var(--amber)' },
  };
  return (
    <button style={{ ...base, ...variants[variant] }} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

// ── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</label>}
      <input
        style={{
          background: 'var(--bg3)', border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)', padding: '10px 14px', color: 'var(--text)',
          fontFamily: 'var(--font)', fontSize: 14, outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => !error && (e.target.style.borderColor = 'var(--accent)')}
        onBlur={e => !error && (e.target.style.borderColor = 'var(--border)')}
        {...props}
      />
      {error && <span style={{ fontSize: 11, color: 'var(--red)' }}>{error}</span>}
    </div>
  );
}

// ── Select ───────────────────────────────────────────────────────────────────
export function Select({ label, children, size = 8, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</label>}
      <select
        size={size}
        style={{
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '10px 14px', color: 'var(--text)',
          fontFamily: 'var(--font)', fontSize: 14, outline: 'none',
          maxHeight: '250px', overflowY: 'auto'
        }}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 480 }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 12, width, maxWidth: '95vw', maxHeight: '90vh',
        overflow: 'auto', padding: 28,
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Status Tag ───────────────────────────────────────────────────────────────
export function StatusTag({ status }) {
  const styles = {
    pagado: {
      background: '#10b981',
      color: '#fff',
      text: '✓ Pagado'
    },
    pendiente: {
      background: '#f59e0b',
      color: '#fff',
      text: '⏳ Pendiente'
    },
    vencido: {
      background: '#ef4444',
      color: '#fff',
      text: '⚠ Vencido'
    },
    activo: {
      background: '#10b981',
      color: '#fff',
      text: '✓ Activo'
    },
    suspendido: {
      background: '#f59e0b',
      color: '#fff',
      text: '⏸ Suspendido'
    },
    cancelado: {
      background: '#ef4444',
      color: '#fff',
      text: '✕ Cancelado'
    },
  };

  const style = styles[status] || { background: '#6b7280', color: '#fff', text: status };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: '600',
      background: style.background,
      color: style.color,
      whiteSpace: 'nowrap',
    }}>
      {style.text}
    </span>
  );
}

// ── Table ────────────────────────────────────────────────────────────────────
export function Table({ headers, children, empty = 'Sin registros' }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} style={{
                padding: '10px 16px', textAlign: 'left', fontSize: 10,
                color: 'var(--text3)', fontFamily: 'var(--mono)', textTransform: 'uppercase',
                letterSpacing: 1, borderBottom: '1px solid var(--border)',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function TR({ children, onClick }) {
  return (
    <tr
      onClick={onClick}
      style={{ borderBottom: '1px solid var(--border)', cursor: onClick ? 'pointer' : 'default', transition: 'background 0.1s' }}
      onMouseEnter={e => onClick && (e.currentTarget.style.background = 'var(--bg3)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </tr>
  );
}

export function TD({ children, mono }) {
  return (
    <td style={{ padding: '12px 16px', fontSize: 13, fontFamily: mono ? 'var(--mono)' : 'var(--font)', color: 'var(--text)' }}>
      {children}
    </td>
  );
}

// ── Page Header ──────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: -0.5 }}>{title}</h1>
        {subtitle && <p style={{ color: 'var(--text3)', fontSize: 12, fontFamily: 'var(--mono)', marginTop: 4 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
