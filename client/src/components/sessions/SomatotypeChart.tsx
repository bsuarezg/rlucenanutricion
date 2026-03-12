import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

interface Point {
    x: number;
    y: number;
    name: string;
}

interface SomatotypeChartProps {
    currentPoint?: Point;
    previousPoint?: Point;
}

export default function SomatotypeChart({ currentPoint, previousPoint }: SomatotypeChartProps) {
    const data = [];
    if (previousPoint) data.push({ ...previousPoint, fill: '#9CA3AF' }); // Gray for previous
    if (currentPoint) data.push({ ...currentPoint, fill: '#4F46E5' });  // Indigo for current

    return (
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200" style={{ width: '100%', height: 400 }}>
            <h3 className="text-center font-bold text-gray-800 mb-2">Somatocarta</h3>
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        type="number"
                        dataKey="x"
                        name="Ectomorfia - Endomorfia (X)"
                        domain={[-10, 10]}
                        ticks={[-8, -6, -4, -2, 0, 2, 4, 6, 8]}
                    />
                    <YAxis
                        type="number"
                        dataKey="y"
                        name="2 * Mesomorfia - (Endomorfia + Ectomorfia) (Y)"
                        domain={[-10, 15]}
                        ticks={[-8, -4, 0, 4, 8, 12]}
                    />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <ReferenceLine x={0} stroke="#000" />
                    <ReferenceLine y={0} stroke="#000" />
                    <Scatter name="Somatotipo" data={data} fill="#8884d8">
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
            <div className="flex justify-center mt-4 space-x-6 text-sm">
                <div className="flex items-center"><div className="w-3 h-3 bg-indigo-600 rounded-full mr-2"></div> Sesión Actual</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div> Sesión Anterior</div>
            </div>
            {/* Background image overlay logic could go here, or we use standard axes as approximation */}
        </div>
    );
}
