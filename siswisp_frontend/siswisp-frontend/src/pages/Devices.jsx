import { useEffect, useState } from 'react';
import { getDevices, createDevice, updateDevice, deleteDevice } from '../api';
import { PageHeader, Button, Table, TR, TD, Modal, Input, Card } from '../components/UI';
import toast from 'react-hot-toast';

export default function Devices() {
  // Estado principal - SIMPLE
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  
  // Modal y formulario - SIMPLE
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '',
    ip_address: '',
    username: '',
    password: '',
    description: '',
    is_active: true,
  });

  // Cargar dispositivos
  const loadDevices = (pageNum = 1) => {
    console.log('[Devices] LOAD START:', pageNum);
    setLoading(true);
    
    getDevices({ page: pageNum, per_page: 10 })
      .then((response) => {
        console.log('[Devices] RESPONSE:', response.data);
        const data = response.data;
        
        if (data?.devices && Array.isArray(data.devices)) {
          console.log('[Devices] FOUND', data.devices.length, 'devices');
          setDevices(data.devices);
          setTotal(data.total || 0);
          setTotalPages(data.total_pages || 1);
          setHasNext(data.has_next || false);
          setHasPrev(data.has_prev || false);
          setPage(pageNum);
        } else {
          console.error('[Devices] INVALID RESPONSE:', data);
          setDevices([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('[Devices] ERROR:', err);
        setDevices([]);
        setLoading(false);
        toast.error('Error al cargar dispositivos');
      });
  };

  useEffect(() => {
    loadDevices(1);
  }, []);

  // Abrir modal crear
  const openCreateModal = () => {
    setForm({
      name: '',
      ip_address: '',
      username: '',
      password: '',
      description: '',
      is_active: true,
    });
    setSelectedId(null);
    setModalMode('create');
    setShowPassword(false);
    setModalOpen(true);
  };

  // Abrir modal editar
  const openEditModal = (device) => {
    setForm(device);
    setSelectedId(device.id);
    setModalMode('edit');
    setShowPassword(false);
    setModalOpen(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setModalOpen(false);
  };

  // Guardar dispositivo
  const saveDevice = async () => {
    if (!form.name?.trim()) {
      toast.error('Nombre requerido');
      return;
    }
    if (!form.ip_address?.trim()) {
      toast.error('IP requerida');
      return;
    }
    if (!form.username?.trim()) {
      toast.error('Usuario requerido');
      return;
    }
    if (!form.password?.trim()) {
      toast.error('Contraseña requerida');
      return;
    }

    setSaving(true);
    try {
      if (modalMode === 'create') {
        await createDevice(form);
        toast.success('Dispositivo creado');
      } else {
        await updateDevice(selectedId, form);
        toast.success('Dispositivo actualizado');
      }
      
      setModalOpen(false);
      setForm({
        name: '',
        ip_address: '',
        username: '',
        password: '',
        description: '',
        is_active: true,
      });
      
      // Recargar
      setTimeout(() => loadDevices(1), 300);
      
    } catch (err) {
      console.error('[Devices] SAVE ERROR:', err);
      toast.error(err.response?.data?.detail || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // Eliminar dispositivo
  const removeDevice = async (id) => {
    if (!confirm('¿Eliminar dispositivo?')) return;
    try {
      await deleteDevice(id);
      toast.success('Dispositivo eliminado');
      loadDevices(page);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al eliminar');
    }
  };

  // Cambiar página
  const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      loadDevices(newPage);
    }
  };

  // Render - Logging de estado
  console.log('[Devices] RENDER: Current state:', {
    loading,
    devicesCount: Array.isArray(devices) ? devices.length : 'NOT_AN_ARRAY',
    totalPages,
    page,
    devicesArray: devices
  });

  // RENDER - SUPER SIMPLE
  return (
    <div className="space-y-6">
      <PageHeader title="Dispositivos / Sectoriales" />

      {/* Header con botón crear */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Total: <strong>{total}</strong> dispositivos
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          + Nuevo Dispositivo
        </Button>
      </div>

      {/* Estado: Cargando */}
      {loading && (
        <div className="text-center py-8 text-gray-500">
          Cargando dispositivos...
        </div>
      )}

      {/* Estado: Sin dispositivos */}
      {!loading && (!devices || devices.length === 0) && (
        <Card className="text-center py-8 text-gray-500">
          No hay dispositivos configurados
        </Card>
      )}

      {/* Estado: Mostrar tabla */}
      {!loading && devices && Array.isArray(devices) && devices.length > 0 && (
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
              {devices.map((device, idx) => (
                <TR key={`device-${device.id}-${idx}`} className="hover:bg-gray-50">
                  <TD>{device.name}</TD>
                  <TD className="font-mono text-sm">{device.ip_address}</TD>
                  <TD>{device.username}</TD>
                  <TD>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      device.is_active
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {device.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </TD>
                  <TD className="space-x-2">
                    <button 
                      onClick={() => openEditModal(device)}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => removeDevice(device.id)}
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
      {!loading && totalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>
          <div className="space-x-2">
            <Button 
              variant="secondary" 
              onClick={() => goToPage(page - 1)}
              disabled={!hasPrev}
            >
              ← Anterior
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => goToPage(page + 1)}
              disabled={!hasNext}
            >
              Siguiente →
            </Button>
          </div>
        </div>
      )}

      {/* Modal - SUPER SIMPLE */}
      {modalOpen && (
        <Modal 
          open={true}
          title={modalMode === 'create' ? 'Nuevo Dispositivo' : 'Editar Dispositivo'}
          onClose={closeModal}
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
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña"
                  value={form.password || ''}
                  onChange={(e) => setForm({...form, password: e.target.value})}
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded"
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
              <Button variant="secondary" onClick={closeModal}>
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                onClick={saveDevice}
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
