import { useEffect, useState } from 'react';
import { getPayments, markPaid, createPayment, getClients } from '../api';
import { PageHeader, Button, Table, TR, TD, StatusTag, Modal, Input, Select, Card } from '../components/UI';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ client_id: '', amount: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), due_date: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    const params = statusFilter ? { status: statusFilter } : {};
    getPayments(params).then(r => setPayments(Array.isArray(r.data) ? r.data : [])).catch(e => {
      console.error('Error loading payments:', e);
      setPayments([]);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { 
    load(); 
    getClients().then(r => setClients(Array.isArray(r.data) ? r.data : r.data?.data || [])).catch(() => setClients([])); 
  }, []);
  useEffect(() => { load(); }, [statusFilter]);

  const handleMarkPaid = async (id) => {
    try { await markPaid(id); toast.success('Pago registrado ✅'); load(); } catch { toast.error('Error'); }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createPayment({ ...form, client_id: Number(form.client_id), amount: Number(form.amount), month: Number(form.month), year: Number(form.year), due_date: new Date(form.due_date).toISOString() });
      toast.success('Pago creado'); setModal(false); load();
    } catch (e) { toast.error(e.response?.data?.detail || 'Error'); } finally { setSaving(false); }
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const getClientName = (clientId) => clients.find(c => c.id === clientId)?.name || `Cliente #${clientId}`;
  const totalPending = payments.filter(p => p.status === 'PENDING' || p.status === 'OVERDUE').reduce((s, p) => s + p.amount, 0);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <PageHeader
        title="Pagos y Facturación"
        subtitle={`${payments.length} registros`}
        action={<Button onClick={() => setModal(true)}>+ Nuevo pago</Button>}
      />

      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Pendientes', count: payments.filter(p => p.status === 'PENDING').length, color: 'var(--amber)', f: 'PENDING' },
          { label: 'Vencidos',   count: payments.filter(p => p.status === 'OVERDUE').length,  color: 'var(--red)',   f: 'OVERDUE' },
          { label: 'Pagados',    count: payments.filter(p => p.status === 'PAID').length,    color: 'var(--green)', f: 'PAID' },
        ].map(s => (
          <button key={s.label}
            onClick={() => setStatusFilter(statusFilter === s.f ? '' : s.f)}
            style={{
              flex: 1, background: statusFilter === s.f ? `${s.color}22` : 'var(--bg2)',
              border: `1px solid ${statusFilter === s.f ? s.color : 'var(--border)'}`,
              borderRadius: 'var(--radius)', padding: '12px 16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>{s.label}</span>
            <span style={{ fontSize: 24, fontFamily: 'var(--mono)', fontWeight: 700, color: s.color }}>{s.count}</span>
          </button>
        ))}
        <div style={{ flex: 1, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>Total por cobrar</span>
          <span style={{ fontSize: 24, fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--accent)' }}>${totalPending.toFixed(0)}</span>
        </div>
      </div>

      {/* Table */}
      <Card style={{ padding: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><span className="spinner" /></div>
        ) : (
          <Table headers={['ID', 'Cliente', 'Monto', 'Período', 'Vencimiento', 'Estado', 'Acciones']}>
            {payments.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Sin pagos registrados</td></tr>
            ) : payments.map(p => (
              <TR key={p.id}>
                <TD mono>#{p.id}</TD>
                <TD>{getClientName(p.client_id)}</TD>
                <TD mono>${p.amount.toFixed(2)}</TD>
                <TD mono>{p.month}/{p.year}</TD>
                <TD mono>
                  <span style={{ color: p.status === 'OVERDUE' ? 'var(--red)' : 'inherit' }}>
                    {format(new Date(p.due_date), 'dd/MM/yyyy')}
                  </span>
                </TD>
                <TD><StatusTag status={p.status === 'PAID' ? 'pagado' : p.status === 'OVERDUE' ? 'vencido' : 'pendiente'} /></TD>
                <TD>
                  {(p.status === 'PENDING' || p.status === 'OVERDUE') && (
                    <Button size="sm" variant="success" onClick={() => handleMarkPaid(p.id)}>
                      ✓ Marcar pagado
                    </Button>
                  )}
                  {p.status === 'PAID' && (
                    <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                      {p.paid_at ? format(new Date(p.paid_at), 'dd/MM/yy HH:mm') : '—'}
                    </span>
                  )}
                </TD>
              </TR>
            ))}
          </Table>
        )}
      </Card>

      {/* Create Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Registrar pago manual">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Select label="Cliente" value={form.client_id} onChange={f('client_id')}>
            <option value="">Selecciona cliente</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input label="Monto" value={form.amount} onChange={f('amount')} type="number" step="0.01" placeholder="0.00" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Mes" value={form.month} onChange={f('month')} type="number" min={1} max={12} />
            <Input label="Año" value={form.year} onChange={f('year')} type="number" />
          </div>
          <Input label="Fecha de vencimiento" value={form.due_date} onChange={f('due_date')} type="date" />
          <Input label="Notas" value={form.notes} onChange={f('notes')} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <Button variant="ghost" onClick={() => setModal(false)}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={saving}>{saving ? 'Guardando...' : 'Crear pago'}</Button>
        </div>
      </Modal>
    </div>
  );
}
