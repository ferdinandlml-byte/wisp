import { useEffect, useState } from 'react';
import { getPayments, markPaid, createPayment, updatePayment, getClients } from '../api';
import { PageHeader, Button, Table, TR, TD, StatusTag, Modal, Input, Select, Card } from '../components/UI';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ 
    client_id: '', 
    amount: '', 
    month: new Date().getMonth() + 1, 
    end_month: new Date().getMonth() + 1,
    year: new Date().getFullYear(), 
    end_year: new Date().getFullYear(),
    due_date: '', 
    status: 'PENDING',
    notes: '' 
  });
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
    // Get all clients (per_page=100) for dropdown
    getClients({ per_page: 100 }).then(r => {
      const clientsData = Array.isArray(r.data) ? r.data : r.data?.data || [];
      setClients(clientsData);
    }).catch(() => setClients([])); 
  }, []);
  useEffect(() => { load(); }, [statusFilter]);

  const handleMarkPaid = async (id) => {
    try { 
      await updatePayment(id, { status: 'PAID' });
      toast.success('Pago registrado como pagado ✅'); 
      load(); 
    } catch (e) { 
      toast.error(e.response?.data?.detail || 'Error'); 
    }
  };

  const openCreate = () => {
    setForm({ 
      client_id: '', 
      amount: '', 
      month: new Date().getMonth() + 1, 
      end_month: new Date().getMonth() + 1,
      year: new Date().getFullYear(), 
      end_year: new Date().getFullYear(),
      due_date: '', 
      status: 'PENDING',
      notes: '' 
    });
    setSelected(null);
    setModal('create');
  };

  const openEdit = (payment) => {
    setSelected(payment);
    setForm({
      client_id: payment.client_id,
      amount: payment.amount,
      month: payment.month,
      end_month: payment.end_month,
      year: payment.year,
      end_year: payment.end_year,
      due_date: payment.due_date?.split('T')[0] || '',
      status: payment.status,
      notes: payment.notes || ''
    });
    setModal('edit');
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const payload = { 
        client_id: Number(form.client_id), 
        amount: Number(form.amount), 
        month: Number(form.month),
        end_month: Number(form.end_month),
        year: Number(form.year),
        end_year: Number(form.end_year),
        due_date: form.due_date,
        status: form.status,
        notes: form.notes
      };

      if (modal === 'create') {
        await createPayment(payload);
        toast.success('Pago creado ✅');
      } else {
        await updatePayment(selected.id, payload);
        toast.success('Pago actualizado ✅');
      }
      
      setModal(null);
      load();
    } catch (e) { 
      toast.error(e.response?.data?.detail || 'Error'); 
    } finally { 
      setSaving(false); 
    }
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const getClientName = (clientId) => clients.find(c => c.id === clientId)?.name || `Cliente #${clientId}`;
  const totalPending = payments.filter(p => p.status === 'PENDING' || p.status === 'OVERDUE').reduce((s, p) => s + p.amount, 0);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <PageHeader
        title="Pagos y Facturación"
        subtitle={`${payments.length} registros`}
        action={<Button onClick={openCreate}>+ Nuevo pago</Button>}
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
          <Table headers={['ID', 'Cliente', 'Monto', 'Período', 'Meses cubiertos', 'Vencimiento', 'Estado', 'Acciones']}>
            {payments.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Sin pagos registrados</td></tr>
            ) : payments.map(p => (
              <TR key={p.id}>
                <TD mono>#{p.id}</TD>
                <TD>{getClientName(p.client_id)}</TD>
                <TD mono>${p.amount.toFixed(2)}</TD>
                <TD mono>{p.period || `${p.month}/${p.year}`}</TD>
                <TD mono>{p.months_covered || 1}</TD>
                <TD mono>
                  <span style={{ color: p.status === 'OVERDUE' ? 'var(--red)' : 'inherit' }}>
                    {format(new Date(p.due_date), 'dd/MM/yyyy')}
                  </span>
                </TD>
                <TD><StatusTag status={p.status === 'PAID' ? 'pagado' : p.status === 'OVERDUE' ? 'vencido' : 'pendiente'} /></TD>
                <TD style={{ display: 'flex', gap: 6 }}>
                  <Button size="sm" variant="secondary" onClick={() => openEdit(p)}>
                    ✏️ Editar
                  </Button>
                  {(p.status === 'PENDING' || p.status === 'OVERDUE') && (
                    <Button size="sm" variant="success" onClick={() => handleMarkPaid(p.id)}>
                      ✓ Pagado
                    </Button>
                  )}
                </TD>
              </TR>
            ))}
          </Table>
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Registrar nuevo pago' : 'Editar pago'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Select label="Cliente" value={form.client_id} onChange={f('client_id')}>
            <option value="">Selecciona cliente</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input label="Monto total" value={form.amount} onChange={f('amount')} type="number" step="0.01" placeholder="0.00" />
          
          <div style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, fontWeight: 600 }}>PERÍODO DEL PAGO</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>Mes inicial</label>
                <Input value={form.month} onChange={f('month')} type="number" min={1} max={12} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>Mes final</label>
                <Input value={form.end_month} onChange={f('end_month')} type="number" min={1} max={12} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>Año inicial</label>
                <Input value={form.year} onChange={f('year')} type="number" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>Año final</label>
                <Input value={form.end_year} onChange={f('end_year')} type="number" />
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--mono)' }}>
              📅 Cubre: <strong style={{ color: 'var(--accent)' }}>{form.month}/{form.year} → {form.end_month}/{form.end_year}</strong>
            </div>
          </div>
          
          <Input label="Fecha de vencimiento" value={form.due_date} onChange={f('due_date')} type="date" />
          
          <Select label="Estado del pago" value={form.status} onChange={f('status')}>
            <option value="PENDING">Pendiente</option>
            <option value="PAID">Pagado</option>
            <option value="OVERDUE">Vencido</option>
          </Select>
          
          <Input label="Notas" value={form.notes} onChange={f('notes')} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <Button variant="ghost" onClick={() => setModal(null)}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? 'Guardando...' : modal === 'create' ? 'Crear pago' : 'Actualizar pago'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
