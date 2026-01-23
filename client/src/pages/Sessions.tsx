import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, FileText, Activity, RefreshCw, Eye } from 'lucide-react';
import type { Session, Patient } from '../types';
import SessionForm from '../components/SessionForm';
import SessionDetailsModal from '../components/SessionDetailsModal';
import { syncOfflineSessions } from '../services/dataService';

const Sessions: React.FC = () => {
    const { token } = useAuth();
    const [sessions, setSessions] = useState<(Session & { patient_name?: string })[]>([]);
    const [patients, setPatients] = useState<Record<number, string>>({});
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<(Session & { patient_name?: string }) | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchSessions();
        fetchPatients();
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await axios.get('http://localhost:3001/api/sessions', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSessions(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchPatients = async () => {
        try {
            const res = await axios.get('http://localhost:3001/api/patients', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const patientMap: Record<number, string> = {};
            res.data.forEach((p: Patient) => {
                patientMap[p.id] = p.name;
            });
            setPatients(patientMap);
        } catch (err) {
            console.error(err);
        }
    };

    const enrichedSessions = sessions.map(s => ({
        ...s,
        patient_name: patients[s.patient_id] || 'Desconocido'
    }));

    const filteredSessions = enrichedSessions.filter(s =>
        s.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.date.includes(searchTerm)
    );

    const handleSync = async () => {
        if (!token) return;
        await syncOfflineSessions(token);
        fetchSessions();
        alert('Sincronización completada (si había datos pendientes).');
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Sesiones</h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleSync}
                        className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                        title="Sincronizar datos offline"
                    >
                        <RefreshCw size={20} className="mr-2" />
                        Sincronizar
                    </button>
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                    >
                        <Plus size={20} className="mr-2" />
                        Nueva Sesión
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por paciente o fecha..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lugar</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datos</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredSessions.map(session => (
                            <tr key={session.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{session.patient_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{session.type}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{session.place}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{session.price}€</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        session.attended ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {session.attended ? 'Asistió' : 'No asistió'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                     <div className="flex space-x-4 items-center">
                                        <div className="flex space-x-2 mr-4">
                                            <span className="flex items-center" title="Mediciones">
                                                <Activity size={14} className="mr-1 text-blue-500" />
                                                {Object.keys(session.clinical_data || {}).length}
                                            </span>
                                            <span className="flex items-center" title="Fórmulas">
                                                <FileText size={14} className="mr-1 text-green-500" />
                                                {Object.keys(session.formula_data || {}).length}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setSelectedSession(session)}
                                            className="text-primary-600 hover:text-primary-800 transition-colors"
                                            title="Ver Detalles"
                                        >
                                            <Eye size={18} />
                                        </button>
                                     </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isFormOpen && (
                <SessionForm
                    onClose={() => setIsFormOpen(false)}
                    onSave={() => {
                        setIsFormOpen(false);
                        fetchSessions();
                    }}
                />
            )}

            {selectedSession && (
                <SessionDetailsModal
                    session={selectedSession}
                    onClose={() => setSelectedSession(null)}
                />
            )}
        </div>
    );
};

export default Sessions;
