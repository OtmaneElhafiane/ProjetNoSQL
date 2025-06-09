import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Interface pour les données utilisateur de base
export interface User {
  _id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
  last_login?: string;
}

// Interface pour les données du docteur
export interface Doctor {
  _id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  speciality: string;
  schedule: {
    [key: string]: {
      start_time: string;
      end_time: string;
      is_available: boolean;
    }[];
  };
}

// Interface pour les informations complètes du docteur (user + doctor)
export interface DoctorInfo {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  last_login?: string;
  doctor_id?: string;
  name?: string;
  phone?: string;
  speciality?: string;
  schedule?: {
    [key: string]: {
      start_time: string;
      end_time: string;
    }[];
  };
}

// Interface pour la création d'un docteur
export interface CreateDoctorRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  speciality: string;
  phone?: string;
  schedule?: {
    [key: string]: {
      start_time: string;
      end_time: string;
    }[];
  };
}

// Interface pour la mise à jour d'un docteur
export interface UpdateDoctorRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  phone?: string;
  speciality?: string;
  schedule?: {
    [key: string]: {
      start_time: string;
      end_time: string;
      is_available: boolean;
    }[];
  };
}

// Interface pour les consultations
export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  birth_date: string;
  address: string;
}

export interface Consultation {
  consultation_id: string;
  date: string;
  motif: string;
  diagnostic: string;
  traitement: string;
  notes: string;
  status: 'pending' | 'completed' | 'cancelled' | 'rescheduled';
  created_at: string;
  patient: Patient;
}

// Interface pour les réponses API
export interface DoctorsListResponse {
  doctors: DoctorInfo[];
  total: number;
}

export interface DoctorResponse {
  last_login?: string;
  created_at: string;
  doctor?: Doctor;
}

export interface ConsultationHistoryResponse {
  consultations: Consultation[];
  total: number;
}

export interface PatientHistoryResponse {
  patient: Patient | null;
  consultations: Omit<Consultation, 'patient'>[];
  total: number;
}

export interface UpcomingConsultationsResponse {
  upcoming_consultations: Consultation[];
  total: number;
}

export interface ApiResponse<T = any> {
  message?: string;
  error?: string;
  doctor?: T;
  user?: T;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private apiUrl = `${environment.apiUrl}/doctors`;

  constructor(private http: HttpClient) {}

  // ======================== GESTION DES DOCTEURS (ADMIN SEULEMENT) ========================

  /**
   * Récupérer tous les docteurs (Admin seulement)
   */
  getAllDoctors(): Observable<DoctorsListResponse> {
    return this.http.get<DoctorsListResponse>(`${this.apiUrl}/doctors`);
  }

  /**
   * Créer un nouveau docteur (Admin seulement)
   */
  createDoctor(doctorData: CreateDoctorRequest): Observable<ApiResponse<Doctor>> {
    return this.http.post<ApiResponse<Doctor>>(`${this.apiUrl}/create`, doctorData);
  }

  /**
   * Récupérer un docteur par son user_id (Admin seulement)
   */
  getDoctorById(userId: string): Observable<DoctorResponse> {
    return this.http.get<DoctorResponse>(`${this.apiUrl}/doctorById/${userId}`);
  }

  /**
   * Mettre à jour un docteur (Admin seulement)
   */
  updateDoctor(userId: string, doctorData: UpdateDoctorRequest): Observable<ApiResponse<Doctor>> {
    return this.http.put<ApiResponse<Doctor>>(`${this.apiUrl}/update/${userId}`, doctorData);
  }

  /**
   * Supprimer un docteur (Admin seulement)
   */
  deleteDoctor(userId: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/delete/${userId}`);
  }

  // ======================== PROFILE DU DOCTEUR CONNECTÉ ========================

  /**
   * Récupérer le profil du docteur connecté
   */
  getDoctorProfile(): Observable<DoctorResponse> {
    return this.http.get<DoctorResponse>(`${this.apiUrl}/profile`);
  }

  /**
   * Mettre à jour le profil du docteur connecté
   */
  updateDoctorProfile(profileData: UpdateDoctorRequest): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/profile`, profileData);
  }

  // ======================== CONSULTATIONS ========================

  /**
   * Récupérer l'historique de toutes les consultations du docteur
   */
  getConsultationHistory(): Observable<ConsultationHistoryResponse> {
    return this.http.get<ConsultationHistoryResponse>(`${this.apiUrl}/consultations/history`);
  }

  /**
   * Récupérer les consultations à venir
   */
  getUpcomingConsultations(): Observable<UpcomingConsultationsResponse> {
    return this.http.get<UpcomingConsultationsResponse>(`${this.apiUrl}/consultations/upcoming`);
  }

  /**
   * Mettre à jour le statut d'une consultation
   */
  updateConsultationStatus(consultationId: string, status: 'pending' | 'completed' | 'cancelled' ): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/consultations/${consultationId}/status`, { status });
  }

  /**
   * Mettre à jour une consultation complète
   */
  updateConsultation(consultationId: string, consultationData: {
    symptoms: string;
    diagnosis: string;
    treatment: string;
    notes?: string;
  }): Observable<any> {
    return this.http.put(`${this.apiUrl}/consultations/${consultationId}`, consultationData);
  }

  /**
   * Récupérer l'historique des consultations d'un patient spécifique
   */
  getPatientHistory(patientId: string): Observable<PatientHistoryResponse> {
    return this.http.get<PatientHistoryResponse>(`${this.apiUrl}/patients/${patientId}/history`);
  }

  // ======================== MÉTHODES UTILITAIRES ========================

  /**
   * Vérifier si l'utilisateur actuel est un docteur
   */
  isDoctor(): boolean {
    // Cette méthode devrait être implémentée selon votre système d'authentification
    const userRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
    return userRole === 'doctor';
  }

  /**
   * Vérifier si l'utilisateur actuel est un admin
   */
  isAdmin(): boolean {
    // Cette méthode devrait être implémentée selon votre système d'authentification
    const userRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
    return userRole === 'admin';
  }

  /**
   * Formater les horaires pour l'affichage
   */
  formatSchedule(schedule: Doctor['schedule']): string {
    if (!schedule || Object.keys(schedule).length === 0) {
      return 'Horaires non définis';
    }

    const dayNames: { [key: string]: string } = {
      'monday': 'Lundi',
      'tuesday': 'Mardi',
      'wednesday': 'Mercredi',
      'thursday': 'Jeudi',
      'friday': 'Vendredi',
      'saturday': 'Samedi',
      'sunday': 'Dimanche'
    };

    return Object.entries(schedule)
      .map(([day, slots]) => {
        const dayName = dayNames[day.toLowerCase()] || day;
        const availableSlots = slots.filter(slot => slot.is_available);
        if (availableSlots.length === 0) {
          return `${dayName}: Fermé`;
        }
        const timeRanges = availableSlots.map(slot => `${slot.start_time}-${slot.end_time}`);
        return `${dayName}: ${timeRanges.join(', ')}`;
      })
      .join('\n');
  }

 
}