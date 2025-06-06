import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Doctor {
  _id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  speciality: string;
  licenseNumber: string;
  phoneNumber: string;
  availability: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
  education: {
    degree: string;
    institution: string;
    year: number;
  }[];
  experience: {
    position: string;
    institution: string;
    startYear: number;
    endYear?: number;
  }[];
  languages: string[];
  consultationFee?: number;
}

export interface DoctorSchedule {
  doctorId: string;
  date: string;
  slots: {
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    appointmentId?: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private apiUrl = `${environment.apiUrl}/doctors`;

  constructor(private http: HttpClient) { }

  // Récupérer tous les médecins
  getDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(this.apiUrl);
  }

  // Récupérer un médecin par son ID
  getDoctor(id: string): Observable<Doctor> {
    return this.http.get<Doctor>(`${this.apiUrl}/${id}`);
  }

  // Créer un nouveau médecin
  createDoctor(doctorData: Partial<Doctor>): Observable<Doctor> {
    return this.http.post<Doctor>(this.apiUrl, doctorData);
  }

  // Mettre à jour un médecin
  updateDoctor(id: string, doctorData: Partial<Doctor>): Observable<Doctor> {
    return this.http.put<Doctor>(`${this.apiUrl}/${id}`, doctorData);
  }

  // Supprimer un médecin
  deleteDoctor(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Récupérer l'emploi du temps d'un médecin
  getDoctorSchedule(doctorId: string, startDate: string, endDate: string): Observable<DoctorSchedule[]> {
    return this.http.get<DoctorSchedule[]>(
      `${this.apiUrl}/${doctorId}/schedule?startDate=${startDate}&endDate=${endDate}`
    );
  }

  // Mettre à jour la disponibilité d'un médecin
  updateAvailability(doctorId: string, availability: Doctor['availability']): Observable<Doctor> {
    return this.http.put<Doctor>(`${this.apiUrl}/${doctorId}/availability`, { availability });
  }

  // Récupérer les patients d'un médecin
  getDoctorPatients(doctorId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${doctorId}/patients`);
  }

  // Récupérer les rendez-vous d'un médecin
  getDoctorAppointments(doctorId: string, startDate?: string, endDate?: string): Observable<any[]> {
    let url = `${this.apiUrl}/${doctorId}/appointments`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return this.http.get<any[]>(url);
  }

  // Rechercher des médecins par spécialité
  searchDoctorsBySpeciality(speciality: string): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.apiUrl}/search?speciality=${speciality}`);
  }

  // Récupérer les statistiques d'un médecin
  getDoctorStats(doctorId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${doctorId}/stats`);
  }

  // Mettre à jour les tarifs de consultation
  updateConsultationFee(doctorId: string, fee: number): Observable<Doctor> {
    return this.http.put<Doctor>(`${this.apiUrl}/${doctorId}/fee`, { consultationFee: fee });
  }
} 