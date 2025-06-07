import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Appointment {
  _id?: string;
  patientId: string;
  doctorId: string;
  date: Date;
  time: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  type: string;
  reason?: string;
  notes?: string;
  patientName?: string;
  doctorName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = 'http://localhost:3000/api/appointments';

  constructor(private http: HttpClient) {}

  // Récupérer tous les rendez-vous
  getAppointments(params?: any): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.apiUrl, { params });
  }

  // Récupérer un rendez-vous par son ID
  getAppointment(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.apiUrl}/${id}`);
  }

  // Créer un nouveau rendez-vous
  createAppointment(appointment: Appointment): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, appointment);
  }

  // Mettre à jour un rendez-vous
  updateAppointment(id: string, appointment: Appointment): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.apiUrl}/${id}`, appointment);
  }

  // Supprimer un rendez-vous
  deleteAppointment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Annuler un rendez-vous
  cancelAppointment(id: string, reason: string): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.apiUrl}/${id}/cancel`, { reason });
  }

  // Confirmer un rendez-vous
  confirmAppointment(id: string): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.apiUrl}/${id}/confirm`, {});
  }

  // Vérifier la disponibilité
  checkAvailability(doctorId: string, date: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/availability/${doctorId}`, {
      params: { date }
    });
  }

  // Récupérer les créneaux disponibles
  getAvailableSlots(doctorId: string, date: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/available-slots/${doctorId}`, {
      params: { date }
    });
  }
} 