import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/',         icon: '▣', label: 'Dashboard'   },
  { to: '/clients',  icon: '◈', label: 'Clientes'    },
  { to: '/payments', icon: '◎', label: 'Pagos'       },
  { to: '/plans',    icon: '⬡', label: 'Planes'      },
  { to: '/network',  icon: '◉', label: 'Red'         },
];

const styles = {
  sidebar: {
    width: 220, minHeight: '100vh', background: 'var(--bg2)',
    borderRight: '1px solid var(--border)', display: 'flex',
    flexDirection: 'column', position: 'fixed', top: 0, left: 0, zIndex: 100,
  },
  logo: {
    padding: '24px 20px 20px', borderBottom: '1px solid var(--border)',
  },
  logoTitle: {
    fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 18,
    color: 'var(--accent)', letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 8,
  },
  logoDot: {
    width: 8, height: 8, borderRadius: '50%', background: 'var(--green)',
    boxShadow: '0 0 8px var(--green)', animation: 'pulse 2s infinite',
  },
  logoSub: { fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)', marginTop: 2 },
  nav: { flex: 1, padding: '12px 0' },
  link: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 20px', color: 'var(--text2)', fontSize: 13,
    transition: 'all 0.15s', borderLeft: '2px solid transparent',
    textDecoration: 'none',
  },
  icon: { fontSize: 16, width: 20, textAlign: 'center', opacity: 0.7 },
  footer: {
    padding: '16px 20px', borderTop: '1px solid var(--border)',
  },
  user: { fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 8 },
  logoutBtn: {
    width: '100%', padding: '8px', background: 'transparent',
    border: '1px solid var(--border)', color: 'var(--text2)',
    borderRadius: 'var(--radius)', fontSize: 12, transition: 'all 0.15s',
  },
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <div style={styles.logoTitle}>
          <span style={styles.logoDot} />
          SISWISP
        </div>
        <div style={styles.logoSub}>ISP MANAGEMENT v1.0</div>
      </div>

      <nav style={styles.nav}>
        {links.map(({ to, icon, label }) => (
          <NavLink
            key={to} to={to} end={to === '/'}
            style={({ isActive }) => ({
              ...styles.link,
              ...(isActive ? {
                color: 'var(--accent)', borderLeftColor: 'var(--accent)',
                background: 'rgba(0,212,255,0.06)',
              } : {}),
            })}
          >
            <span style={styles.icon}>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={styles.footer}>
        <div style={styles.user}>{user?.email}</div>
        <button
          style={styles.logoutBtn}
          onClick={handleLogout}
          onMouseEnter={e => { e.target.style.borderColor = 'var(--red)'; e.target.style.color = 'var(--red)'; }}
          onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text2)'; }}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
