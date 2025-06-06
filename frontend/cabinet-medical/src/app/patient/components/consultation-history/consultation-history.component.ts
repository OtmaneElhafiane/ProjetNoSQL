import { Component, OnInit } from '@angular/core';
import { ConsultationService, Consultation } from '../../../core/services/consultation.service';

@Component({
  selector: 'app-consultation-history',
  template: `
    <div class="history-container">
      <h2>Historique des Consultations</h2>
      
      <div class="consultations-list" *ngIf="consultations.length > 0; else noConsultations">
        <mat-accordion>
          <mat-expansion-panel *ngFor="let consultation of consultations">
            <mat-expansion-panel-header>
              <mat-panel-title>
                {{ consultation.date | date:'dd/MM/yyyy' }}
              </mat-panel-title>
              <mat-panel-description>
                Dr. {{ consultation.doctor?.name }}
              </mat-panel-description>
            </mat-expansion-panel-header>
            
            <div class="consultation-details">
              <div class="detail-section">
                <h3>Symptômes</h3>
                <p>{{ consultation.symptoms }}</p>
              </div>
              
              <div class="detail-section">
                <h3>Diagnostic</h3>
                <p>{{ consultation.diagnosis }}</p>
              </div>
              
              <div class="detail-section">
                <h3>Traitement</h3>
                <p>{{ consultation.treatment }}</p>
              </div>
              
              <div class="detail-section" *ngIf="consultation.notes">
                <h3>Notes</h3>
                <p>{{ consultation.notes }}</p>
              </div>
              
              <div class="doctor-info">
                <h3>Médecin</h3>
                <p>Dr. {{ consultation.doctor?.name }}</p>
                <p>Spécialité: {{ consultation.doctor?.speciality }}</p>
              </div>
            </div>
          </mat-expansion-panel>
        </mat-accordion>
      </div>
      
      <ng-template #noConsultations>
        <div class="no-consultations">
          <mat-icon>info</mat-icon>
          <p>Aucune consultation trouvée</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .history-container {
      padding: 20px;
      max-width: 1000px;
      margin: 0 auto;
    }
    
    h2 {
      margin-bottom: 20px;
      color: #333;
    }
    
    .consultations-list {
      margin-top: 20px;
    }
    
    .consultation-details {
      padding: 16px;
    }
    
    .detail-section {
      margin-bottom: 16px;
      
      h3 {
        color: #666;
        margin-bottom: 8px;
      }
      
      p {
        margin: 0;
        line-height: 1.5;
      }
    }
    
    .doctor-info {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #eee;
    }
    
    .no-consultations {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      color: #666;
      
      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
      }
    }
  `]
})
export class ConsultationHistoryComponent implements OnInit {
  consultations: Consultation[] = [];
  loading = true;
  error = '';

  constructor(private consultationService: ConsultationService) {}

  ngOnInit(): void {
    this.loadConsultations();
  }

  private loadConsultations() {
    this.consultationService.getPatientConsultations().subscribe({
      next: (consultations) => {
        this.consultations = consultations.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.loading = false;
      },
      error: (error) => {
        this.error = error.error.message || 'Une erreur est survenue';
        this.loading = false;
      }
    });
  }
} 