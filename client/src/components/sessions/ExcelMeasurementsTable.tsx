import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle } from 'lucide-react';

interface MeasurementRow {
  id: string; // unique identifier for the row (e.g., 'biceps')
  label: string; // display name
  value1: string;
  value2: string;
  value3: string;
  final_value: string;
  previous_final_value?: string;
}

interface ExcelMeasurementsTableProps {
  templateFields: any[];
  patientId?: string;
  onMeasurementsChange: (measurements: any[]) => void;
}

export default function ExcelMeasurementsTable({ templateFields, patientId, onMeasurementsChange }: ExcelMeasurementsTableProps) {
  const { token } = useAuth();
  const [rows, setRows] = useState<MeasurementRow[]>([]);
  const [maxDeviation, setMaxDeviation] = useState(0.05); // Default 5%

  // 1. Fetch settings (max_deviation)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.max_deviation_percentage) {
          setMaxDeviation(parseFloat(res.data.max_deviation_percentage));
        }
      } catch (e) {
        console.error("Could not load settings", e);
      }
    };
    fetchSettings();
  }, [token]);

  // 2. Initialize rows from template
  useEffect(() => {
    if (templateFields && templateFields.length > 0) {
      const initialRows = templateFields.map(field => {
        // field can be string or object depending on template structure
        const label = typeof field === 'string' ? field : field.name;
        const id = label.toLowerCase().replace(/\s+/g, '_');
        return {
          id,
          label,
          value1: '',
          value2: '',
          value3: '',
          final_value: ''
        };
      });
      setRows(initialRows);

      // If patientId exists, fetch previous session to populate previous_final_value
      if (patientId) {
        fetchPreviousSessionMeasurements(patientId, initialRows);
      }
    } else {
        setRows([]);
    }
  }, [templateFields, patientId, token]);

  const fetchPreviousSessionMeasurements = async (pId: string, currentRows: MeasurementRow[]) => {
      try {
          const res = await axios.get(`${API_BASE_URL}/sessions?patient_id=${pId}`, {
             headers: { Authorization: `Bearer ${token}` }
          });

          if (res.data && res.data.length > 0) {
              // Assuming the first one is the most recent past session
              // Or we filter by type='measurement'
              const pastSessions = res.data.filter((s:any) => s.type === 'measurement');
              if (pastSessions.length > 0) {
                  const lastSession = pastSessions[0];
                  if (lastSession.measurements && lastSession.measurements.length > 0) {
                      const updatedRows = currentRows.map(row => {
                          const pastMeasurement = lastSession.measurements.find((m:any) => m.measurement_type === row.id);
                          return {
                              ...row,
                              previous_final_value: pastMeasurement ? pastMeasurement.final_value?.toString() : undefined
                          };
                      });
                      setRows(updatedRows);
                  }
              }
          }
      } catch (e) {
          console.error("Error fetching previous session", e);
      }
  };

  // 3. Logic to calculate median and check deviation
  const calculateRowValues = (row: MeasurementRow): MeasurementRow => {
    const v1 = parseFloat(row.value1);
    const v2 = parseFloat(row.value2);
    const v3 = parseFloat(row.value3);

    const hasV1 = !isNaN(v1);
    const hasV2 = !isNaN(v2);
    const hasV3 = !isNaN(v3);

    let needsThird = false;
    let finalVal = 0;

    if (hasV1 && hasV2) {
      const mean = (v1 + v2) / 2;
      const diff = Math.abs(v1 - v2);
      // Avoid division by zero
      if (mean !== 0) {
        const deviation = diff / mean;
        if (deviation > maxDeviation) {
          needsThird = true;
        }
      }

      if (needsThird && hasV3) {
        // Median of 3
        const arr = [v1, v2, v3].sort((a, b) => a - b);
        finalVal = arr[1];
      } else if (!needsThird) {
        // Median of 2 is just the mean (median of 2 elements is their mean)
        finalVal = mean;
      }
    } else if (hasV1 && !hasV2) {
        finalVal = v1;
    }

    return {
      ...row,
      final_value: ((hasV1 && hasV2 && !needsThird) || (hasV1 && hasV2 && needsThird && hasV3)) ? finalVal.toFixed(2) : ''
    };
  };

  const handleValueChange = (index: number, field: 'value1' | 'value2' | 'value3', val: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: val };
    newRows[index] = calculateRowValues(newRows[index]);
    setRows(newRows);

    // Notify parent to save in form state
    const formattedForApi = newRows.map(r => ({
        measurement_type: r.id,
        value1: r.value1 ? parseFloat(r.value1) : null,
        value2: r.value2 ? parseFloat(r.value2) : null,
        value3: r.value3 ? parseFloat(r.value3) : null,
        final_value: r.final_value ? parseFloat(r.final_value) : null
    })).filter(r => r.final_value !== null);

    onMeasurementsChange(formattedForApi);
  };

  const checkNeedsThird = (v1Str: string, v2Str: string) => {
      const v1 = parseFloat(v1Str);
      const v2 = parseFloat(v2Str);
      if(isNaN(v1) || isNaN(v2)) return false;
      const mean = (v1 + v2) / 2;
      if (mean === 0) return false;
      return (Math.abs(v1 - v2) / mean) > maxDeviation;
  };

  if (rows.length === 0) {
      return <div className="text-gray-500 italic text-sm py-4">Selecciona una plantilla para cargar los campos de medición.</div>;
  }

  return (
    <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Medición</th>
            <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">1ª Medida</th>
            <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">2ª Medida</th>
            <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">3ª Medida</th>
            <th scope="col" className="px-3 py-3.5 text-center text-sm font-bold text-indigo-600 bg-indigo-50">FINAL (Mediana)</th>
            <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-500 border-l-2 border-gray-200">Anterior</th>
            <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-500">Diferencia</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {rows.map((row, idx) => {
              const needsThird = checkNeedsThird(row.value1, row.value2);

              let diffStr = '-';
              let diffColor = 'text-gray-500';
              if (row.final_value && row.previous_final_value) {
                  const diff = parseFloat(row.final_value) - parseFloat(row.previous_final_value);
                  diffStr = diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
                  diffColor = diff > 0 ? 'text-red-600' : (diff < 0 ? 'text-green-600' : 'text-gray-500');
              }

              return (
                <tr key={row.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {row.label}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                        <input
                            type="number" step="any"
                            className="w-20 text-center border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm mx-auto block"
                            value={row.value1}
                            onChange={(e) => handleValueChange(idx, 'value1', e.target.value)}
                        />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                        <input
                            type="number" step="any"
                            className="w-20 text-center border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm mx-auto block"
                            value={row.value2}
                            onChange={(e) => handleValueChange(idx, 'value2', e.target.value)}
                        />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 relative">
                        <input
                            type="number" step="any"
                            className={`w-20 text-center rounded-md shadow-sm sm:text-sm mx-auto block ${needsThird ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50'}`}
                            value={row.value3}
                            onChange={(e) => handleValueChange(idx, 'value3', e.target.value)}
                            disabled={!needsThird}
                            placeholder={needsThird ? 'Req.' : '-'}
                        />
                        {needsThird && !row.value3 && (
                            <div title="Diferencia supera el límite. Requiere 3ra medida." className="absolute right-0 top-3">
                                <AlertTriangle className="text-red-500 h-4 w-4" />
                            </div>
                        )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 bg-indigo-50 font-bold text-center text-indigo-700">
                        {row.final_value || '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-center text-sm text-gray-500 border-l-2 border-gray-200">
                        {row.previous_final_value ? parseFloat(row.previous_final_value).toFixed(2) : '-'}
                    </td>
                    <td className={`whitespace-nowrap px-3 py-2 text-center text-sm font-medium ${diffColor}`}>
                        {diffStr}
                    </td>
                </tr>
              );
          })}
        </tbody>
      </table>
    </div>
  );
}
