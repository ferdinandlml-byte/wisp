import { useEffect, useState } from 'react';
import { getClients, createClient, updateClient, deleteClient, suspendClient, reactivateClient, pingClient, getPlans } from '../api';
import { PageHeader, Button, Table, TR, TD, StatusTag, Modal, Input, Select, Card } from '../components/UI';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', phone: '', email: '', address: '', ip_address: '', billing_day: 1, plan_id: '', notes: '' };

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null); // null | 'create' | 'edit' | 'detail'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [pings, setPings] = useState({});

  const load = () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    getClients(params).then(r => setClients(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); getPlans().then(r => setPlans(r.data)).catch(() => {}); }, []);
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t); }, [search, statusFilter]);

  const openCreate = () => { setForm(EMPTY_FORM); setModal('create'); };
  const openEdit = (c) => { setSelected(c); setForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '', ip_address: c.ip_address || '', billing_day: c.billing_day, plan_id: c.plan.id, notes: c.notes || '' }); setModal('edit'); };
  const openDetail = (c) => { setSelected(c); setModal('detail'); };

  const handleSave = async () => {
    // Validación: Nombre obligatorio
    if (!form.name || form.name.trim() === '') {
      toast.error('El nombre es obligatorio');
      return;
    }
    // Validación: Plan obligatorio
    if (!form.plan_id) {
      toast.error('Debes seleccionar un plan');
      return;
    }
    // Validación: Día de cobro válido
    if (form.billing_day < 1 || form.billing_day > 28) {
      toast.error('Día de cobro debe estar entre 1 y 28');
      return;
    }

    setSaving(true);
    try {
      if (modal === 'create') {
        await createClient({ ...form, plan_id: Number(form.plan_id), billing_day: Number(form.billing_day) });
        toast.success('Cliente creado');
      } else {
        await updateClient(selected.id, { ...form, plan_id: Number(form.plan_id), billing_day: Number(form.billing_day) });
        toast.success('Cliente actualizado');
      }
      setModal(null); load();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const handleSuspend = async (id) => {
    try { await suspendClient(id); toast.success('Cliente suspendido'); load(); } catch { toast.error('Error al suspender'); }
  };
  const handleReactivate = async (id) => {
    try { await reactivateClient(id); toast.success('Cliente reactivado ✅'); load(); } catch { toast.error('Error al reactivar'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar cliente?')) return;
    try { await deleteClient(id); toast.success('Cliente eliminado'); load(); } catch { toast.error('Error'); }
  };
  const handlePing = async (c) => {
    setPings(p => ({ ...p, [c.id]: 'checking' }));
    try {
      const { data } = await pingClient(c.id);
      setPings(p => ({ ...p, [c.id]: data.online ? 'online' : 'offline' }));
    } catch { setPings(p => ({ ...p, [c.id]: 'offline' })); }
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const pingColor = { online: 'var(--green)', offline: 'var(--red)', checking: 'var(--amber)' };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <PageHeader
        title="Clientes"
        subtitle={`${clients.length} registros`}
        action={<Button onClick={openCreate}>+ Nuevo cliente</Button>}
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input
          placeholder="Buscar por nombre..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '9px 14px', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none' }}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '9px 14px', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none' }}>
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="suspendido">Suspendidos</option>
          <option value="cancelado">Cancelados</option>
        </select>
      </div>

      {/* Table */}
      <Card style={{ padding: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><span className="spinner" /></div>
        ) : (
          <Table headers={['Cliente', 'Plan', 'IP', 'Día cobro', 'Estado', 'Ping', 'Acciones']}>
            {clients.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Sin clientes registrados</td></tr>
            ) : clients.map(c => (
              <TR key={c.id} onClick={() => openDetail(c)}>
                <TD>
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{c.phone}</div>
                </TD>
                <TD>
                  <div>{c.plan.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>${c.plan.price}/mes</div>
                </TD>
                <TD mono>{c.ip_address || '—'}</TD>
                <TD mono>{c.billing_day}</TD>
                <TD><StatusTag status={c.status} /></TD>
                <TD>
                  {c.ip_address ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: pingColor[pings[c.id]] || 'var(--text3)' }} />
                      <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); handlePing(c); }}>
                        {pings[c.id] === 'checking' ? '...' : 'Ping'}
                      </Button>
                    </div>
                  ) : <span style={{ color: 'var(--text3)' }}>—</span>}
                </TD>
                <TD>
                  <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>Editar</Button>
                    {c.status === 'activo'
                      ? <Button size="sm" variant="warning" onClick={() => handleSuspend(c.id)}>Cortar</Button>
                      : c.status === 'suspendido'
                        ? <Button size="sm" variant="success" onClick={() => handleReactivate(c.id)}>Activar</Button>
                        : null
                    }
                    <Button size="sm" variant="danger" onClick={() => handleDelete(c.id)}>✕</Button>
                  </div>
                </TD>
              </TR>
            ))}
          </Table>
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal open={modal === 'create' || modal === 'edit'} onClose={() => setModal(null)}
        title={modal === 'create' ? 'Nuevo cliente' : 'Editar cliente'} width={560}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Input label="Nombre completo" value={form.name} onChange={f('name')} required style={{ gridColumn: '1/-1' }} />
          <Input label="Teléfono / WhatsApp" value={form.phone} onChange={f('phone')} placeholder="521..." />
          <Input label="Correo" value={form.email} onChange={f('email')} type="email" />
          <Input label="Dirección" value={form.address} onChange={f('address')} style={{ gridColumn: '1/-1' }} />
          <Input label="IP del cliente" value={form.ip_address} onChange={f('ip_address')} placeholder="192.168.1.x" />
          <Input label="Día de cobro" value={form.billing_day} onChange={f('billing_day')} type="number" min={1} max={28} />
          <Select label="Plan" value={form.plan_id} onChange={f('plan_id')} style={{ gridColumn: '1/-1' }}>
            <option value="">Selecciona un plan</option>
            {plans.map(p => <option key={p.id} value={p.id}>{p.name} — ${p.price}/mes</option>)}
          </Select>
          <Input label="Notas" value={form.notes} onChange={f('notes')} style={{ gridColumn: '1/-1' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <Button variant="ghost" onClick={() => setModal(null)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={modal === 'detail' && !!selected} onClose={() => setModal(null)} title="Detalle del cliente">
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['ID', `#${selected.id}`], ['Nombre', selected.name],
              ['Teléfono', selected.phone || '—'], ['Email', selected.email || '—'],
              ['Dirección', selected.address || '—'], ['IP', selected.ip_address || '—'],
              ['Plan', `${selected.plan.name} — $${selected.plan.price}/mes`],
              ['Velocidad', `${selected.plan.speed_down}↓ / ${selected.plan.speed_up}↑ Mbps`],
              ['Estado', <StatusTag status={selected.status} />],
              ['Alta', new Date(selected.created_at).toLocaleDateString('es-MX')],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>{k}</span>
                <span style={{ fontSize: 13 }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <Button onClick={() => { setModal(null); openEdit(selected); }}>Editar</Button>
              {selected.status === 'activo'
                ? <Button variant="warning" onClick={() => { handleSuspend(selected.id); setModal(null); }}>Cortar servicio</Button>
                : selected.status === 'suspendido'
                  ? <Button variant="success" onClick={() => { handleReactivate(selected.id); setModal(null); }}>Reactivar</Button>
                  : null}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
