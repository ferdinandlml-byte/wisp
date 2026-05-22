import { useEffect, useState } from 'react';
import { getDevices, createDevice, updateDevice, deleteDevice } from '../api';
import { PageHeader, Button, Table, TR, TD, Modal, Input, Card } from '../components/UI';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', ip_address: '', username: '', password: '', description: '', is_active: true };

// DEFENSIVO: Verificar estado inicial
const SAFE_PAGINATION = { total: 0, total_pages: 1, current_page: 1, has_next: false, has_prev: false };

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(SAFE_PAGINATION);
  const [showPassword, setShowPassword] = useState(false);

  const load = (pageNum = 1) => {
    setLoading(true);
    console.log('[Devices] START: Loading page', pageNum);
    
    getDevices({ page: pageNum, per_page: 10 })
      .then(r => {
        console.log('[Devices] SUCCESS: Got response');
        
        try {
          // Triple-check response
          if (!r || !r.data) {
            console.error('[Devices] FAIL: No response data');
            throw new Error('No data');
          }
          
          const data = r.data;
          const devicesArray = Array.isArray(data.devices) ? data.devices : [];
          const pagination = {
            total: typeof data.total === 'number' ? data.total : 0,
            total_pages: typeof data.total_pages === 'number' ? data.total_pages : 1,
            current_page: typeof data.current_page === 'number' ? data.current_page : pageNum,
            has_next: data.has_next === true,
            has_prev: data.has_prev === true
          };
          
          console.log('[Devices] EXTRACTED:', {
            devices_count: devicesArray.length,
            pagination
          });
          
          // Update state
          setDevices(devicesArray);
          setPagination(pagination);
          setPage(pageNum);
        } catch (parseErr) {
          console.error('[Devices] PARSE ERROR:', parseErr);
          setDevices([]);
          setPagination(SAFE_PAGINATION);
        }
      })
      .catch(err => {
        console.error('[Devices] API ERROR:', err);
        setDevices([]);
        setPagination(SAFE_PAGINATION);
      })
      .finally(() => {
        console.log('[Devices] DONE: Setting loading=false');
        setLoading(false);
      });
  };

  useEffect(() => {
    console.log('[Devices] MOUNT: useEffect running');
    load();
  }, []);

  const openCreate = () => { 
    setForm(EMPTY_FORM); 
    setSelected(null);
    setShowPassword(false);
    setModal('create'); 
  };

  const openEdit = (d) => { 
    setSelected(d);
    setForm({ 
      name: d?.name || '', 
      ip_address: d?.ip_address || '', 
      username: d?.username || '', 
      password: d?.password || '',
      description: d?.description || '', 
      is_active: d?.is_active ?? true 
    });
    setShowPassword(false);
    setModal('edit'); 
  };

  const handleSave = async () => {
    if (!form.name?.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if (!form.ip_address?.trim()) {
      toast.error('La IP es obligatoria');
      return;
    }
    if (!form.username?.trim()) {
      toast.error('El usuario es obligatorio');
      return;
    }
    if (!form.password?.trim()) {
      toast.error('La contraseña es obligatoria');
      return;
    }

    setSaving(true);
    try {
      if (modal === 'create') {
        await createDevice(form);
        toast.success('Dispositivo creado');
      } else {
        await updateDevice(selected.id, form);
        toast.success('Dispositivo actualizado');
      }
      setModal(null);
      setTimeout(() => load(1), 100);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al guardar');
    } finally { 
      setSaving(false); 
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar dispositivo?')) return;
    try { 
      await deleteDevice(id); 
      toast.success('Dispositivo eliminado'); 
      setTimeout(() => load(page || 1), 100);
    } catch (e) { 
      toast.error(e.response?.data?.detail || 'Error'); 
    }
  };

  // Safe values
  const safeDevices = Array.isArray(devices) ? devices : [];
  const safePagination = pagination || SAFE_PAGINATION;
  const safePage = typeof page === 'number' ? page : 1;
  const safeTotalPages = typeof safePagination.total_pages === 'number' ? safePagination.total_pages : 1;

  return (
    <div className="space-y-6">
      <PageHeader title="Dispositivos / Sectoriales" />

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Total: <strong>{typeof safePagination.total === 'number' ? safePagination.total : 0}</strong> dispositivos
        </div>
        <Button variant="primary" onClick={openCreate}>+ Nuevo Dispositivo</Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Cargando...</div>
      ) : safeDevices.length === 0 ? (
        <Card className="text-center py-8 text-gray-500">
          No hay dispositivos configurados
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <Table>
            <thead className="bg-gray-50">
              <TR>
                <TD className="font-semibold">Nombre</TD>
                <TD className="font-semibold">IP</TD>
                <TD className="font-semibold">Usuario</TD>
                <TD className="font-semibold">Estado</TD>
                <TD className="font-semibold">Acciones</TD>
              </TR>
            </thead>
            <tbody>
              {safeDevices.map(d => (
                <TR key={d?.id || Math.random()} className="hover:bg-gray-50">
                  <TD>{d?.name || '-'}</TD>
                  <TD className="font-mono text-sm">{d?.ip_address || '-'}</TD>
                  <TD>{d?.username || '-'}</TD>
                  <TD>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      d?.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {d?.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </TD>
                  <TD className="space-x-2">
                    <button 
                      onClick={() => openEdit(d)}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => d?.id && handleDelete(d.id)}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Eliminar
                    </button>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Paginación */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">
          Página {safePage} de {safeTotalPages}
        </span>
        <div className="space-x-2">
          <Button 
            variant="secondary" 
            onClick={() => load(safePage - 1)}
            disabled={safePagination.has_prev !== true}
          >
            ← Anterior
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => load(safePage + 1)}
            disabled={safePagination.has_next !== true}
          >
            Siguiente →
          </Button>
        </div>
      </div>

      {/* Modal */}
      {modal ? (
        <Modal 
          open={true}
          title={modal === 'create' ? 'Nuevo Dispositivo' : 'Editar Dispositivo'}
          onClose={() => setModal(null)}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Dispositivo
              </label>
              <Input
                placeholder="Ej: Sectorial 1"
                value={form.name || ''}
                onChange={(e) => setForm({...form, name: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección IP
              </label>
              <Input
                placeholder="Ej: 10.10.10.1"
                value={form.ip_address || ''}
                onChange={(e) => setForm({...form, ip_address: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuario
              </label>
              <Input
                placeholder="Ej: admin"
                value={form.username || ''}
                onChange={(e) => setForm({...form, username: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="flex gap-2">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password || ''}
                  onChange={(e) => setForm({...form, password: e.target.value})}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción (opcional)
              </label>
              <textarea
                placeholder="Ej: Router principal sector norte"
                value={form.description || ''}
                onChange={(e) => setForm({...form, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active === true}
                  onChange={(e) => setForm({...form, is_active: e.target.checked})}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">
                  Dispositivo activo
                </span>
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="secondary" onClick={() => setModal(null)}>
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
