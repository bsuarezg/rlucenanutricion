import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, User, Mail, Phone, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

interface Patient {
    id: number;
    name: string;
    email: string;
    phone: string;
    dni: string;
    birth_date: string;
    gender: string;
    notes: string;
}

const Patients = () => {
    const { token } = useAuth();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', dni: '', birth_date: '', gender: '', notes: ''
    });

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/patients`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPatients(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE_URL}/patients`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPatients();
            setIsCreating(false);
            setFormData({ name: '', email: '', phone: '', dni: '', birth_date: '', gender: '', notes: '' });
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar este paciente?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/patients/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPatients();
        } catch (err) {
            console.error(err);
        }
    };

    const filteredPatients = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.dni.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Gestión de Pacientes</h2>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                >
                    <Plus size={20} className="mr-2" />
                    {isCreating ? 'Cancelar' : 'Nuevo Paciente'}
                </button>
            </div>

            {isCreating && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="w-full border rounded-md px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">DNI / Pasaporte</label>
                            <input
                                type="text"
                                value={formData.dni}
                                onChange={(e) => setFormData({...formData, dni: e.target.value})}
                                className="w-full border rounded-md px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="w-full border rounded-md px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                className="w-full border rounded-md px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                            <input
                                type="date"
                                value={formData.birth_date}
                                onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                                className="w-full border rounded-md px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                            <select
                                value={formData.gender}
                                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                                className="w-full border rounded-md px-3 py-2"
                            >
                                <option value="">Seleccionar...</option>
                                <option value="M">Masculino</option>
                                <option value="F">Femenino</option>
                                <option value="O">Otro</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                className="w-full border rounded-md px-3 py-2 h-24"
                            />
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                            <button type="submit" className="bg-secondary-600 text-white px-4 py-2 rounded-lg hover:bg-secondary-700">
                                Guardar Paciente
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar paciente por nombre o DNI..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {filteredPatients.map(patient => (
                        <div key={patient.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow relative group">
                            <button
                                onClick={() => handleDelete(patient.id)}
                                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                Eliminar
                            </button>
                            <div className="flex items-center mb-3">
                                <div className="bg-primary-100 p-2 rounded-full text-primary-600 mr-3">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800">{patient.name}</h3>
                                    <p className="text-sm text-gray-500">DNI: {patient.dni}</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                                {patient.email && (
                                    <div className="flex items-center"><Mail size={16} className="mr-2" /> {patient.email}</div>
                                )}
                                {patient.phone && (
                                    <div className="flex items-center"><Phone size={16} className="mr-2" /> {patient.phone}</div>
                                )}
                                {patient.birth_date && (
                                    <div className="flex items-center"><Calendar size={16} className="mr-2" /> {new Date(patient.birth_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                                )}
                            </div>
                        </div>
                    ))}
                    {filteredPatients.length === 0 && (
                        <div className="col-span-full text-center py-8 text-gray-500">
                            No se encontraron pacientes.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Patients;
