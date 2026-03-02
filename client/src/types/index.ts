export interface User {
    username: string;
}

export interface Patient {
    id: number;
    name: string;
    dni: string;
    dob: string;
    email: string;
    phone: string;
    created_at: string;
}

export interface Session {
    id: number;
    patient_id: number;
    date: string;
    place: string;
    type: string;
    price: number;
    attended: boolean;
    clinical_data: Record<string, string | number>;
    formula_data: Record<string, string | number>;
}

export interface Template {
    id: number;
    name: string;
    type: 'measurement' | 'formula';
    fields: string[];
}
