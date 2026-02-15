import { performance } from 'perf_hooks';

const NUM_SESSIONS = 10000;
const NUM_PATIENTS = 2000;
const ITERATIONS = 100; // Simulate 100 re-renders

// Generate Mock Data
const patients = {};
for (let i = 1; i <= NUM_PATIENTS; i++) {
    patients[i] = 'Patient ' + i;
}

const sessions = [];
for (let i = 0; i < NUM_SESSIONS; i++) {
    sessions.push({
        id: i,
        patient_id: Math.floor(Math.random() * NUM_PATIENTS) + 1,
        date: '2023-10-' + (i % 30 + 1).toString().padStart(2, '0'),
        place: 'Clinic ' + (i % 5),
        type: 'Type ' + (i % 3),
        price: 100,
        attended: Math.random() > 0.1,
        clinical_data: {},
        formula_data: {}
    });
}

const searchTerm = 'Patient 100'; // Specific search term

console.log(`Benchmarking with ${NUM_SESSIONS} sessions and ${NUM_PATIENTS} patients over ${ITERATIONS} iterations...`);

// --- Baseline (Unoptimized) ---
const startBase = performance.now();
let resultBaseCount = 0;

for (let i = 0; i < ITERATIONS; i++) {
    // 1. Enrich (Map) - Expensive allocation
    const enrichedSessions = sessions.map(s => ({
        ...s,
        patient_name: patients[s.patient_id] || 'Desconocido'
    }));

    // 2. Filter
    const filteredSessions = enrichedSessions.filter(s =>
        (s.patient_name && s.patient_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        s.date.includes(searchTerm)
    );
    resultBaseCount += filteredSessions.length;
}

const endBase = performance.now();
const baselineTime = endBase - startBase;

// --- Optimized (Simulating useMemo) ---
const startOpt = performance.now();
let resultOptCount = 0;

// 1. Enrich (Map) - Run once (memoized)
const enrichedSessionsMemo = sessions.map(s => ({
    ...s,
    patient_name: patients[s.patient_id] || 'Desconocido'
}));

for (let i = 0; i < ITERATIONS; i++) {
    // 2. Filter - Runs every time (simulating searchTerm change or re-render requiring filter)
    const filteredSessions = enrichedSessionsMemo.filter(s =>
        (s.patient_name && s.patient_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        s.date.includes(searchTerm)
    );
    resultOptCount += filteredSessions.length;
}

const endOpt = performance.now();
const optimizedTime = endOpt - startOpt;

console.log('--- Results ---');
console.log(`Baseline (Unoptimized): ${baselineTime.toFixed(2)} ms total (${(baselineTime / ITERATIONS).toFixed(4)} ms/render)`);
console.log(`Optimized (Memoized Map): ${optimizedTime.toFixed(2)} ms total (${(optimizedTime / ITERATIONS).toFixed(4)} ms/render)`);
console.log(`Improvement: ${(baselineTime / optimizedTime).toFixed(2)}x faster`);
