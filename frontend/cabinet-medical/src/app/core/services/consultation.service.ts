import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConsultationDialogComponent } from '../../shared/components/consultation-dialog/consultation-dialog.component';

export interface Prescription {
  medicament: string;
  dosage: string;
  duree: string;
  instructions: string;
}

export interface Examen {
  type: string;
  description: string;
  resultats?: string;
  date?: string;
}

export interface Consultation {
  _id: string;
  patientId: string;
  doctorId: string;
  date: string;
  motif: string;
  diagnostic: string;
  traitement: string;
  notes?: string;
  prescriptions?: Prescription[];
  examens?: Examen[];
  createdAt: string;
  updatedAt: string;
  patientName?: string;
  doctorName?: string;
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
  private apiUrl = `${environment.apiUrl}/consultations`;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog
  ) {}

  getConsultations(filters?: {
    patientId?: string;
    doctorId?: string;
    startDate?: string;
    endDate?: string;
  }): Observable<Consultation[]> {
    let url = this.apiUrl;
    if (filters) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }
    return this.http.get<Consultation[]>(url);
  }

  getConsultation(id: string): Observable<Consultation> {
    return this.http.get<Consultation>(`${this.apiUrl}/${id}`);
  }

  createConsultation(consultationData: Partial<Consultation>): Observable<Consultation> {
    return this.http.post<Consultation>(this.apiUrl, consultationData);
  }

  updateConsultation(id: string, consultationData: Partial<Consultation>): Observable<Consultation> {
    return this.http.put<Consultation>(`${this.apiUrl}/${id}`, consultationData);
  }

  deleteConsultation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getPatientConsultations(patientId: string): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  getDoctorConsultations(doctorId: string): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(`${this.apiUrl}/doctor/${doctorId}`);
  }

  addPrescription(consultationId: string, prescription: Prescription): Observable<Consultation> {
    return this.http.post<Consultation>(
      `${this.apiUrl}/${consultationId}/prescriptions`,
      prescription
    );
  }

  addExamen(consultationId: string, examen: Examen): Observable<Consultation> {
    return this.http.post<Consultation>(
      `${this.apiUrl}/${consultationId}/examens`,
      examen
    );
  }

  updateExamenResults(consultationId: string, examenId: string, resultats: string): Observable<Consultation> {
    return this.http.put<Consultation>(
      `${this.apiUrl}/${consultationId}/examens/${examenId}`,
      { resultats }
    );
  }

  generateReport(consultationId: string): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/${consultationId}/report`,
      { responseType: 'blob' }
    );
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