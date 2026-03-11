import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

interface Template {
    id: number;
    name: string;
    type: 'measurement' | 'formula';
    fields: any[]; // [string, string, ...] or [{name: string, zone: string}, ...]
}

const Templates = () => {
    const { token } = useAuth();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState<'measurement' | 'formula'>('measurement');

    // Using objects for fields if measurement (requires zone)
    const [fields, setFields] = useState<any[]>([{ name: '', zone: 'todas' }]);
    const [zones, setZones] = useState<{ value: string; label: string }[]>([]);

    useEffect(() => {
        fetchTemplates();
        fetchZones();
    }, []);

    const fetchZones = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/zones`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setZones([{ value: 'todas', label: 'Todas las Zonas' }, ...res.data]);
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

    const handleTypeChange = (newType: 'measurement' | 'formula') => {
        setType(newType);
        if (newType === 'formula') {
            setFields(['']);
        } else {
            setFields([{ name: '', zone: 'todas' }]);
        }
    };

    const handleAddField = () => {
        if (type === 'formula') {
            setFields([...fields, '']);
        } else {
            setFields([...fields, { name: '', zone: 'todas' }]);
        }
    };

    const handleFieldChange = (index: number, key: 'name' | 'zone', value: string) => {
        const newFields = [...fields];
        if (type === 'measurement') {
            newFields[index][key] = value;
        } else {
            newFields[index] = value;
        }
        setFields(newFields);
    };

    const handleRemoveField = (index: number) => {
        const newFields = fields.filter((_, i) => i !== index);
        setFields(newFields);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Filter empty fields
        const validFields = fields.filter(f => {
            if (typeof f === 'string') return f.trim() !== '';
            return f.name.trim() !== '';
        });
        if (!name || validFields.length === 0) return;

        try {
            await axios.post(`${API_BASE_URL}/templates`, {
                name,
                type,
                fields: validFields
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchTemplates();
            setIsCreating(false);
            setName('');
            setFields([{ name: '', zone: 'todas' }]);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar esta plantilla?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/templates/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchTemplates();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Configuración de Plantillas</h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                >
                    <Plus size={20} className="mr-2" />
                    Nueva Plantilla
                </button>
            </div>

            {isCreating && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Crear Nueva Plantilla</h3>
                        <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-gray-700">
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Plantilla</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Ej: Antropometría Básica"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                <select
                                    value={type}
                                    onChange={(e) => handleTypeChange(e.target.value as any)}
                                    className="w-full border rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="measurement">Mediciones</option>
                                    <option value="formula">Fórmulas</option>
                                </select>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Campos (Variables a registrar)</label>
                            {fields.map((field, index) => (
                                <div key={index} className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={typeof field === 'string' ? field : field.name}
                                        onChange={(e) => {
                                            if (type === 'formula') {
                                                const newFields = [...fields];
                                                newFields[index] = e.target.value;
                                                setFields(newFields);
                                            } else {
                                                handleFieldChange(index, 'name', e.target.value);
                                            }
                                        }}
                                        className="flex-1 border rounded-md px-3 py-2"
                                        placeholder={`Campo ${index + 1}`}
                                        required
                                    />
                                    {type === 'measurement' && (
                                        <select
                                            value={typeof field === 'string' ? 'todas' : field.zone}
                                            onChange={(e) => handleFieldChange(index, 'zone', e.target.value)}
                                            className="border rounded-md px-3 py-2 w-48"
                                            required
                                        >
                                            {zones.map(zone => (
                                                <option key={zone.value} value={zone.value}>{zone.label}</option>
                                            ))}
                                        </select>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveField(index)}
                                        className="text-red-500 hover:text-red-700 px-2"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={handleAddField}
                                className="text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center mt-2"
                            >
                                <Plus size={16} className="mr-1" /> Añadir Campo
                            </button>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="bg-secondary-600 text-white px-4 py-2 rounded-lg hover:bg-secondary-700 flex items-center"
                            >
                                <Save size={18} className="mr-2" />
                                Guardar Plantilla
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(template => (
                    <div key={template.id} className="bg-white p-6 rounded-lg shadow border-l-4 border-primary-500 relative group">
                        <button
                            onClick={() => handleDelete(template.id)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={18} />
                        </button>
                        <div className="flex items-center mb-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider mr-2 ${
                                template.type === 'measurement' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                                {template.type === 'measurement' ? 'Medición' : 'Fórmula'}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">{template.name}</h3>
                        <div className="text-sm text-gray-600">
                            <p className="font-medium mb-1">Campos:</p>
                            <ul className="list-disc list-inside">
                                {template.fields.slice(0, 5).map((field: any, i) => (
                                    <li key={i}>
                                        {typeof field === 'string' ? field : field.name}
                                        {typeof field !== 'string' && field.zone && field.zone !== 'todas' && (
                                            <span className="text-xs text-gray-400 ml-1">({field.zone})</span>
                                        )}
                                    </li>
                                ))}
                                {template.fields.length > 5 && <li>... (+{template.fields.length - 5})</li>}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Templates;
