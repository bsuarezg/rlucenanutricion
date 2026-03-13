import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { Plus as Add, Edit2 as Edit, Trash2 as Delete, AlertTriangle as Warning, RefreshCw as Refresh } from 'lucide-react';

interface Formula {
  id: number;
  name: string;
  expression: string;
  pending_recalculation: number;
}

export default function FormulasSettings() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentFormula, setCurrentFormula] = useState<Partial<Formula>>({});
  const [showRecalcPrompt, setShowRecalcPrompt] = useState(false);

  useEffect(() => {
    fetchFormulas();
  }, []);

  const fetchFormulas = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/formulas`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFormulas(response.data);
    } catch (error) {
      console.error('Error fetching formulas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFormula = async () => {
    try {
      if (currentFormula.id) {
        // Only ask to recalculate if we are editing an existing formula
        setShowRecalcPrompt(true);
      } else {
        // New formula, just save
        await axios.post(`${API_BASE_URL}/formulas`, { ...currentFormula, pending_recalculation: 0 }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        fetchFormulas();
        setShowModal(false);
        setCurrentFormula({});
      }
    } catch (error) {
      console.error('Error saving formula:', error);
    }
  };

  const handleConfirmRecalc = async (recalculateNow: boolean) => {
    try {
      // First, update the formula
      await axios.put(`${API_BASE_URL}/formulas/${currentFormula.id}`, {
        ...currentFormula,
        pending_recalculation: recalculateNow ? 0 : 1
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (recalculateNow) {
        // Trigger recalculation endpoint
        await axios.post(`${API_BASE_URL}/recalculate`, { formula_id: currentFormula.id }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        toast.success('Histórico recalculado con éxito.');
      }

      fetchFormulas();
      setShowRecalcPrompt(false);
      setShowModal(false);
      setCurrentFormula({});
    } catch (error) {
      console.error('Error updating formula/recalculating:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta fórmula?')) {
      try {
        await axios.delete(`${API_BASE_URL}/formulas/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        fetchFormulas();
      } catch (error) {
        console.error('Error deleting formula:', error);
      }
    }
  };

  const handleRecalculatePending = async (id: number) => {
    try {
        await axios.post(`${API_BASE_URL}/recalculate`, { formula_id: id }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        toast.success('Histórico recalculado con éxito.');
        fetchFormulas();
    } catch (error) {
        console.error('Error recalculating formula:', error);
    }
  };

  if (loading) return <div>Cargando fórmulas...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Listado de Fórmulas</h2>
          <p className="text-sm text-gray-500">Variables soportadas: edad, genero, peso, talla, pliegues (ej: pliegue_biceps), constantes_...</p>
        </div>
        <button
          onClick={() => { setCurrentFormula({}); setShowModal(true); }}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          <Add className="mr-2" /> Nueva Fórmula
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {formulas.map((formula) => (
            <li key={formula.id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
              <div>
                <div className="flex items-center">
                  <span className="font-semibold text-gray-900">{formula.name}</span>
                  {formula.pending_recalculation === 1 && (
                    <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Warning className="mr-1 h-3 w-3" />
                      Recálculo pendiente
                    </span>
                  )}
                </div>
                <code className="mt-1 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded block">{formula.expression}</code>
              </div>
              <div className="flex space-x-2">
                {formula.pending_recalculation === 1 && (
                  <button onClick={() => handleRecalculatePending(formula.id)} className="text-blue-600 hover:text-blue-900" title="Recalcular Histórico">
                    <Refresh />
                  </button>
                )}
                <button onClick={() => { setCurrentFormula(formula); setShowModal(true); }} className="text-indigo-600 hover:text-indigo-900">
                  <Edit />
                </button>
                <button onClick={() => handleDelete(formula.id)} className="text-red-600 hover:text-red-900">
                  <Delete />
                </button>
              </div>
            </li>
          ))}
          {formulas.length === 0 && (
            <li className="p-4 text-center text-gray-500">No hay fórmulas definidas.</li>
          )}
        </ul>
      </div>

      {showModal && !showRecalcPrompt && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-xl w-full max-w-2xl">
            <h3 className="text-lg font-bold mb-4">{currentFormula.id ? 'Editar Fórmula' : 'Nueva Fórmula'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre de la Fórmula (identificador)</label>
                <input
                  type="text"
                  value={currentFormula.name || ''}
                  onChange={e => setCurrentFormula({...currentFormula, name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="ej: HARRIS_BENEDICT_HOMBRE"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Expresión Matemática</label>
                <textarea
                  value={currentFormula.expression || ''}
                  onChange={e => setCurrentFormula({...currentFormula, expression: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 font-mono"
                  rows={4}
                  placeholder="ej: 66.47 + (13.75 * peso) + (5.00 * talla) - (6.76 * edad)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Usa operadores matemáticos estandard (+, -, *, /) y agrupa con paréntesis ().
                  <br/>Funciones: pow(base, exponente).
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded text-gray-700">Cancelar</button>
              <button onClick={handleSaveFormula} className="px-4 py-2 bg-indigo-600 text-white rounded">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showRecalcPrompt && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-xl w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4 text-yellow-600 flex items-center">
              <Warning className="mr-2" />
              ¿Recalcular Histórico?
            </h3>
            <p className="text-sm text-gray-700 mb-6">
              Has modificado una fórmula existente. ¿Deseas recalcular ahora mismo todos los resultados históricos de las sesiones que usan esta fórmula?
              <br/><br/>
              Si eliges "No", la fórmula quedará marcada como "Pendiente de recálculo" para hacerlo más tarde o al abrir una sesión antigua.
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => handleConfirmRecalc(false)} className="px-4 py-2 border border-gray-300 rounded text-gray-700">No, más tarde</button>
              <button onClick={() => handleConfirmRecalc(true)} className="px-4 py-2 bg-indigo-600 text-white rounded">Sí, recalcular ahora</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
