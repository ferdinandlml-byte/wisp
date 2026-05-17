import { useEffect, useState } from 'react';
import { getDashboardStats, getPayments } from '../api';
import { StatCard, Card } from '../components/UI';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const mockMonthly = [
  { mes: 'Ene', ingresos: 0 }, { mes: 'Feb', ingresos: 0 }, { mes: 'Mar', ingresos: 0 },
  { mes: 'Abr', ingresos: 0 }, { mes: 'May', ingresos: 0 }, { mes: 'Jun', ingresos: 0 },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    getDashboardStats().then(r => setStats(r.data)).catch(() => {});
    getPayments({ status: 'pagado' }).then(r => setRecent(r.data.slice(0, 5))).catch(() => {});
  }, []);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 4 }}>
          {format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es }).toUpperCase()}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>Panel de Control</h1>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Clientes activos"   value={stats?.active_clients ?? '—'}    icon="◈" color="var(--green)"  sub={`de ${stats?.total_clients ?? 0} totales`} />
        <StatCard label="Suspendidos"         value={stats?.suspended_clients ?? '—'} icon="⊘" color="var(--red)"    sub="requieren atención" />
        <StatCard label="Ingresos del mes"    value={stats ? `$${stats.monthly_income.toFixed(0)}` : '—'} icon="◎" color="var(--accent)" sub="pagos confirmados" />
        <StatCard label="Por cobrar"          value={stats ? `$${stats.pending_income.toFixed(0)}` : '—'} icon="⬡" color="var(--amber)"  sub={`${stats?.overdue_payments ?? 0} vencidos`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* Chart */}
        <Card>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
            Ingresos mensuales
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={mockMonthly}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="mes" tick={{ fill: '#3d5166', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#3d5166', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0f1318', border: '1px solid #1e2d3d', borderRadius: 6, fontSize: 12 }} />
              <Area type="monotone" dataKey="ingresos" stroke="#00d4ff" strokeWidth={2} fill="url(#grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Recent payments */}
        <Card>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
            Últimos pagos
          </div>
          {recent.length === 0 ? (
            <div style={{ color: 'var(--text3)', fontSize: 12, textAlign: 'center', paddingTop: 40 }}>Sin pagos recientes</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recent.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 13 }}>Cliente #{p.client_id}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                      {p.month}/{p.year}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', color: 'var(--green)', fontWeight: 600 }}>
                    ${p.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Status overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 16 }}>
        {[
          { label: 'Activos',     value: stats?.active_clients ?? 0,    color: 'var(--green)' },
          { label: 'Suspendidos', value: stats?.suspended_clients ?? 0, color: 'var(--red)' },
          { label: 'Cancelados',  value: stats?.cancelled_clients ?? 0, color: 'var(--text3)' },
        ].map(({ label, value, color }) => (
          <Card key={label} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--mono)', color }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{label}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
