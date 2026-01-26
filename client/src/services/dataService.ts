import { openDB } from 'idb';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const DB_NAME = 'nutrition-db';
const STORE_NAME = 'pending-sessions';

const initDB = async () => {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        },
    });
};

const saveToIndexedDB = async (data: any) => {
    const db = await initDB();
    await db.put(STORE_NAME, { ...data, timestamp: Date.now() });
};

export const generateXML = (data: any) => {
    const xml = `
<session>
    <patient_id>${data.patient_id}</patient_id>
    <date>${data.date}</date>
    <place>${data.place}</place>
    <type>${data.type}</type>
    <price>${data.price}</price>
    <attended>${data.attended}</attended>
    <clinical_data>
        ${Object.entries(data.clinical_data || {}).map(([k, v]) => `<item key="${k}">${v}</item>`).join('')}
    </clinical_data>
    <formula_data>
        ${Object.entries(data.formula_data || {}).map(([k, v]) => `<item key="${k}">${v}</item>`).join('')}
    </formula_data>
</session>`;
    return xml;
};

export const downloadXML = (data: any) => {
    const xml = generateXML(data);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session_backup_${data.date}_${Date.now()}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const saveSession = async (data: any, token: string) => {
    downloadXML(data);
    try {
        const response = await axios.post(`${API_BASE_URL}/sessions`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return { success: true, mode: 'server', data: response.data };
    } catch (err) {
        console.error('Server save failed, saving to IndexedDB', err);
        await saveToIndexedDB(data);
        return { success: true, mode: 'offline' };
    }
};

export const syncOfflineSessions = async (token: string) => {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const sessions = await store.getAll();
    for (const session of sessions) {
        try {
            const { id, timestamp, ...dataToSync } = session;
            await axios.post(`${API_BASE_URL}/sessions`, dataToSync, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await store.delete(session.id);
        } catch (err) {
            console.error('Sync failed for session', session, err);
        }
    }
    await tx.done;
};
