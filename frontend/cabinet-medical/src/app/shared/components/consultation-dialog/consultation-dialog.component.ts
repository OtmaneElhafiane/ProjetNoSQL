import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Consultation } from '../../../core/services/consultation.service';

interface ConsultationDialogData {
  mode: 'add' | 'edit';
  consultation?: Consultation;
  patients?: Array<{ id: string; name: string }>;
  doctors?: Array<{ id: string; name: string }>;
}

@Component({
  selector: 'app-consultation-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'add' ? 'Nouvelle consultation' : 'Modifier la consultation' }}</h2>
    <form [formGroup]="consultationForm" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <div class="form-fields">
          <mat-form-field appearance="outline" *ngIf="data.mode === 'add'">
            <mat-label>Patient</mat-label>
            <mat-select formControlName="patient_id" required>
              <mat-option *ngFor="let patient of data.patients" [value]="patient.id">
                {{ patient.name }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="consultationForm.get('patient_id')?.hasError('required')">
              Le patient est requis
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" *ngIf="data.mode === 'add'">
            <mat-label>Médecin</mat-label>
            <mat-select formControlName="doctor_id" required>
              <mat-option *ngFor="let doctor of data.doctors" [value]="doctor.id">
                {{ doctor.name }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="consultationForm.get('doctor_id')?.hasError('required')">
              Le médecin est requis
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Date</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="date" required>
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-error *ngIf="consultationForm.get('date')?.hasError('required')">
              La date est requise
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Motif</mat-label>
            <textarea matInput formControlName="motif" required rows="2"></textarea>
            <mat-error *ngIf="consultationForm.get('motif')?.hasError('required')">
              Le motif est requis
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Diagnostic</mat-label>
            <textarea matInput formControlName="diagnostic" required rows="3"></textarea>
            <mat-error *ngIf="consultationForm.get('diagnostic')?.hasError('required')">
              Le diagnostic est requis
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Traitement</mat-label>
            <textarea matInput formControlName="traitement" required rows="3"></textarea>
            <mat-error *ngIf="consultationForm.get('traitement')?.hasError('required')">
              Le traitement est requis
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Notes additionnelles</mat-label>
            <textarea matInput formControlName="notes" rows="2"></textarea>
          </mat-form-field>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onCancel()">Annuler</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="!consultationForm.valid">
          {{ data.mode === 'add' ? 'Créer' : 'Modifier' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .form-fields {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 8px;
    }

    mat-form-field {
      width: 100%;
    }
  `]
})
export class ConsultationDialogComponent {
  consultationForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ConsultationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConsultationDialogData
  ) {
    this.consultationForm = this.fb.group({
      patient_id: ['', data.mode === 'add' ? Validators.required : null],
      doctor_id: ['', data.mode === 'add' ? Validators.required : null],
      date: ['', Validators.required],
      motif: ['', Validators.required],
      diagnostic: ['', Validators.required],
      traitement: ['', Validators.required],
      notes: ['']
    });

    if (data.mode === 'edit' && data.consultation) {
      this.consultationForm.patchValue({
        date: new Date(data.consultation.date),
        motif: data.consultation.motif,
        diagnostic: data.consultation.diagnostic,
        traitement: data.consultation.traitement,
        notes: data.consultation.notes
      });
    }
  }

  onSubmit(): void {
    if (this.consultationForm.valid) {
      const formValue = this.consultationForm.value;
      if (formValue.date instanceof Date) {
        formValue.date = formValue.date.toISOString();
      }
      this.dialogRef.close(formValue);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
} 