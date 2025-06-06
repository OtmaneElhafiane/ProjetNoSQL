import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConsultationService, Consultation } from '../../../core/services/consultation.service';

@Component({
  selector: 'app-consultation-form',
  template: `
    <div class="consultation-form-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Nouvelle Consultation</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="consultationForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline">
              <mat-label>Patient ID</mat-label>
              <input matInput formControlName="patient_id" required>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Date</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="date" required>
              <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Symptômes</mat-label>
              <textarea matInput formControlName="symptoms" required rows="3"></textarea>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Diagnostic</mat-label>
              <textarea matInput formControlName="diagnosis" required rows="3"></textarea>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Traitement</mat-label>
              <textarea matInput formControlName="treatment" required rows="3"></textarea>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Notes</mat-label>
              <textarea matInput formControlName="notes" rows="2"></textarea>
            </mat-form-field>
            
            <div class="form-actions">
              <button mat-button type="button" (click)="resetForm()">Annuler</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="consultationForm.invalid || loading">
                {{ loading ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .consultation-form-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 16px;
    }
  `]
})
export class ConsultationFormComponent implements OnInit {
  consultationForm: FormGroup;
  loading = false;

  constructor(
    private formBuilder: FormBuilder,
    private consultationService: ConsultationService,
    private snackBar: MatSnackBar
  ) {
    this.consultationForm = this.formBuilder.group({
      patient_id: ['', Validators.required],
      date: ['', Validators.required],
      symptoms: ['', Validators.required],
      diagnosis: ['', Validators.required],
      treatment: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {}

  onSubmit() {
    if (this.consultationForm.invalid) {
      return;
    }

    this.loading = true;
    const consultationData: Consultation = {
      ...this.consultationForm.value,
      date: this.consultationForm.get('date')?.value.toISOString()
    };

    this.consultationService.createConsultation(consultationData).subscribe({
      next: () => {
        this.snackBar.open('Consultation enregistrée avec succès', 'Fermer', {
          duration: 3000
        });
        this.resetForm();
        this.loading = false;
      },
      error: (error) => {
        this.snackBar.open(error.error.message || 'Une erreur est survenue', 'Fermer', {
          duration: 3000
        });
        this.loading = false;
      }
    });
  }

  resetForm() {
    this.consultationForm.reset();
  }
} 