
export const calculateFormulas = (clinicalData: Record<string, string | number>) => {
    const results: Record<string, string | number> = {};

    // Helper to get number value safely
    const getVal = (key: string): number | null => {
        const val = clinicalData[key];
        if (val === undefined || val === '') return null;
        const num = parseFloat(val.toString());
        return isNaN(num) ? null : num;
    };

    const weight = getVal('peso') || getVal('weight');
    const height = getVal('altura') || getVal('height') || getVal('talla'); // en cm o m

    // IMC (BMI)
    if (weight && height) {
        // Assume height is in cm if > 3, else meters
        const heightM = height > 3 ? height / 100 : height;
        const imc = weight / (heightM * heightM);
        results['IMC'] = imc.toFixed(2);
    }

    // Sumatoria de Pliegues (Standard names: tricipital, bicipital, subescapular, suprailiaco)
    const tricipital = getVal('pliegue_tricipital') || getVal('tricipital');
    const bicipital = getVal('pliegue_bicipital') || getVal('bicipital');
    const subescapular = getVal('pliegue_subescapular') || getVal('subescapular');
    const suprailiaco = getVal('pliegue_suprailiaco') || getVal('suprailiaco');

    if (tricipital && bicipital && subescapular && suprailiaco) {
        const sum4 = tricipital + bicipital + subescapular + suprailiaco;
        results['Sumatorio_4_Pliegues'] = sum4.toFixed(1);

        // % Grasa (Faulkner) - Ejemplo: 4 pliegues * 0.153 + 5.783
        const fatFaulkner = (sum4 * 0.153) + 5.783;
        results['Grasa_Faulkner_%'] = fatFaulkner.toFixed(2);

        // % Grasa (Yuhasz) - Ejemplo simplificado
        // Hombres: (sum6 * 0.1) + 3.64 (necesitaría 6, usamos 4 aprox para demo si no hay mas)
        const fatYuhasz = (sum4 * 0.1) + 3.64;
        results['Grasa_Yuhasz_Est_%'] = fatYuhasz.toFixed(2);
    }

    // Waist-Hip Ratio
    const waist = getVal('cintura') || getVal('waist');
    const hip = getVal('cadera') || getVal('hip');

    if (waist && hip) {
        const whr = waist / hip;
        results['Indice_Cintura_Cadera'] = whr.toFixed(2);
    }

    return results;
};
