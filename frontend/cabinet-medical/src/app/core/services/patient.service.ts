import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Patient {
  _id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  phoneNumber: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  medicalHistory?: string;
  allergies?: string[];
  currentMedications?: string[];
  bloodType?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
}

export interface MedicalRecord {
  _id: string;
  patientId: string;
  date: Date;
  type: string;
  description: string;
  attachments?: string[];
  doctorId: string;
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = `${environment.apiUrl}/patients`;

  constructor(private http: HttpClient) { }

  // Récupérer tous les patients
  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(this.apiUrl);
  }

  // Récupérer un patient par son ID
  getPatient(id: string): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/${id}`);
  }

  // Créer un nouveau patient
  createPatient(patientData: Partial<Patient>): Observable<Patient> {
    return this.http.post<Patient>(this.apiUrl, patientData);
  }

  // Mettre à jour un patient
  updatePatient(id: string, patientData: Partial<Patient>): Observable<Patient> {
    return this.http.put<Patient>(`${this.apiUrl}/${id}`, patientData);
  }

  // Supprimer un patient
  deletePatient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Récupérer l'historique médical d'un patient
  getMedicalHistory(patientId: string): Observable<MedicalRecord[]> {
    return this.http.get<MedicalRecord[]>(`${this.apiUrl}/${patientId}/medical-history`);
  }

  // Ajouter une entrée dans l'historique médical
  addMedicalRecord(patientId: string, record: Partial<MedicalRecord>): Observable<MedicalRecord> {
    return this.http.post<MedicalRecord>(`${this.apiUrl}/${patientId}/medical-history`, record);
  }

  // Récupérer les rendez-vous d'un patient
  getPatientAppointments(patientId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${patientId}/appointments`);
  }

  // Rechercher des patients
  searchPatients(query: string): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.apiUrl}/search?q=${query}`);
  }

  // Récupérer les statistiques d'un patient
  getPatientStats(patientId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${patientId}/stats`);
  }

  // Télécharger le dossier médical complet
  downloadMedicalFile(patientId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${patientId}/medical-file`, {
      responseType: 'blob'
    });
  }
} 