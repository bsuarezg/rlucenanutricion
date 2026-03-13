import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { Plus as Add, Edit2 as Edit, Trash2 as Delete } from 'lucide-react';

interface ConstantValue {
  id?: number;
  gender: string | null;
  age_min: number | null;
  age_max: number | null;
  value: number;
}

interface ConstantGroup {
  id: number;
  name: string;
  values: ConstantValue[];
}

export default function ConstantsSettings() {
  const [groups, setGroups] = useState<ConstantGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Partial<ConstantGroup> | null>(null);

  useEffect(() => {
    fetchConstants();
  }, []);

  const fetchConstants = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/constants`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching constants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGroup?.id) {
        await axios.put(`${API_BASE_URL}/constants?id=${editingGroup.id}`, editingGroup, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        await axios.post(`${API_BASE_URL}/constants`, editingGroup, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
      fetchConstants();
      setIsModalOpen(false);
      setEditingGroup(null);
    } catch (error) {
      console.error('Error saving constant group:', error);
      alert('Error al guardar la matriz de constantes. Por favor, revisa que los datos sean correctos.');
    }
  };

  const handleDeleteGroup = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta tabla de constantes? Las fórmulas que dependan de ella podrían dejar de funcionar correctamente.')) {
      try {
        await axios.delete(`${API_BASE_URL}/constants?id=${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        fetchConstants();
      } catch (error) {
        console.error('Error deleting constant group:', error);
      }
    }
  };

  const handleAddValue = () => {
    setEditingGroup(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        values: [...(prev.values || []), { gender: null, age_min: null, age_max: null, value: 0 }]
      };
    });
  };

  const handleRemoveValue = (index: number) => {
    setEditingGroup(prev => {
      if (!prev) return prev;
      const newValues = [...(prev.values || [])];
      newValues.splice(index, 1);
      return { ...prev, values: newValues };
    });
  };

  const handleValueChange = (index: number, field: keyof ConstantValue, value: any) => {
    setEditingGroup(prev => {
      if (!prev) return prev;
      const newValues = [...(prev.values || [])];
      newValues[index] = { ...newValues[index], [field]: value };
      return { ...prev, values: newValues };
    });
  };

  if (loading) return <div>Cargando constantes...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Matrices de Constantes</h2>
          <p className="text-sm text-gray-500">Define tablas de valores que dependen de género y rango de edad.</p>
        </div>
        <button
          onClick={() => { setEditingGroup({ name: '', values: [] }); setIsModalOpen(true); }}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Add className="h-5 w-5 mr-2" /> Nueva Tabla
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.map((group) => (
          <div key={group.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
              <div className="flex space-x-2">
                <button onClick={() => { setEditingGroup(group); setIsModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900" title="Editar tabla"><Edit className="h-5 w-5"/></button>
                <button onClick={() => handleDeleteGroup(group.id)} className="text-red-600 hover:text-red-900" title="Eliminar tabla"><Delete className="h-5 w-5"/></button>
              </div>
            </div>

            <table className="min-w-full divide-y divide-gray-200 mt-2 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Género</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edad Min</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edad Max</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {group.values.map((v, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2 whitespace-nowrap">{v.gender || 'Cualquiera'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{v.age_min ?? '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{v.age_max ?? '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-medium text-indigo-600">{v.value}</td>
                  </tr>
                ))}
                {group.values.length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-2 text-center text-gray-500">Sin valores definidos.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-xl w-full max-w-4xl">
            <h3 className="text-lg font-bold mb-4">{editingGroup?.id ? 'Editar Grupo de Constantes' : 'Nuevo Grupo de Constantes'}</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre del Grupo (identificador)</label>
                <input
                  type="text"
                  value={editingGroup?.name || ''}
                  onChange={e => setEditingGroup(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="ej: CONSTANTES_GRASA"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Este nombre se usará en las fórmulas para buscar el valor (ej: CONSTANTES_GRASA_valor_aplicado)</p>
              </div>
            </div>

            <div className="mb-4 flex justify-between items-center">
              <h4 className="text-md font-medium text-gray-900">Valores de la matriz</h4>
              <button type="button" onClick={handleAddValue} className="text-sm text-indigo-600 hover:text-indigo-900">+ Añadir fila</button>
            </div>

            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Género</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edad Min</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edad Max</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-3 relative"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {editingGroup?.values?.map((val, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2">
                        <select
                          value={val.gender || ''}
                          onChange={e => handleValueChange(idx, 'gender', e.target.value || null)}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                          <option value="">Cualquiera</option>
                          <option value="Hombre">Hombre</option>
                          <option value="Mujer">Mujer</option>
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" value={val.age_min ?? ''} onChange={e => handleValueChange(idx, 'age_min', e.target.value ? parseInt(e.target.value) : null)} placeholder="Min" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" value={val.age_max ?? ''} onChange={e => handleValueChange(idx, 'age_max', e.target.value ? parseInt(e.target.value) : null)} placeholder="Max" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" step="any" value={val.value} onChange={e => handleValueChange(idx, 'value', parseFloat(e.target.value))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm font-bold" />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button type="button" onClick={() => handleRemoveValue(idx)} className="text-red-600 hover:text-red-900"><Delete /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded text-gray-700">Cancelar</button>
              <button onClick={handleSaveGroup} className="px-4 py-2 bg-indigo-600 text-white rounded">Guardar Grupo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
