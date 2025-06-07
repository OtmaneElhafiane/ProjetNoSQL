import { Component, OnInit } from '@angular/core';
import { ConsultationService } from '../../../core/services/consultation.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-patient-consultations',
  template: `
    <div class="patient-consultations-container">
      <h1>Mes consultations</h1>
      
      <div class="actions">
        <button mat-raised-button color="primary" (click)="openNewConsultation()">
          <mat-icon>add</mat-icon>
          Prendre rendez-vous
        </button>
      </div>

      <app-consultation-list
        [filterByPatient]="true"
        [patientId]="currentPatientId"
      ></app-consultation-list>
    </div>
  `,
  styles: [`
    .patient-consultations-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;

      h1 {
        margin-bottom: 20px;
        color: #333;
      }

      .actions {
        margin-bottom: 20px;
        
        button {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }
    }
  `]
})
export class PatientConsultationsComponent implements OnInit {
  currentPatientId: string = '';

  constructor(
    private consultationService: ConsultationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.role === 'patient') {
      this.currentPatientId = user.id;
    }
  }

  openNewConsultation(): void {
    this.consultationService.openConsultationDialog({
      patientId: this.currentPatientId,
      mode: 'create'
    });
  }
} 