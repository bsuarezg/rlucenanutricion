import React from 'react';
import { X, FileText, Activity } from 'lucide-react';
import type { Session } from '../types';
import ZoneMeasurements from './ZoneMeasurements';

interface SessionDetailsModalProps {
    session: Session & { patient_name?: string };
    onClose: () => void;
}

const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({ session, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
                    <h3 className="text-xl font-bold text-gray-800">Detalles de la Sesión</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* General Info */}
                    <section>
                        <h4 className="text-lg font-semibold mb-4 text-primary-700 border-b pb-2">Datos Generales</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">Paciente</label>
                                <p className="text-gray-900 font-medium">{session.patient_name || 'Desconocido'}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">Fecha</label>
                                <p className="text-gray-900">{session.date}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">Lugar</label>
                                <p className="text-gray-900">{session.place}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">Tipo</label>
                                <p className="text-gray-900">{session.type}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">Precio</label>
                                <p className="text-gray-900">{session.price}€</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">Estado</label>
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    session.attended ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    {session.attended ? 'Asistió' : 'No asistió'}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Clinical Data */}
                    <section>
                        <h4 className="text-lg font-semibold mb-4 text-primary-700 border-b pb-2 flex items-center">
                            <Activity size={20} className="mr-2" />
                            Datos Clínicos / Mediciones por Zona
                        </h4>
                        <ZoneMeasurements
                            clinicalData={session.clinical_data || {}}
                            readonly={true}
                        />
                    </section>

                    {/* Formula Data */}
                    <section>
                        <h4 className="text-lg font-semibold mb-4 text-primary-700 border-b pb-2 flex items-center">
                            <FileText size={20} className="mr-2" />
                            Resultados de Fórmulas
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {Object.entries(session.formula_data || {}).map(([key, value]) => (
                                <div key={key} className="bg-green-50 p-3 rounded-md border border-green-100">
                                    <label className="block text-xs font-medium text-green-700 mb-1 capitalize">{key}</label>
                                    <p className="font-mono text-green-900 font-bold">{value}</p>
                                </div>
                            ))}
                             {Object.keys(session.formula_data || {}).length === 0 && (
                                <p className="text-gray-400 text-sm col-span-full italic">No hay fórmulas registradas.</p>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default SessionDetailsModal;
