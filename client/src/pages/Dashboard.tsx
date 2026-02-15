import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Users, FileText, Activity, TrendingUp } from 'lucide-react';

const Dashboard: React.FC = () => {
    const { token, user } = useAuth();
    const [stats, setStats] = useState({
        patients: 0,
        sessions: 0,
        recentSessions: [] as any[]
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [patientsRes, sessionsRes] = await Promise.all([
                    axios.get('http://localhost:3001/api/patients', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://localhost:3001/api/sessions', { headers: { Authorization: `Bearer ${token}` } })
                ]);

                setStats({
                    patients: patientsRes.data.length,
                    sessions: sessionsRes.data.length,
                    recentSessions: sessionsRes.data.slice(0, 5)
                });
            } catch (err) {
                console.error(err);
            }
        };
        fetchStats();
    }, [token]);

    return (
        <div className="space-y-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Hola, {user?.username}</h1>
                <p className="text-gray-600">Bienvenido al panel de gestión de nutrición.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <div className="bg-blue-400 bg-opacity-30 p-3 rounded-lg">
                            <Users size={24} className="text-white" />
                        </div>
                        <span className="text-blue-100 text-sm font-medium">Total</span>
                    </div>
                    <h3 className="text-4xl font-bold mb-1">{stats.patients}</h3>
                    <p className="text-blue-100">Pacientes Registrados</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <div className="bg-green-400 bg-opacity-30 p-3 rounded-lg">
                            <FileText size={24} className="text-white" />
                        </div>
                        <span className="text-green-100 text-sm font-medium">Total</span>
                    </div>
                    <h3 className="text-4xl font-bold mb-1">{stats.sessions}</h3>
                    <p className="text-green-100">Sesiones Realizadas</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <div className="bg-purple-400 bg-opacity-30 p-3 rounded-lg">
                            <Activity size={24} className="text-white" />
                        </div>
                        <span className="text-purple-100 text-sm font-medium">Actividad</span>
                    </div>
                    <h3 className="text-xl font-bold mb-1">Activo</h3>
                    <p className="text-purple-100">Estado del Sistema</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                        <TrendingUp size={20} className="mr-2 text-primary-600" />
                        Actividad Reciente
                    </h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {stats.recentSessions.length > 0 ? (
                        stats.recentSessions.map((session, i) => (
                            <div key={i} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-gray-800">Sesión de {session.type}</p>
                                    <p className="text-sm text-gray-500">{session.date} • {session.place}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    session.attended ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    {session.attended ? 'Asistió' : 'No Asistió'}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            No hay actividad reciente.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
