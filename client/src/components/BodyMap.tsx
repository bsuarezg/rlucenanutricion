import React from 'react';

export type BodyZone = string;

interface BodyMapProps {
    selectedZone: BodyZone | null;
    onSelectZone?: (zone: BodyZone) => void;
}

const BodyMap: React.FC<BodyMapProps> = ({ selectedZone, onSelectZone }) => {

    // Helper function to get the fill color based on selection
    const getFill = (zoneName: BodyZone) => {
        return selectedZone === zoneName || selectedZone === null || selectedZone === 'todas'
            ? '#3b82f6' // text-blue-500
            : '#e5e7eb'; // text-gray-200
    };

    const handleSelect = (zone: string) => {
        if (onSelectZone) onSelectZone(zone);
    };

    return (
        <div className="w-full max-w-[200px] mx-auto flex flex-col items-center">
             <svg
                viewBox="0 0 200 500"
                className="w-full h-auto drop-shadow-md cursor-pointer"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Cabeza */}
                <g onClick={() => handleSelect('cabeza')} className="hover:opacity-80 transition-opacity">
                    <circle cx="100" cy="50" r="30" fill={getFill('cabeza')} stroke="#9ca3af" strokeWidth="2" />
                </g>

                {/* Cuello */}
                <g onClick={() => handleSelect('cuello')} className="hover:opacity-80 transition-opacity">
                    <path d="M85,75 L115,75 L120,90 L80,90 Z" fill={getFill('cuello')} stroke="#9ca3af" strokeWidth="2" />
                </g>

                {/* Tronco / Torso */}
                <g onClick={() => handleSelect('torso')} className="hover:opacity-80 transition-opacity">
                    <path d="M70,90 L130,90 L120,200 L80,200 Z" fill={getFill('torso')} stroke="#9ca3af" strokeWidth="2" />
                </g>

                {/* Extremidades Superiores (Brazos) */}
                <g onClick={() => handleSelect('brazos')} className="hover:opacity-80 transition-opacity">
                    {/* Brazo Izquierdo */}
                    <path d="M65,100 L40,180 L50,185 L75,110 Z" fill={getFill('brazos')} stroke="#9ca3af" strokeWidth="2" />
                    {/* Brazo Derecho */}
                    <path d="M135,100 L160,180 L150,185 L125,110 Z" fill={getFill('brazos')} stroke="#9ca3af" strokeWidth="2" />
                </g>

                {/* Extremidades Inferiores (Piernas) */}
                <g onClick={() => handleSelect('piernas')} className="hover:opacity-80 transition-opacity">
                    {/* Pierna Izquierda */}
                    <path d="M70,200 L95,200 L90,400 L65,400 Z" fill={getFill('piernas')} stroke="#9ca3af" strokeWidth="2" />
                    {/* Pierna Derecha */}
                    <path d="M105,200 L130,200 L135,400 L110,400 Z" fill={getFill('piernas')} stroke="#9ca3af" strokeWidth="2" />
                </g>

            </svg>
        </div>
    );
};

export default BodyMap;
