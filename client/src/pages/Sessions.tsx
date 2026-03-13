import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Search, Calendar, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import SessionForm from '../components/sessions/SessionForm';

interface Session {
    id: number;
    patient_id: number;
    patient_name: string;
    date: string;
    notes: string;
    type: string;
    data?: any;
    measurements?: any[];
    formulas_results?: any[];
}

const Sessions = () => {
    const { token } = useAuth();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/sessions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSessions(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const filteredSessions = sessions.filter(session =>
        session.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Registro de Sesiones</h2>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className={`flex items-center px-4 py-2 rounded-lg ${isCreating ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-primary-600 text-white hover:bg-primary-700'}`}
                >
                    {!isCreating && <Plus size={20} className="mr-2" />}
                    {isCreating ? 'Cancelar' : 'Nueva Sesión'}
                </button>
            </div>

            {isCreating && (
                <div className="mb-8">
                    <SessionForm />
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar en las sesiones..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="divide-y divide-gray-200">
                    {filteredSessions.map(session => (
                        <div key={session.id} className="p-4 hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center mb-1">
                                        <User size={16} className="text-gray-400 mr-2" />
                                        <h3 className="font-semibold text-gray-800">{session.patient_name}</h3>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500 mb-2">
                                        <Calendar size={14} className="mr-1" />
                                        {new Date(session.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        <span className={`ml-3 px-2 py-0.5 rounded-full text-xs font-medium ${
                                            session.type === 'measurement' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                            {session.type === 'measurement' ? 'Mediciones' : 'Fórmula'}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 text-sm">{session.notes}</p>
                                </div>
                                <button
                                    onClick={() => setExpandedSessionId(expandedSessionId === session.id ? null : session.id)}
                                    className="text-primary-600 hover:text-primary-800 text-sm font-medium focus:outline-none"
                                >
                                    {expandedSessionId === session.id ? 'Ocultar Detalles' : 'Ver Detalles'}
                                </button>
                            </div>

                            {expandedSessionId === session.id && (
                                <div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50 rounded-lg p-4">
                                    {session.type === 'measurement' && session.measurements && session.measurements.length > 0 && (
                                        <div className="mb-4">
                                            <h4 className="font-semibold text-gray-700 text-sm mb-2">Mediciones de Plantilla</h4>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full text-sm divide-y divide-gray-200">
                                                    <thead>
                                                        <tr>
                                                            <th className="px-2 py-1 text-left font-medium text-gray-500">Medición</th>
                                                            <th className="px-2 py-1 text-center font-medium text-gray-500">M1</th>
                                                            <th className="px-2 py-1 text-center font-medium text-gray-500">M2</th>
                                                            <th className="px-2 py-1 text-center font-medium text-gray-500">M3</th>
                                                            <th className="px-2 py-1 text-center font-medium text-gray-500">Mediana</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {session.measurements.map((m: any, idx: number) => (
                                                            <tr key={idx} className="bg-white">
                                                                <td className="px-2 py-1 font-medium">{m.measurement_type}</td>
                                                                <td className="px-2 py-1 text-center text-gray-600">{m.value1 || '-'}</td>
                                                                <td className="px-2 py-1 text-center text-gray-600">{m.value2 || '-'}</td>
                                                                <td className="px-2 py-1 text-center text-gray-600">{m.value3 || '-'}</td>
                                                                <td className="px-2 py-1 text-center font-bold text-indigo-600">{m.final_value || '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {session.formulas_results && session.formulas_results.length > 0 && (
                                        <div className="mb-4">
                                            <h4 className="font-semibold text-gray-700 text-sm mb-2">Resultados de Fórmulas</h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {session.formulas_results.map((f: any, idx: number) => (
                                                    <div key={idx} className="bg-white p-2 rounded border border-gray-200 shadow-sm flex flex-col justify-center items-center">
                                                        <span className="text-xs text-gray-500 text-center">{f.formula_name}</span>
                                                        <span className="font-bold text-lg text-primary-700">{f.result_value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {(!session.measurements || session.measurements.length === 0) && (!session.formulas_results || session.formulas_results.length === 0) && (
                                        <div className="text-sm text-gray-500 italic">No hay datos estructurados adicionales guardados en esta sesión.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    {filteredSessions.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            No se encontraron sesiones.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sessions;
