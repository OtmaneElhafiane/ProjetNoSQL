import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

interface DoctorDialogData {
  mode: 'add' | 'edit';
  doctor?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    speciality: string;
  };
}

@Component({
  selector: 'app-doctor-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'add' ? 'Ajouter un médecin' : 'Modifier le médecin' }}</h2>
    <form [formGroup]="doctorForm" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <div class="form-fields">
          <mat-form-field appearance="outline">
            <mat-label>Nom complet</mat-label>
            <input matInput formControlName="name" required>
            <mat-error *ngIf="doctorForm.get('name')?.hasError('required')">
              Le nom est requis
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" required type="email">
            <mat-error *ngIf="doctorForm.get('email')?.hasError('required')">
              L'email est requis
            </mat-error>
            <mat-error *ngIf="doctorForm.get('email')?.hasError('email')">
              Format d'email invalide
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Téléphone</mat-label>
            <input matInput formControlName="phone" required>
            <mat-error *ngIf="doctorForm.get('phone')?.hasError('required')">
              Le téléphone est requis
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Spécialité</mat-label>
            <mat-select formControlName="speciality" required>
              <mat-option value="Généraliste">Généraliste</mat-option>
              <mat-option value="Cardiologue">Cardiologue</mat-option>
              <mat-option value="Dermatologue">Dermatologue</mat-option>
              <mat-option value="Pédiatre">Pédiatre</mat-option>
              <mat-option value="Psychiatre">Psychiatre</mat-option>
              <mat-option value="Gynécologue">Gynécologue</mat-option>
            </mat-select>
            <mat-error *ngIf="doctorForm.get('speciality')?.hasError('required')">
              La spécialité est requise
            </mat-error>
          </mat-form-field>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onCancel()">Annuler</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="!doctorForm.valid">
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
export class DoctorDialogComponent {
  doctorForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<DoctorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DoctorDialogData
  ) {
    this.doctorForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      speciality: ['', Validators.required]
    });

    if (data.mode === 'edit' && data.doctor) {
      this.doctorForm.patchValue(data.doctor);
    }
  }

  onSubmit(): void {
    if (this.doctorForm.valid) {
      this.dialogRef.close(this.doctorForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
} 