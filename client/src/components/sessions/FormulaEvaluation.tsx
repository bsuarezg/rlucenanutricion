import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { RefreshCcw } from 'lucide-react';
import SomatotypeChart from './SomatotypeChart';

interface FormulaResult {
    formula_id: number;
    name: string;
    result_value: string;
    is_outdated: number;
}

export default function FormulaEvaluation({ data, onFormulasChange, patientId }: any) {
    const { token } = useAuth();
    const [results, setResults] = useState<FormulaResult[]>([]);
    const [formulas, setFormulas] = useState<any[]>([]);

    // For somatotype chart
    const [currentSoma, setCurrentSoma] = useState<any>(null);
    const [previousSoma, setPreviousSoma] = useState<any>(null);

    useEffect(() => {
        const fetchAllFormulas = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/formulas`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFormulas(res.data);
            } catch(e) { console.error(e); }
        };
        fetchAllFormulas();
    }, [token]);

    // Evaluate formulas on data change
    useEffect(() => {
        if (!data || Object.keys(data).length === 0 || formulas.length === 0) return;

        const evaluate = async () => {
            const newResults: FormulaResult[] = [];
            for (const formula of formulas) {
                try {
                    const res = await axios.post(`${API_BASE_URL}/evaluate`, {
                        expression: formula.expression,
                        variables: data
                    }, { headers: { Authorization: `Bearer ${token}` }});

                    newResults.push({
                        formula_id: formula.id,
                        name: formula.name,
                        result_value: res.data.result.toFixed(2),
                        is_outdated: formula.pending_recalculation
                    });
                } catch(e) {
                    // It's normal to fail if some variables aren't filled yet
                    // console.log(`Error evaluating ${formula.name}`, e);
                }
            }
            setResults(newResults);

            // Format for parent form submission
            onFormulasChange(newResults.map(r => ({
                formula_id: r.formula_id,
                result_value: parseFloat(r.result_value)
            })));

            // If we have endo, meso, ecto results, calculate X and Y for somatotype chart
            // X = Ecto - Endo
            // Y = 2*Meso - (Endo + Ecto)
            const endo = newResults.find(r => r.name.toLowerCase().includes('endo'))?.result_value;
            const meso = newResults.find(r => r.name.toLowerCase().includes('meso'))?.result_value;
            const ecto = newResults.find(r => r.name.toLowerCase().includes('ecto'))?.result_value;

            if (endo !== undefined && meso !== undefined && ecto !== undefined) {
                const e = parseFloat(endo);
                const m = parseFloat(meso);
                const c = parseFloat(ecto);
                setCurrentSoma({
                    x: c - e,
                    y: 2 * m - (e + c),
                    name: 'Current'
                });
            } else {
                setCurrentSoma(null);
            }
        };
        evaluate();

    }, [data, formulas, token]);

    // Fetch previous somatotype if patientId
    useEffect(() => {
        if (!patientId || formulas.length === 0) return;

        const fetchPast = async () => {
             const res = await axios.get(`${API_BASE_URL}/sessions?patient_id=${patientId}`, {
                 headers: { Authorization: `Bearer ${token}` }
             });

             // find the latest past session with formulas_results
             const pastSessions = res.data.filter((s:any) => s.type === 'formula' && s.formulas_results && s.formulas_results.length > 0);
             if (pastSessions.length > 0) {
                 const pastResults = pastSessions[0].formulas_results;

                 // Get formula IDs for endo, meso, ecto
                 const endoId = formulas.find(f => f.name.toLowerCase().includes('endo'))?.id;
                 const mesoId = formulas.find(f => f.name.toLowerCase().includes('meso'))?.id;
                 const ectoId = formulas.find(f => f.name.toLowerCase().includes('ecto'))?.id;

                 const e = pastResults.find((r:any) => r.formula_id === endoId)?.result_value;
                 const m = pastResults.find((r:any) => r.formula_id === mesoId)?.result_value;
                 const c = pastResults.find((r:any) => r.formula_id === ectoId)?.result_value;

                 if (e !== undefined && m !== undefined && c !== undefined) {
                     setPreviousSoma({
                         x: c - e,
                         y: 2 * m - (e + c),
                         name: 'Previous'
                     });
                 }
             }
        };
        fetchPast();
    }, [patientId, formulas, token]);


    if (results.length === 0) return null;

    return (
        <div className="mt-8 space-y-6">
            <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Resultados Formulados</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((r, i) => (
                    <div key={i} className={`p-4 rounded-lg shadow-sm border ${r.is_outdated ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-gray-600">{r.name}</span>
                            {r.is_outdated === 1 && <span title="Fórmula desactualizada. Guardar para recalcular." className="text-yellow-500"><RefreshCcw size={16}/></span>}
                        </div>
                        <div className="text-2xl font-bold text-indigo-600">{r.result_value}</div>
                    </div>
                ))}
            </div>

            {/* Somatotype Chart Rendering (if valid coordinates exist) */}
            {(currentSoma || previousSoma) && (
                <div className="mt-8">
                    <SomatotypeChart currentPoint={currentSoma} previousPoint={previousSoma} />
                </div>
            )}
        </div>
    );
}
