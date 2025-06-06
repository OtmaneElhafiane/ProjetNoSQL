import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

interface PatientDialogData {
  mode: 'add' | 'edit';
  patient?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    birth_date: string;
    address: string;
  };
}

@Component({
  selector: 'app-patient-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'add' ? 'Ajouter un patient' : 'Modifier le patient' }}</h2>
    <form [formGroup]="patientForm" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <div class="form-fields">
          <mat-form-field appearance="outline">
            <mat-label>Nom complet</mat-label>
            <input matInput formControlName="name" required>
            <mat-error *ngIf="patientForm.get('name')?.hasError('required')">
              Le nom est requis
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" required type="email">
            <mat-error *ngIf="patientForm.get('email')?.hasError('required')">
              L'email est requis
            </mat-error>
            <mat-error *ngIf="patientForm.get('email')?.hasError('email')">
              Format d'email invalide
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Téléphone</mat-label>
            <input matInput formControlName="phone" required>
            <mat-error *ngIf="patientForm.get('phone')?.hasError('required')">
              Le téléphone est requis
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Date de naissance</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="birth_date" required>
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-error *ngIf="patientForm.get('birth_date')?.hasError('required')">
              La date de naissance est requise
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Adresse</mat-label>
            <textarea matInput formControlName="address" required rows="3"></textarea>
            <mat-error *ngIf="patientForm.get('address')?.hasError('required')">
              L'adresse est requise
            </mat-error>
          </mat-form-field>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onCancel()">Annuler</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="!patientForm.valid">
          {{ data.mode === 'add' ? 'Ajouter' : 'Modifier' }}
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
export class PatientDialogComponent {
  patientForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<PatientDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PatientDialogData
  ) {
    this.patientForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      birth_date: ['', Validators.required],
      address: ['', Validators.required]
    });

    if (data.mode === 'edit' && data.patient) {
      this.patientForm.patchValue(data.patient);
    }
  }

  onSubmit(): void {
    if (this.patientForm.valid) {
      this.dialogRef.close(this.patientForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
} 