import { Component, OnInit } from '@angular/core';
import { ConsultationService } from '../../../core/services/consultation.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-doctor-consultations',
  template: `
    <div class="doctor-consultations-container">
      <h1>Mes consultations</h1>
      
      <div class="actions">
        <button mat-raised-button color="primary" (click)="openNewConsultation()">
          <mat-icon>add</mat-icon>
          Nouvelle consultation
        </button>
      </div>

      <app-consultation-list
        [filterByDoctor]="true"
        [doctorId]="currentDoctorId"
      ></app-consultation-list>
    </div>
  `,
  styles: [`
    .doctor-consultations-container {
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
export class DoctorConsultationsComponent implements OnInit {
  currentDoctorId: string = '';

  constructor(
    private consultationService: ConsultationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Récupérer l'ID du médecin connecté
    const user = this.authService.getCurrentUser();
    if (user && user.role === 'doctor') {
      this.currentDoctorId = user.id;
    }
  }

  openNewConsultation(): void {
    // Utiliser le composant de dialogue partagé pour créer une nouvelle consultation
    this.consultationService.openConsultationDialog({
      doctorId: this.currentDoctorId,
      mode: 'create'
    });
  }
} 