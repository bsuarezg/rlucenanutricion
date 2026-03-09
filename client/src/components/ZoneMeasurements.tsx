import React, { useState, useEffect } from 'react';
import type { BodyZone } from './BodyMap';
import BodyMap from './BodyMap';

// Configurable mapping logic
const ZONE_CONFIG_KEY = 'nutrition_zone_config';

export type ZoneConfig = Record<string, BodyZone>;

export const getZoneConfig = (): ZoneConfig => {
    const saved = localStorage.getItem(ZONE_CONFIG_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Failed to parse zone config', e);
        }
    }
    return {};
};

export const saveZoneConfig = (config: ZoneConfig) => {
    localStorage.setItem(ZONE_CONFIG_KEY, JSON.stringify(config));
};

interface ZoneMeasurementsProps {
    clinicalData: Record<string, string | number>;
    onDataChange?: (key: string, value: string) => void;
    readonly?: boolean;
    onAddCustomField?: () => void;
    onApplyTemplate?: (templateId: string) => void;
    templates?: { id: number; name: string; type: string; fields: string[] }[];
}

const ZONES: { value: BodyZone; label: string }[] = [
    { value: 'todas', label: 'Todas las Zonas' },
    { value: 'cabeza', label: 'Cabeza' },
    { value: 'tronco', label: 'Tronco' },
    { value: 'extremidades_superiores', label: 'Extremidades Superiores' },
    { value: 'cadera', label: 'Cadera' },
    { value: 'extremidades_inferiores', label: 'Extremidades Inferiores' },
    { value: 'pies', label: 'Pies' },
    { value: 'manos', label: 'Manos' },
];

const ZoneMeasurements: React.FC<ZoneMeasurementsProps> = ({
    clinicalData,
    onDataChange,
    readonly = false,
    onAddCustomField,
    onApplyTemplate,
    templates = []
}) => {
    const [selectedZone, setSelectedZone] = useState<BodyZone>('todas');
    const [zoneConfig, setZoneConfig] = useState<ZoneConfig>(getZoneConfig());
    const [isConfiguring, setIsConfiguring] = useState(false);

    useEffect(() => {
        saveZoneConfig(zoneConfig);
    }, [zoneConfig]);

    const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedZone(e.target.value as BodyZone);
    };

    const handleConfigChange = (metric: string, newZone: BodyZone) => {
        setZoneConfig(prev => ({
            ...prev,
            [metric]: newZone
        }));
    };

    // Filtramos las métricas a mostrar según la zona seleccionada
    const metricsToShow = Object.entries(clinicalData).filter(([key]) => {
        if (selectedZone === 'todas') return true;

        // Si no está configurada, por defecto la mostramos en "todas" pero no en una específica
        const metricZone = zoneConfig[key] || 'todas';
        return metricZone === selectedZone;
    });

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Panel Izquierdo: Maniquí */}
            <div className="w-full lg:w-1/3 flex flex-col items-center">
                <div className="w-full mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Seleccionar Zona
                    </label>
                    <select
                        value={selectedZone}
                        onChange={handleZoneChange}
                        className="w-full border rounded-md px-3 py-2 bg-white focus:ring-1 focus:ring-primary-500"
                    >
                        {ZONES.map(zone => (
                            <option key={zone.value} value={zone.value}>
                                {zone.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex-1 w-full bg-gray-50 rounded-lg p-4 border flex flex-col items-center justify-center min-h-[400px]">
                    <BodyMap selectedZone={selectedZone} onSelectZone={setSelectedZone} />
                </div>

                {!readonly && (
                    <button
                        type="button"
                        onClick={() => setIsConfiguring(!isConfiguring)}
                        className="mt-4 text-sm text-primary-600 hover:text-primary-800 underline"
                    >
                        {isConfiguring ? 'Cerrar Configuración de Zonas' : 'Configurar Zonas de Medidas'}
                    </button>
                )}
            </div>

            {/* Panel Derecho: Mediciones */}
            <div className="w-full lg:w-2/3">
                 {/* Header Actions */}
                 {!readonly && (
                    <div className="flex justify-end items-center mb-4 gap-2">
                         <select
                            className="text-sm border rounded px-2 py-1 bg-white"
                            onChange={(e) => {
                                if (e.target.value && onApplyTemplate) {
                                    onApplyTemplate(e.target.value);
                                }
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
                            onClick={onAddCustomField}
                            className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                        >
                            + Campo
                        </button>
                    </div>
                )}

                {/* Lista de Mediciones */}
                {!isConfiguring ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {metricsToShow.map(([key, value]) => (
                            <div key={key} className={readonly ? "bg-gray-50 p-3 rounded-md border" : ""}>
                                <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">{key}</label>
                                {readonly ? (
                                    <p className="font-mono text-gray-800">{value}</p>
                                ) : (
                                    <input
                                        type="text"
                                        value={value}
                                        onChange={(e) => onDataChange && onDataChange(key, e.target.value)}
                                        className="w-full border rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-primary-500"
                                    />
                                )}
                            </div>
                        ))}
                        {metricsToShow.length === 0 && (
                            <p className="text-gray-400 text-sm col-span-full italic">
                                {selectedZone === 'todas'
                                    ? "No hay mediciones registradas. Carga una plantilla o añade campos."
                                    : `No hay mediciones asignadas a la zona: ${ZONES.find(z => z.value === selectedZone)?.label}.`
                                }
                            </p>
                        )}
                    </div>
                ) : (
                    /* Vista de Configuración */
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h5 className="font-semibold text-yellow-800 mb-4">Configurar asignación de zonas</h5>
                        <p className="text-xs text-yellow-700 mb-4">
                            Asigna cada medida a una zona del cuerpo. Esta configuración se guardará localmente en tu navegador.
                        </p>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                             {Object.keys(clinicalData).map((key) => (
                                <div key={key} className="flex items-center justify-between bg-white p-2 rounded border">
                                    <span className="text-sm font-medium text-gray-700 capitalize w-1/2 truncate pr-2" title={key}>
                                        {key}
                                    </span>
                                    <select
                                        value={zoneConfig[key] || 'todas'}
                                        onChange={(e) => handleConfigChange(key, e.target.value as BodyZone)}
                                        className="text-sm border rounded px-2 py-1 w-1/2"
                                    >
                                        <option value="todas">Ninguna específica (Mostrar en Todas)</option>
                                        <option value="cabeza">Cabeza</option>
                                        <option value="tronco">Tronco</option>
                                        <option value="extremidades_superiores">Extremidades Superiores</option>
                                        <option value="cadera">Cadera</option>
                                        <option value="extremidades_inferiores">Extremidades Inferiores</option>
                                        <option value="pies">Pies</option>
                                        <option value="manos">Manos</option>
                                    </select>
                                </div>
                            ))}
                            {Object.keys(clinicalData).length === 0 && (
                                <p className="text-sm text-gray-500 italic">No hay campos para configurar aún. Añade campos o carga una plantilla primero.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ZoneMeasurements;
