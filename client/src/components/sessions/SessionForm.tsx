import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, FileText, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import ZoneMeasurements from './ZoneMeasurements';

interface Patient {
    id: number;
    name: string;
    dni: string;
}

interface Template {
    id: number;
    name: string;
    type: 'measurement' | 'formula';
    fields: any[]; // can be string[] or {name: string, zone: string}[]
}

const SessionForm = () => {
    const { token } = useAuth();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);

    // Autocomplete states
    const [patientQuery, setPatientQuery] = useState('');
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);

    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [notes, setNotes] = useState('');
    const [type, setType] = useState<'measurement' | 'formula'>('measurement');
    const [fields, setFields] = useState<string[]>([]);
    const [data, setData] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchPatients();
        fetchTemplates();
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

    const fetchTemplates = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/templates`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTemplates(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplate(templateId);
        if (templateId) {
            const template = templates.find(t => t.id === parseInt(templateId));
            if (template) {
                setType(template.type);
                if (template.type === 'measurement') {
                    // Mapping logic for ZoneMeasurements
                    const zoneMapping: Record<string, any[]> = {
                        torso: [],
                        piernas: [],
                        brazos: [],
                        cabeza: [],
                        cuello: [],
                        todas: []
                    };

                    template.fields.forEach(field => {
                        if (typeof field === 'string') {
                            zoneMapping['todas'].push({ name: field, value: '' });
                        } else {
                            if (!zoneMapping[field.zone]) zoneMapping[field.zone] = [];
                            zoneMapping[field.zone].push({ name: field.name, value: '' });
                        }
                    });

                    localStorage.setItem('zoneMeasurements', JSON.stringify(zoneMapping));
                    window.dispatchEvent(new Event('zone_config_updated'));
                    setFields([]);
                    setData({});
                } else {
                    // Normal fields parsing
                    const fieldNames = template.fields.map(f => typeof f === 'string' ? f : f.name);
                    setFields(fieldNames);
                    const initialData: Record<string, string> = {};
                    fieldNames.forEach((field: string) => initialData[field] = '');
                    setData(initialData);
                }
            }
        } else {
            setFields([]);
            setData({});
            localStorage.removeItem('zoneMeasurements');
            window.dispatchEvent(new Event('zone_config_updated'));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let sessionData = data;

        if (type === 'measurement') {
            const storedMeasurements = localStorage.getItem('zoneMeasurements');
            if (storedMeasurements) {
                sessionData = JSON.parse(storedMeasurements);
            }
        }

        try {
            await axios.post(`${API_BASE_URL}/sessions`, {
                patient_id: selectedPatientId,
                notes,
                type,
                data: sessionData
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Reset form
            setSelectedPatientId('');
            setPatientQuery('');
            setSelectedTemplate('');
            setNotes('');
            setFields([]);
            setData({});
            localStorage.removeItem('zoneMeasurements');
            window.dispatchEvent(new Event('zone_config_updated'));
            alert('Sesión guardada correctamente');
        } catch (err) {
            console.error(err);
            alert('Error al guardar la sesión');
        }
    };

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(patientQuery.toLowerCase()) ||
        p.dni.toLowerCase().includes(patientQuery.toLowerCase())
    );

    const handlePatientSelect = (patient: Patient) => {
        setSelectedPatientId(patient.id.toString());
        setPatientQuery(patient.name);
        setIsAutocompleteOpen(false);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Paciente</label>
                    <input
                        type="text"
                        value={patientQuery}
                        onChange={(e) => {
                            setPatientQuery(e.target.value);
                            setIsAutocompleteOpen(true);
                            if (!e.target.value) {
                                setSelectedPatientId('');
                            }
                        }}
                        onFocus={() => setIsAutocompleteOpen(true)}
                        onBlur={() => {
                            // Delay hiding so clicks register
                            setTimeout(() => setIsAutocompleteOpen(false), 200);
                        }}
                        placeholder="Buscar paciente por nombre o DNI"
                        className="w-full border rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                    />
                    {isAutocompleteOpen && patientQuery && (
                        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                            {filteredPatients.length > 0 ? (
                                filteredPatients.map(p => (
                                    <li
                                        key={p.id}
                                        onClick={() => handlePatientSelect(p)}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                    >
                                        <span className="font-medium">{p.name}</span> <span className="text-gray-500 text-sm">({p.dni})</span>
                                    </li>
                                ))
                            ) : (
                                <li className="px-4 py-2 text-gray-500">No se encontraron pacientes</li>
                            )}
                        </ul>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cargar Plantilla</label>
                    <select
                        value={selectedTemplate}
                        onChange={(e) => handleTemplateChange(e.target.value)}
                        className="w-full border rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="">Seleccionar plantilla (opcional)</option>
                        {templates.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.type === 'measurement' ? 'Medición' : 'Fórmula'})</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Sesión</label>
                <div className="flex space-x-4">
                    <label className="flex items-center">
                        <input
                            type="radio"
                            value="measurement"
                            checked={type === 'measurement'}
                            onChange={() => {
                                setType('measurement');
                                setFields([]);
                            }}
                            className="text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 flex items-center text-gray-700">
                            <Activity size={18} className="mr-1" /> Mediciones
                        </span>
                    </label>
                    <label className="flex items-center">
                        <input
                            type="radio"
                            value="formula"
                            checked={type === 'formula'}
                            onChange={() => {
                                setType('formula');
                                setFields([]);
                            }}
                            className="text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 flex items-center text-gray-700">
                            <FileText size={18} className="mr-1" /> Fórmulas
                        </span>
                    </label>
                </div>
            </div>

            {type === 'measurement' ? (
                <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">Registro de Mediciones por Zonas</h3>
                    <ZoneMeasurements />
                </div>
            ) : (
                <div className="mb-6 space-y-4">
                    <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Variables Personalizadas</h3>
                    {fields.map((field, index) => (
                        <div key={index} className="flex gap-4">
                            <input
                                type="text"
                                value={field}
                                disabled
                                className="w-1/3 border rounded-md px-3 py-2 bg-gray-50"
                            />
                            <input
                                type="text"
                                value={data[field] || ''}
                                onChange={(e) => setData({ ...data, [field]: e.target.value })}
                                className="flex-1 border rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Valor"
                                required
                            />
                        </div>
                    ))}
                    {fields.length === 0 && (
                        <p className="text-gray-500 text-sm italic">Selecciona una plantilla para cargar los campos.</p>
                    )}
                </div>
            )}

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notas Adicionales</label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500 h-24"
                    placeholder="Observaciones de la sesión..."
                />
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 flex items-center shadow-sm"
                    disabled={!selectedPatientId}
                >
                    <Save size={20} className="mr-2" />
                    Guardar Sesión
                </button>
            </div>
        </form>
    );
};

export default SessionForm;
