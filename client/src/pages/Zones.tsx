import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

interface Zone {
    id: number;
    value: string;
    label: string;
}

const Zones = () => {
    const { token } = useAuth();
    const [zones, setZones] = useState<Zone[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newZone, setNewZone] = useState({ value: '', label: '' });

    useEffect(() => {
        fetchZones();
    }, []);

    const fetchZones = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/zones`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setZones(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // value is usually lowercase label for IDs
            const value = newZone.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
            await axios.post(`${API_BASE_URL}/zones`, {
                value: value,
                label: newZone.label
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchZones();
            setIsCreating(false);
            setNewZone({ value: '', label: '' });
        } catch (err) {
            console.error(err);
            toast.error('Error al crear la zona. Puede que ya exista una zona con el mismo nombre.');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar esta zona corporal?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/zones/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchZones();
        } catch (err) {
            console.error(err);
            toast.error('Error al eliminar la zona.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Configuración de Zonas Corporales</h2>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                >
                    <Plus size={20} className="mr-2" />
                    {isCreating ? 'Cancelar' : 'Nueva Zona'}
                </button>
            </div>

            {isCreating && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <form onSubmit={handleSubmit} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Zona</label>
                            <input
                                type="text"
                                required
                                value={newZone.label}
                                onChange={(e) => setNewZone({...newZone, label: e.target.value})}
                                placeholder="Ej: Cuello"
                                className="w-full border rounded-md px-3 py-2"
                            />
                        </div>
                        <button type="submit" className="bg-secondary-600 text-white px-4 py-2 rounded-lg hover:bg-secondary-700">
                            Guardar
                        </button>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nombre de la Zona
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Valor Interno
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {zones.map(zone => (
                            <tr key={zone.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                    {zone.label}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-mono text-sm">
                                    {zone.value}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleDelete(zone.id)}
                                        className="text-red-600 hover:text-red-900 ml-4"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {zones.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                                    No hay zonas corporales configuradas.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Zones;
