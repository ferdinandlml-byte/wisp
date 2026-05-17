import { useEffect, useState } from 'react';
import { getPlans, createPlan } from '../api';
import { PageHeader, Button, Card, Modal, Input } from '../components/UI';
import toast from 'react-hot-toast';

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', speed_down: '', speed_up: '', price: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = () => getPlans().then(r => setPlans(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createPlan({ ...form, speed_down: Number(form.speed_down), speed_up: Number(form.speed_up), price: Number(form.price) });
      toast.success('Plan creado'); setModal(false); load();
    } catch (e) { toast.error(e.response?.data?.detail || 'Error'); } finally { setSaving(false); }
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <PageHeader
        title="Planes de Servicio"
        subtitle={`${plans.length} planes configurados`}
        action={<Button onClick={() => setModal(true)}>+ Nuevo plan</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {plans.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--text3)' }}>
            Sin planes. Crea el primero.
          </div>
        ) : plans.map(p => (
          <Card key={p.id} style={{ borderTop: `2px solid var(--accent)`, position: 'relative' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 4 }}>
              PLAN #{p.id}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{p.name}</div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--green)' }}>{p.speed_down}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>Mbps bajada</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--accent)' }}>{p.speed_up}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>Mbps subida</div>
              </div>
            </div>
            {p.description && <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>{p.description}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: 'var(--amber)' }}>
                ${p.price}<span style={{ fontSize: 11, color: 'var(--text3)' }}>/mes</span>
              </div>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: p.is_active ? 'rgba(0,230,118,0.12)' : 'rgba(255,68,68,0.12)', color: p.is_active ? 'var(--green)' : 'var(--red)', border: `1px solid ${p.is_active ? 'rgba(0,230,118,0.25)' : 'rgba(255,68,68,0.25)'}` }}>
                {p.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo plan de servicio">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Nombre del plan" value={form.name} onChange={f('name')} placeholder="Plan 10MB, Empresarial, etc." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Velocidad bajada (Mbps)" value={form.speed_down} onChange={f('speed_down')} type="number" />
            <Input label="Velocidad subida (Mbps)" value={form.speed_up} onChange={f('speed_up')} type="number" />
          </div>
          <Input label="Precio mensual ($)" value={form.price} onChange={f('price')} type="number" step="0.01" />
          <Input label="Descripción (opcional)" value={form.description} onChange={f('description')} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <Button variant="ghost" onClick={() => setModal(false)}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={saving}>{saving ? 'Guardando...' : 'Crear plan'}</Button>
        </div>
      </Modal>
    </div>
  );
}
