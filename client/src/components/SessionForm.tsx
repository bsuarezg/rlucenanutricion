import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { X, FileText, Activity, Calculator } from 'lucide-react';
import type { Patient, Template } from '../types';
import { saveSession } from '../services/dataService';
import { calculateFormulas } from '../services/formulaService';
import { API_BASE_URL } from '../config';

interface SessionFormProps {
    onClose: () => void;
    onSave: () => void;
}

const SessionForm: React.FC<SessionFormProps> = ({ onClose, onSave }) => {
    const { token } = useAuth();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);

    // Form State
    const [patientId, setPatientId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [place, setPlace] = useState('');
    const [type, setType] = useState('Consulta');
    const [price, setPrice] = useState(0);
    const [attended, setAttended] = useState(true);

    // Dynamic Data
    const [clinicalData, setClinicalData] = useState<Record<string, string | number>>({});
    const [formulaData, setFormulaData] = useState<Record<string, string | number>>({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [patientsRes, templatesRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/patients`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_BASE_URL}/templates`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setPatients(patientsRes.data);
                setTemplates(templatesRes.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, [token]);

    const handleApplyTemplate = (templateId: string) => {
        const template = templates.find(t => t.id === parseInt(templateId));
        if (!template) return;

        const targetState = template.type === 'measurement' ? clinicalData : formulaData;
        const setTargetState = template.type === 'measurement' ? setClinicalData : setFormulaData;

        const newData = { ...targetState };
        template.fields.forEach(field => {
            if (!(field in newData)) {
                newData[field] = '';
            }
        });
        setTargetState(newData);
    };

    const handleDataChange = (
        key: string,
        value: string,
        isClinical: boolean
    ) => {
        const setFn = isClinical ? setClinicalData : setFormulaData;
        setFn(prev => ({ ...prev, [key]: value }));
    };

    const handleAddCustomField = (isClinical: boolean) => {
        const name = prompt('Nombre del nuevo campo:');
        if (name) {
            handleDataChange(name, '', isClinical);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        const sessionData = {
            patient_id: patientId,
            date,
            place,
            type,
            price,
            attended,
            clinical_data: clinicalData,
            formula_data: formulaData
        };

        const result = await saveSession(sessionData, token);

        if (result.success) {
            if (result.mode === 'offline') {
                alert('Conexión fallida. La sesión se ha guardado localmente y se ha descargado un XML de respaldo.');
            } else {
                alert('Sesión guardada correctamente (y XML generado por seguridad).');
            }
            onSave();
        } else {
            alert('Error crítico al guardar la sesión.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
                    <h3 className="text-xl font-bold text-gray-800">Nueva Sesión</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    {/* General Info */}
                    <section>
                        <h4 className="text-lg font-semibold mb-4 text-primary-700 border-b pb-2">Datos Generales</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
                                <select
                                    required
                                    value={patientId}
                                    onChange={(e) => setPatientId(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2"
                                >
                                    <option value="">Seleccionar Paciente</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} - {p.dni}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                                <input
                                    type="date"
                                    required
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lugar</label>
                                <input
                                    type="text"
                                    value={place}
                                    onChange={(e) => setPlace(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Sesión</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2"
                                >
                                    <option>Consulta</option>
                                    <option>Revisión</option>
                                    <option>Primera Visita</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Precio (€)</label>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(parseFloat(e.target.value))}
                                    className="w-full border rounded-md px-3 py-2"
                                />
                            </div>
                            <div className="flex items-center mt-6">
                                <input
                                    type="checkbox"
                                    checked={attended}
                                    onChange={(e) => setAttended(e.target.checked)}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-900">Asistió</label>
                            </div>
                        </div>
                    </section>

                    {/* Clinical Data */}
                    <section>
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h4 className="text-lg font-semibold text-primary-700 flex items-center">
                                <Activity size={20} className="mr-2" />
                                Datos Clínicos / Mediciones
                            </h4>
                            <div className="flex gap-2">
                                <select
                                    className="text-sm border rounded px-2 py-1"
                                    onChange={(e) => {
                                        if (e.target.value) handleApplyTemplate(e.target.value);
                                        e.target.value = "";
                                    }}
                                >
                                    <option value="">Cargar Plantilla...</option>
                                    {templates.filter(t => t.type === 'measurement').map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => handleAddCustomField(true)}
                                    className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                                >
                                    + Campo
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {Object.entries(clinicalData).map(([key, value]) => (
                                <div key={key}>
                                    <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">{key}</label>
                                    <input
                                        type="text"
                                        value={value}
                                        onChange={(e) => handleDataChange(key, e.target.value, true)}
                                        className="w-full border rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-primary-500"
                                    />
                                </div>
                            ))}
                            {Object.keys(clinicalData).length === 0 && (
                                <p className="text-gray-400 text-sm col-span-full italic">No hay mediciones registradas. Carga una plantilla o añade campos.</p>
                            )}
                        </div>
                    </section>

                    {/* Formula Data */}
                    <section>
                         <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h4 className="text-lg font-semibold text-primary-700 flex items-center">
                                <FileText size={20} className="mr-2" />
                                Fórmulas
                            </h4>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const calculated = calculateFormulas(clinicalData);
                                        setFormulaData(prev => ({ ...prev, ...calculated }));
                                        alert('Fórmulas calculadas basadas en las mediciones disponibles.');
                                    }}
                                    className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded flex items-center"
                                >
                                    <Calculator size={14} className="mr-1" />
                                    Calcular Auto
                                </button>
                                <select
                                    className="text-sm border rounded px-2 py-1"
                                    onChange={(e) => {
                                        if (e.target.value) handleApplyTemplate(e.target.value);
                                        e.target.value = "";
                                    }}
                                >
                                    <option value="">Cargar Plantilla...</option>
                                    {templates.filter(t => t.type === 'formula').map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => handleAddCustomField(false)}
                                    className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                                >
                                    + Campo
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {Object.entries(formulaData).map(([key, value]) => (
                                <div key={key}>
                                    <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">{key}</label>
                                    <input
                                        type="text"
                                        value={value}
                                        onChange={(e) => handleDataChange(key, e.target.value, false)}
                                        className="w-full border rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-primary-500"
                                    />
                                </div>
                            ))}
                             {Object.keys(formulaData).length === 0 && (
                                <p className="text-gray-400 text-sm col-span-full italic">No hay fórmulas registradas.</p>
                            )}
                        </div>
                    </section>

                    <div className="flex justify-end pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="mr-4 px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 font-bold"
                        >
                            Guardar Sesión
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SessionForm;
