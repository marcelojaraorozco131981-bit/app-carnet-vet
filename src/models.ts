export interface Pet {
  id: number;
  name: string;
  breed: string;
  dob: string; // YYYY-MM-DD
  photoUrl: string;
}

export interface VetClinic {
  name: string;
  hours: string;
  phone: string;
}

export type RecordType = 'Control' | 'Vacuna' | 'Medicación' | 'Próximo Control';

export interface MedicalRecord {
  id: number;
  petId: number;
  type: RecordType;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM for upcoming controls
  doctor: string;
  notes: string;
  nextDueDate?: string; // YYYY-MM-DD for vaccines
}