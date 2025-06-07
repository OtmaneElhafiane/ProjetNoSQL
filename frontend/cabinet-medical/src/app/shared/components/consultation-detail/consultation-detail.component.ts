import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Consultation } from '../../../core/services/consultation.service';

@Component({
  selector: 'app-consultation-detail',
  template: `
    <h2 mat-dialog-title>Détails de la consultation</h2>
    
    <mat-dialog-content>
      <div class="consultation-details">
        <div class="info-section">
          <h3>Informations générales</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Date :</span>
              <span class="value">{{ consultation.date | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Patient :</span>
              <span class="value">{{ consultation.patient.name }}</span>
            </div>
            <div class="info-item">
              <span class="label">Médecin :</span>
              <span class="value">{{ consultation.doctor.name }}</span>
            </div>
          </div>
        </div>

        <div class="consultation-section">
          <h3>Motif de la consultation</h3>
          <p class="content">{{ consultation.motif }}</p>
        </div>

        <div class="consultation-section">
          <h3>Diagnostic</h3>
          <p class="content">{{ consultation.diagnostic }}</p>
        </div>

        <div class="consultation-section">
          <h3>Traitement prescrit</h3>
          <p class="content">{{ consultation.traitement }}</p>
        </div>

        <div class="consultation-section" *ngIf="consultation.notes">
          <h3>Notes additionnelles</h3>
          <p class="content">{{ consultation.notes }}</p>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onClose()">Fermer</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .consultation-details {
      padding: 16px;
    }

    .info-section {
      margin-bottom: 24px;
    }

    h3 {
      color: #2196f3;
      margin-bottom: 12px;
      font-size: 1.1em;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .info-item {
      .label {
        font-weight: 500;
        color: #666;
      }

      .value {
        margin-left: 8px;
      }
    }

    .consultation-section {
      margin-bottom: 20px;

      .content {
        background-color: #f5f5f5;
        padding: 12px;
        border-radius: 4px;
        white-space: pre-line;
      }
    }
  `]
})
export class ConsultationDetailComponent {
  constructor(
    public dialogRef: MatDialogRef<ConsultationDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public consultation: Consultation
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
} 