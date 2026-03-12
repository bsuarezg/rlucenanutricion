import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export default function GeneralSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.post(`${API_BASE_URL}/settings`, settings, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMessage({ type: 'success', text: 'Configuración guardada correctamente.' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Error al guardar la configuración.' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) return <div>Cargando configuración...</div>;

  return (
    <form onSubmit={handleSave} className="space-y-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Mediciones</h3>
          <p className="mt-1 text-sm text-gray-500">
            Ajustes globales para el sistema de mediciones antropométricas.
          </p>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2 space-y-6">

          <div>
            <label htmlFor="max_deviation_percentage" className="block text-sm font-medium text-gray-700">
              Desviación Máxima Permitida (%)
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="number"
                step="0.01"
                id="max_deviation_percentage"
                value={settings.max_deviation_percentage || '0.05'}
                onChange={(e) => handleChange('max_deviation_percentage', e.target.value)}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md sm:text-sm border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ej. 0.05 (para 5%)"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Si la diferencia entre la primera y segunda medición supera este porcentaje, se solicitará una tercera. (Ej: 0.05 representa un 5%).
            </p>
          </div>

        </div>
      </div>

      <div className="pt-5 border-t border-gray-200">
        <div className="flex justify-end items-center">
          {message.text && (
            <span className={`mr-4 text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {message.text}
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </form>
  );
}
