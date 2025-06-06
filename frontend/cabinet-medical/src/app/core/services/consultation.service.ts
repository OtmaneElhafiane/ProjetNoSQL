import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConsultationDialogComponent } from '../../shared/components/consultation-dialog/consultation-dialog.component';

export interface Consultation {
  _id: string;
  patientId: string;
  doctorId: string;
  date: Date;
  reason: string;
  notes: string;
  prescription: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface ConsultationCreate {
  patient_id: string;
  doctor_id: string;
  date: string;
  motif: string;
  diagnostic: string;
  traitement: string;
  notes?: string;
}

export interface ConsultationStats {
  total_consultations: number;
  consultations_by_doctor: Array<{
    doctor_id: string;
    doctor_name: string;
    consultation_count: number;
  }>;
}

export interface ConsultationDialogData {
  consultation?: Consultation;
  doctorId?: string;
  patientId?: string;
  mode: 'create' | 'edit' | 'view';
}

@Injectable({
  providedIn: 'root'
})
export class ConsultationService {
  private apiUrl = `${environment.apiUrl}/consultation`;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog
  ) {}

  createConsultation(consultation: Partial<Consultation>): Observable<Consultation> {
    return this.http.post<Consultation>(`${this.apiUrl}/consultations`, consultation);
  }

  updateConsultation(id: string, consultation: Partial<Consultation>): Observable<Consultation> {
    return this.http.put<Consultation>(`${this.apiUrl}/consultations/${id}`, consultation);
  }

  getConsultation(id: string): Observable<Consultation> {
    return this.http.get<Consultation>(`${this.apiUrl}/consultations/${id}`);
  }

  getConsultations(params: any = {}): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(`${this.apiUrl}/consultations`, { params });
  }

  getStats(): Observable<ConsultationStats> {
    return this.http.get<ConsultationStats>(`${this.apiUrl}/consultations/stats`);
  }

  openConsultationDialog(data: ConsultationDialogData): void {
    this.dialog.open(ConsultationDialogComponent, {
      width: '600px',
      data
    });
  }
} 