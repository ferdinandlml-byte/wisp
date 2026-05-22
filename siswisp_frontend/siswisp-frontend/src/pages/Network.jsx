import { useEffect, useState } from 'react';
import { getClients, pingClient } from '../api';
import { PageHeader, Card, Button } from '../components/UI';

export default function Network() {
  const [clients, setClients] = useState([]);
  const [pings, setPings] = useState({});
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    getClients({ status: 'activo', per_page: 100 }).then(r => setClients(r.data)).catch(() => {});
  }, []);

  const pingOne = async (c) => {
    setPings(p => ({ ...p, [c.id]: 'checking' }));
    try {
      const { data } = await pingClient(c.id);
      setPings(p => ({ ...p, [c.id]: data }));
    } catch {
      setPings(p => ({ ...p, [c.id]: { online: false } }));
    }
  };

  const scanAll = async () => {
    setScanning(true);
    const withIP = clients.filter(c => c.ip_address);
    for (const c of withIP) {
      await pingOne(c);
      await new Promise(r => setTimeout(r, 200));
    }
    setScanning(false);
  };

  const online = Object.values(pings).filter(p => p?.online).length;
  const offline = Object.values(pings).filter(p => p && !p.online && p !== 'checking').length;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <PageHeader
        title="Monitoreo de Red"
        subtitle="Estado de conexiones en tiempo real"
        action={
          <Button onClick={scanAll} disabled={scanning} variant="success">
            {scanning ? '⟳ Escaneando...' : '⟳ Escanear todos'}
          </Button>
        }
      />

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Clientes con IP', value: clients.filter(c => c.ip_address).length, color: 'var(--text)' },
          { label: 'En línea',         value: online,  color: 'var(--green)' },
          { label: 'Sin respuesta',    value: offline, color: 'var(--red)' },
        ].map(s => (
          <Card key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--mono)', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Client grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {clients.filter(c => c.ip_address).map(c => {
          const ping = pings[c.id];
          const isOnline = ping?.online;
          const isChecking = ping === 'checking';
          const hasPing = !!ping;

          return (
            <div
              key={c.id}
              onClick={() => pingOne(c)}
              style={{
                background: 'var(--bg2)',
                border: `1px solid ${hasPing ? (isOnline ? 'rgba(0,230,118,0.4)' : isChecking ? 'rgba(255,170,0,0.4)' : 'rgba(255,68,68,0.3)') : 'var(--border)'}`,
                borderRadius: 'var(--radius)', padding: 16, cursor: 'pointer',
                transition: 'all 0.2s',
                background: hasPing && isOnline ? 'rgba(0,230,118,0.04)' : hasPing && !isOnline && !isChecking ? 'rgba(255,68,68,0.04)' : 'var(--bg2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>#{c.id}</div>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: isChecking ? 'var(--amber)' : hasPing ? (isOnline ? 'var(--green)' : 'var(--red)') : 'var(--text3)',
                  boxShadow: isOnline ? '0 0 6px var(--green)' : 'none',
                  animation: isChecking ? 'pulse 0.6s infinite' : 'none',
                }} />
              </div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)' }}>{c.ip_address}</div>
              {ping && typeof ping === 'object' && (
                <div style={{ fontSize: 10, color: isOnline ? 'var(--green)' : 'var(--red)', marginTop: 6 }}>
                  {isOnline ? `● EN LÍNEA (${ping.packets_received}/3)` : '● SIN RESPUESTA'}
                </div>
              )}
              {isChecking && <div style={{ fontSize: 10, color: 'var(--amber)', marginTop: 6 }}>● Verificando...</div>}
              {!hasPing && <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 6 }}>Click para ping</div>}
            </div>
          );
        })}
      </div>

      {clients.filter(c => c.ip_address).length === 0 && (
        <Card style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ color: 'var(--text3)' }}>No hay clientes activos con IP asignada</div>
        </Card>
      )}
    </div>
  );
}
