import React from 'react';

export type BodyZone =
  | 'cabeza'
  | 'tronco'
  | 'extremidades_superiores'
  | 'cadera'
  | 'extremidades_inferiores'
  | 'pies'
  | 'manos'
  | 'todas';

interface BodyMapProps {
    selectedZone: BodyZone;
    onSelectZone: (zone: BodyZone) => void;
}

const BodyMap: React.FC<BodyMapProps> = ({ selectedZone, onSelectZone }) => {

    // Helper function to get the fill color based on selection
    const getFill = (zoneName: BodyZone) => {
        return selectedZone === zoneName || selectedZone === 'todas'
            ? '#3b82f6' // text-blue-500
            : '#e5e7eb'; // text-gray-200
    };

    return (
        <div className="w-full max-w-[200px] mx-auto flex flex-col items-center">
             <svg
                viewBox="0 0 200 500"
                className="w-full h-auto drop-shadow-md cursor-pointer"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Cabeza */}
                <g onClick={() => onSelectZone('cabeza')} className="hover:opacity-80 transition-opacity">
                    <circle cx="100" cy="50" r="30" fill={getFill('cabeza')} stroke="#9ca3af" strokeWidth="2" />
                </g>

                {/* Tronco */}
                <g onClick={() => onSelectZone('tronco')} className="hover:opacity-80 transition-opacity">
                    <path d="M70,90 L130,90 L120,200 L80,200 Z" fill={getFill('tronco')} stroke="#9ca3af" strokeWidth="2" />
                </g>

                {/* Extremidades Superiores (Brazos) */}
                <g onClick={() => onSelectZone('extremidades_superiores')} className="hover:opacity-80 transition-opacity">
                    {/* Brazo Izquierdo */}
                    <path d="M65,100 L40,180 L50,185 L75,110 Z" fill={getFill('extremidades_superiores')} stroke="#9ca3af" strokeWidth="2" />
                    {/* Brazo Derecho */}
                    <path d="M135,100 L160,180 L150,185 L125,110 Z" fill={getFill('extremidades_superiores')} stroke="#9ca3af" strokeWidth="2" />
                </g>

                {/* Manos */}
                 <g onClick={() => onSelectZone('manos')} className="hover:opacity-80 transition-opacity">
                    {/* Mano Izquierda */}
                    <circle cx="45" cy="195" r="10" fill={getFill('manos')} stroke="#9ca3af" strokeWidth="2" />
                    {/* Mano Derecha */}
                    <circle cx="155" cy="195" r="10" fill={getFill('manos')} stroke="#9ca3af" strokeWidth="2" />
                </g>

                {/* Cadera */}
                <g onClick={() => onSelectZone('cadera')} className="hover:opacity-80 transition-opacity">
                    <path d="M75,200 L125,200 L130,240 L70,240 Z" fill={getFill('cadera')} stroke="#9ca3af" strokeWidth="2" />
                </g>

                {/* Extremidades Inferiores (Piernas) */}
                <g onClick={() => onSelectZone('extremidades_inferiores')} className="hover:opacity-80 transition-opacity">
                    {/* Pierna Izquierda */}
                    <path d="M70,240 L95,240 L90,400 L65,400 Z" fill={getFill('extremidades_inferiores')} stroke="#9ca3af" strokeWidth="2" />
                    {/* Pierna Derecha */}
                    <path d="M105,240 L130,240 L135,400 L110,400 Z" fill={getFill('extremidades_inferiores')} stroke="#9ca3af" strokeWidth="2" />
                </g>

                {/* Pies */}
                 <g onClick={() => onSelectZone('pies')} className="hover:opacity-80 transition-opacity">
                    {/* Pie Izquierdo */}
                    <path d="M60,400 L90,400 L95,420 L55,420 Z" fill={getFill('pies')} stroke="#9ca3af" strokeWidth="2" />
                    {/* Pie Derecho */}
                    <path d="M110,400 L140,400 L145,420 L105,420 Z" fill={getFill('pies')} stroke="#9ca3af" strokeWidth="2" />
                </g>
            </svg>
        </div>
    );
};

export default BodyMap;
