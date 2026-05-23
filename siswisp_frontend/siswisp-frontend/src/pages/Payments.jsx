import { useEffect, useState } from 'react';
import { getPayments, markPaid, createPayment, updatePayment, getClients, fixPaymentMonths } from '../api';
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
    month: new Date().getMonth() + 1, 
    year: new Date().getFullYear(), 
    months_duration: 1,
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
    // Auto-fix old payment data on initial load
    fixPaymentMonths().catch(() => {}); // Silent fail
    
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

  const getMonthName = (monthNum) => {
    try {
      const date = new Date(2026, monthNum - 1, 1);
      return format(date, 'MMMM', { locale: es }).charAt(0).toUpperCase() + format(date, 'MMMM', { locale: es }).slice(1);
    } catch {
      return monthNum;
    }
  };

  const formatPeriodName = (payment) => {
    if (!payment.period) {
      return `${getMonthName(payment.month)}/${payment.year}`;
    }
    // period es algo como "5/2026 - 8/2026"
    const parts = payment.period.split(' - ');
    if (parts.length === 2) {
      const [start, end] = parts;
      const [startMonth, startYear] = start.split('/');
      const [endMonth, endYear] = end.split('/');
      return `${getMonthName(Number(startMonth))}/${startYear} → ${getMonthName(Number(endMonth))}/${endYear}`;
    }
    return payment.period;
  };

  // Formatea la fecha de terminación como "22 de septiembre de 2026"
  const formatEndDateLong = (payment) => {
    try {
      if (payment.end_month && payment.end_year) {
        const endMonth = Number(payment.end_month);
        const endYear = Number(payment.end_year);
        // Usar el día de la fecha de vencimiento o 22 como default
        const dueDate = new Date(payment.due_date);
        const day = dueDate ? dueDate.getDate() : 22;
        const date = new Date(endYear, endMonth - 1, day);
        return format(date, "dd 'de' MMMM 'de' yyyy", { locale: es });
      }
    } catch (e) {
      console.error('Error formatting end date:', e);
    }
    return '';
  };

  const calculateMonthsCovered = (month, endMonth, year, endYear, billingDay = 22) => {
    const m = Number(month);
    const em = Number(endMonth);
    const y = Number(year);
    const ey = Number(endYear);
    const bd = Number(billingDay) || 22;
    
    // Calculate considering actual days between dates
    // Example: 22 May to 22 August = 92 days / 30 = ~3 months
    try {
      const startDate = new Date(y, m - 1, bd);  // month is 0-indexed in Date
      const endDate = new Date(ey, em - 1, bd);
      
      const daysDiff = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
      const monthsCovered = Math.round(daysDiff / 30);
      
      return Math.max(1, monthsCovered); // Minimum 1 month
    } catch {
      // Fallback to month counting if error
      if (em >= m && ey === y) {
        return (em - m) + 1;
      } else if (ey > y) {
        return (12 - m) + em + 1;
      }
      return 1;
    }
  };

  const calculateEndMonthYear = (startMonth, startYear, monthsDuration) => {
    // Ensure all are numbers (duration comes from input as string)
    const start = Number(startMonth);
    const duration = Number(monthsDuration);
    const startY = Number(startYear);
    
    // Duration of N months: if start=5 (May) and duration=4
    // Coverage: May(5), June(6), July(7), August(8)
    // So endMonth = start + (duration - 1) = 5 + 3 = 8
    let endMonth = start + (duration - 1);
    let endYear = startY;
    
    while (endMonth > 12) {
      endMonth -= 12;
      endYear += 1;
    }
    
    return { endMonth, endYear };
  };

  const getEndMonthYearFromForm = () => {
    return calculateEndMonthYear(form.month, form.year, form.months_duration);
  };

  const calculateAmount = (clientId, monthsDuration) => {
    if (!clientId) return '';
    const client = clients.find(c => c.id === Number(clientId));
    if (!client || !client.plan) return '';
    
    const planPrice = client.plan.price || 0;
    const duration = Number(monthsDuration); // Ensure it's a number
    return (planPrice * duration).toFixed(2);
  };

  // Recalculate amount when client or months_duration changes
  useEffect(() => {
    if (form.client_id && modal && form.months_duration) {
      const newAmount = calculateAmount(form.client_id, form.months_duration);
      // Amount is calculated on display, not stored in form
    }
  }, [form.client_id, form.months_duration, modal]);

  const openCreate = () => {
    setForm({ 
      client_id: '', 
      month: new Date().getMonth() + 1, 
      year: new Date().getFullYear(), 
      months_duration: 1,
      status: 'PENDING',
      notes: '' 
    });
    setSelected(null);
    setModal('create');
  };

  const openEdit = (payment) => {
    // Calculate months_duration from payment month/end_month/year/end_year
    const client = clients.find(c => c.id === payment.client_id);
    const billingDay = client?.billing_day || 22;
    const monthsCovered = calculateMonthsCovered(payment.month, payment.end_month, payment.year, payment.end_year, billingDay);
    
    setSelected(payment);
    setForm({
      client_id: payment.client_id,
      month: payment.month,
      year: payment.year,
      months_duration: monthsCovered,
      status: payment.status,
      notes: payment.notes || ''
    });
    setModal('edit');
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const { endMonth, endYear } = getEndMonthYearFromForm();
      
      // Validar datos requeridos
      if (!form.client_id) {
        toast.error('Debes seleccionar un cliente');
        setSaving(false);
        return;
      }

      const payload = { 
        client_id: Number(form.client_id), 
        month: Number(form.month),
        end_month: endMonth,
        year: Number(form.year),
        end_year: endYear,
        status: form.status,
        notes: form.notes || ''
      };

      console.log('Enviando payload:', payload); // DEBUG

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
      console.error('Error:', e); // DEBUG
      toast.error(e.response?.data?.detail || 'Error al guardar'); 
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
            ) : payments.map(p => {
              const statusColor = p.status === 'PAID' ? '#10b981' : p.status === 'OVERDUE' ? '#ef4444' : '#f59e0b';
              return (
              <TR key={p.id} style={{ borderLeftWidth: 4, borderLeftColor: statusColor, borderLeftStyle: 'solid' }}>
                <TD mono>#{p.id}</TD>
                <TD mono>{getClientName(p.client_id)}</TD>
                <TD mono>${p.amount.toFixed(2)}</TD>
                <TD>{formatPeriodName(p)}</TD>
                <TD mono>{p.months_covered || 1}</TD>
                <TD mono>
                  <span style={{ color: p.status === 'PAID' ? 'var(--green)' : p.status === 'OVERDUE' ? 'var(--red)' : 'inherit' }}>
                    {p.status === 'PAID' ? '✓ ' : ''}{formatEndDateLong(p) || format(new Date(p.due_date), 'dd/MM/yyyy')}
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
            );
            })}
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
          
          <div style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>PERIODO Y DURACION</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, color: 'var(--text3)', marginBottom: 5, fontWeight: 500 }}>MES INICIAL</label>
                <Select value={form.month} onChange={f('month')} style={{ width: '100%', fontSize: 13 }}>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                    <option key={m} value={m}>{getMonthName(m)}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, color: 'var(--text3)', marginBottom: 5, fontWeight: 500 }}>AÑO</label>
                <Input value={form.year} onChange={f('year')} type="number" style={{ fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, color: 'var(--text3)', marginBottom: 5, fontWeight: 500 }}>CANTIDAD MESES</label>
                <Input value={form.months_duration} onChange={f('months_duration')} type="number" min={1} max={36} style={{ fontSize: 13 }} />
              </div>
            </div>
            
            {form.client_id && (
              <div style={{ marginTop: 12, padding: 12, background: 'rgba(76, 175, 80, 0.08)', border: '1px solid rgba(76, 175, 80, 0.2)', borderRadius: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase' }}>RESUMEN DEL PAGO</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, color: 'var(--text)' }}>
                  <div>
                    <span style={{ color: 'var(--text3)', fontSize: 10, fontWeight: 500 }}>PERIODO</span><br />
                    <strong style={{ color: 'var(--accent)', fontSize: 13 }}>{getMonthName(form.month)} a {getMonthName(getEndMonthYearFromForm().endMonth)}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text3)', fontSize: 10, fontWeight: 500 }}>MONTO TOTAL</span><br />
                    <strong style={{ color: 'var(--accent)', fontSize: 13 }}>$ {calculateAmount(form.client_id, form.months_duration)}</strong>
                  </div>
                </div>
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(76, 175, 80, 0.2)', fontSize: 10, color: 'var(--text2)' }}>
                  {clients.find(c => c.id === Number(form.client_id))?.plan?.price.toFixed(2) || '0.00'}/mes x {form.months_duration} meses = $ {calculateAmount(form.client_id, form.months_duration)}
                </div>
              </div>
            )}
          </div>
          
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
