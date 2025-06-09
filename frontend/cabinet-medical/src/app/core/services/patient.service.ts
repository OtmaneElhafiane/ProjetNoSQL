import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Patient {
  _id?: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  patient_id?: string;
  cin: string;
  name?: string;
  phone: string;
  type: string;
  address: string;
  created_at?: Date;
  last_login?: Date;
}

export interface CreatePatientData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  cin: string;
  phone: string;
  type: string;
  address: string;
}

export interface PatientResponse {
  patients: Patient[];
  total: number;
}

export interface PatientProfileResponse {
  last_login: Date;
  created_at: Date;
  patient?: Patient;
}

export interface Consultation {
  consultation_id: string;
  date: string;
  motif: string;
  diagnostic: string;
  traitement: string;
  notes: string;
  status: string;
  created_at: string;
  doctor: {
    id_doctor: string;
    name: string;
    email: string;
    phone: string;
    speciality: string;
    address: string;
  };
}

export interface ConsultationHistoryResponse {
  consultations: Consultation[];
  total: number;
}

export interface UpcomingConsultationsResponse {
  upcoming_consultations: Consultation[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = `${environment.apiUrl}/patients`;

  constructor(private http: HttpClient) { }

  // ======================== GESTION DES PATIENTS (ADMIN SEULEMENT) ========================

  // Récupérer tous les patients (Admin seulement)
  getAllPatients(): Observable<PatientResponse> {
    return this.http.get<PatientResponse>(`${this.apiUrl}/patients`);
  }

  // Créer un nouveau patient (Admin seulement)
  createPatient(patientData: CreatePatientData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, patientData);
  }

  // Récupérer un patient par son user_id (Admin seulement)
  getPatientById(userId: string): Observable<PatientProfileResponse> {
    return this.http.get<PatientProfileResponse>(`${this.apiUrl}/patientById/${userId}`);
  }


  //Récupérer un patient par son user_id (Doctor seulement)
  get_patient_details_by_id(userId: string): Observable<PatientProfileResponse> {
    return this.http.get<PatientProfileResponse>(`${this.apiUrl}/doctor/patients/${userId}`);
  }



  // Mettre à jour un patient (Admin seulement)
  updatePatient(userId: string, patientData: Partial<Patient>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update/${userId}`, patientData);
  }

  // Supprimer un patient (Admin seulement)
  deletePatient(userId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete/${userId}`);
  }

  // ======================== PROFILE DU PATIENT CONNECTÉ ========================

  // Récupérer le profil du patient connecté
  getPatientProfile(): Observable<PatientProfileResponse> {
    return this.http.get<PatientProfileResponse>(`${this.apiUrl}/profile`);
  }

  // ======================== CONSULTATIONS DU PATIENT ========================

  // Récupérer l'historique des consultations du patient connecté
  getConsultationHistory(): Observable<ConsultationHistoryResponse> {
    return this.http.get<ConsultationHistoryResponse>(`${this.apiUrl}/consultations/history`);
  }

  // Récupérer les consultations à venir du patient connecté
  getUpcomingConsultations(): Observable<UpcomingConsultationsResponse> {
    return this.http.get<UpcomingConsultationsResponse>(`${this.apiUrl}/consultations/upcoming`);
  }

  // ======================== MÉTHODES UTILITAIRES ========================

  // Rechercher des patients (pour Admin - peut être implémenté côté backend)
  searchPatients(query: string): Observable<PatientResponse> {
    return this.http.get<PatientResponse>(`${this.apiUrl}/patients?search=${encodeURIComponent(query)}`);
  }

  // Vérifier si l'utilisateur connecté est un patient
  isCurrentUserPatient(): Observable<boolean> {
    return new Observable(observer => {
      this.getPatientProfile().subscribe({
        next: (response) => observer.next(!!response.patient),
        error: () => observer.next(false)
      });
    });
  }
}
