import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import BodyMap from '../BodyMap';

const ZoneMeasurements = () => {
    const { token } = useAuth();
    const [selectedZone, setSelectedZone] = useState<string>('todas');
    const [zones, setZones] = useState<{ value: string; label: string }[]>([]);

    // measurements by zone. Default empty to be filled by template
    const [measurements, setMeasurements] = useState<Record<string, {name: string, value: string}[]>>({});

    useEffect(() => {
        fetchZones();

        const loadFromLocalStorage = () => {
            const stored = localStorage.getItem('zoneMeasurements');
            if (stored) {
                setMeasurements(JSON.parse(stored));
            } else {
                setMeasurements({});
            }
        };

        // Initial load
        loadFromLocalStorage();

        // Listen for template changes
        window.addEventListener('zone_config_updated', loadFromLocalStorage);

        return () => {
            window.removeEventListener('zone_config_updated', loadFromLocalStorage);
        };
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

    const handleMeasurementChange = (zone: string, index: number, value: string) => {
        const newMeasurements = { ...measurements };
        newMeasurements[zone][index].value = value;
        setMeasurements(newMeasurements);
        // Persist to parent component via localStorage
        localStorage.setItem('zoneMeasurements', JSON.stringify(newMeasurements));
    };

    const currentZoneMeasurements = measurements[selectedZone] || [];

    return (
        <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3">
                <BodyMap
                    selectedZone={selectedZone === 'todas' ? null : selectedZone}
                    onSelectZone={(zone) => setSelectedZone(zone)}
                />
            </div>

            <div className="w-full md:w-2/3">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-full">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-gray-700 capitalize">
                            {selectedZone === 'todas' ? 'Todas las Zonas' :
                             (zones.find(z => z.value === selectedZone)?.label || selectedZone)}
                        </h4>

                        <select
                            value={selectedZone}
                            onChange={(e) => setSelectedZone(e.target.value)}
                            className="border rounded-md px-2 py-1 text-sm bg-white"
                        >
                            <option value="todas">Todas las Zonas</option>
                            {zones.map(zone => (
                                <option key={zone.value} value={zone.value}>{zone.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-3">
                        {selectedZone === 'todas' ? (
                            Object.entries(measurements).map(([zone, measures]) => (
                                measures.map((m, index) => (
                                    <div key={`${zone}-${index}`} className="flex items-center gap-3">
                                        <div className="w-1/3">
                                            <input
                                                type="text"
                                                value={m.name}
                                                disabled
                                                className="w-full border rounded-md px-3 py-2 text-sm bg-gray-100"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={m.value}
                                                onChange={(e) => handleMeasurementChange(zone, index, e.target.value)}
                                                placeholder="Valor"
                                                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <span className="text-xs text-gray-400 capitalize w-16 text-right">
                                            {zones.find(z => z.value === zone)?.label || zone}
                                        </span>
                                    </div>
                                ))
                            ))
                        ) : (
                            currentZoneMeasurements.map((m, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className="w-1/3">
                                        <input
                                            type="text"
                                            value={m.name}
                                            disabled
                                            className="w-full border rounded-md px-3 py-2 text-sm bg-gray-100"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={m.value}
                                            onChange={(e) => handleMeasurementChange(selectedZone, index, e.target.value)}
                                            placeholder="Valor"
                                            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                </div>
                            ))
                        )}

                        {(selectedZone === 'todas' ? Object.values(measurements).flat() : currentZoneMeasurements).length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4 italic">
                                No hay campos configurados. Selecciona una plantilla de mediciones.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ZoneMeasurements;
