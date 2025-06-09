import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Doctor {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  speciality: string;
  phoneNumber: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  availability?: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  education?: string[];
  experience?: string[];
  languages?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private apiUrl = 'http://localhost:5000/api/doctors';

  constructor(private http: HttpClient) {}

  // Récupérer tous les médecins
  getDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(this.apiUrl);
  }

  // Récupérer un médecin par son ID
  getDoctor(id: string): Observable<Doctor> {
    return this.http.get<Doctor>(`${this.apiUrl}/${id}`);
  }

  // Créer un nouveau médecin
  createDoctor(doctor: Doctor): Observable<Doctor> {
    return this.http.post<Doctor>(this.apiUrl, doctor);
  }

  // Mettre à jour un médecin
  updateDoctor(id: string, doctor: Doctor): Observable<Doctor> {
    return this.http.put<Doctor>(`${this.apiUrl}/${id}`, doctor);
  }

  // Supprimer un médecin
  deleteDoctor(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Récupérer les rendez-vous d'un médecin
  getDoctorAppointments(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/appointments`);
  }

  // Récupérer les patients d'un médecin
  getDoctorPatients(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/patients`);
  }

  // Récupérer la disponibilité d'un médecin
  getDoctorAvailability(id: string, date: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/availability`, {
      params: { date }
    });
  }

  // Mettre à jour la disponibilité d'un médecin
  updateDoctorAvailability(id: string, availability: any[]): Observable<Doctor> {
    return this.http.put<Doctor>(`${this.apiUrl}/${id}/availability`, { availability });
  }
} 