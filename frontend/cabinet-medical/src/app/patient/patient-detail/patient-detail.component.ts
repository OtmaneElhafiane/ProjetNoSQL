import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PatientService, Patient } from '../patient.service';

@Component({
  selector: 'app-patient-detail',
  template: `
    <div class="container">
      <h2>{{ isNewPatient ? 'Nouveau Patient' : 'Détails du Patient' }}</h2>
      <form [formGroup]="patientForm" (ngSubmit)="onSubmit()">
        <div class="mb-3">
          <label for="lastName" class="form-label">Nom</label>
          <input type="text" class="form-control" id="lastName" formControlName="lastName">
          <div *ngIf="patientForm.get('lastName')?.invalid && patientForm.get('lastName')?.touched" class="text-danger">
            Le nom est requis
          </div>
        </div>
        <div class="mb-3">
          <label for="firstName" class="form-label">Prénom</label>
          <input type="text" class="form-control" id="firstName" formControlName="firstName">
          <div *ngIf="patientForm.get('firstName')?.invalid && patientForm.get('firstName')?.touched" class="text-danger">
            Le prénom est requis
          </div>
        </div>
        <div class="mb-3">
          <label for="dateOfBirth" class="form-label">Date de naissance</label>
          <input type="date" class="form-control" id="dateOfBirth" formControlName="dateOfBirth">
          <div *ngIf="patientForm.get('dateOfBirth')?.invalid && patientForm.get('dateOfBirth')?.touched" class="text-danger">
            La date de naissance est requise
          </div>
        </div>
        <div class="mb-3">
          <label for="address" class="form-label">Adresse</label>
          <textarea class="form-control" id="address" formControlName="address" rows="3"></textarea>
        </div>
        <div class="mb-3">
          <label for="phone" class="form-label">Téléphone</label>
          <input type="tel" class="form-control" id="phone" formControlName="phone">
        </div>
        <div class="mb-3">
          <label for="email" class="form-label">Email</label>
          <input type="email" class="form-control" id="email" formControlName="email">
          <div *ngIf="patientForm.get('email')?.errors?.['email'] && patientForm.get('email')?.touched" class="text-danger">
            L'email n'est pas valide
          </div>
        </div>
        <button type="submit" class="btn btn-primary me-2" [disabled]="!patientForm.valid">
          {{ isNewPatient ? 'Créer' : 'Mettre à jour' }}
        </button>
        <button type="button" class="btn btn-secondary" (click)="goBack()">Retour</button>
      </form>
    </div>
  `,
  styles: []
})
export class PatientDetailComponent implements OnInit {
  patientForm: FormGroup;
  isNewPatient: boolean = true;
  patientId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService
  ) {
    this.patientForm = this.fb.group({
      lastName: ['', Validators.required],
      firstName: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      address: [''],
      phone: [''],
      email: ['', Validators.email]
    });
  }

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id');
    this.isNewPatient = !this.patientId || this.patientId === 'new';

    if (!this.isNewPatient && this.patientId) {
      this.loadPatientData(this.patientId);
    }
  }

  loadPatientData(id: string): void {
    this.patientService.getPatient(id).subscribe({
      next: (patient) => {
        this.patientForm.patchValue(patient);
      },
      error: (error) => {
        console.error('Error loading patient:', error);
        // TODO: Ajouter un message d'erreur pour l'utilisateur
        this.goBack();
      }
    });
  }

  onSubmit(): void {
    if (this.patientForm.valid) {
      const patientData: Patient = this.patientForm.value;
      
      if (this.isNewPatient) {
        this.patientService.createPatient(patientData).subscribe({
          next: () => {
            // TODO: Ajouter un message de succès
            this.goBack();
          },
          error: (error) => {
            console.error('Error creating patient:', error);
            // TODO: Ajouter un message d'erreur pour l'utilisateur
          }
        });
      } else if (this.patientId) {
        this.patientService.updatePatient(this.patientId, patientData).subscribe({
          next: () => {
            // TODO: Ajouter un message de succès
            this.goBack();
          },
          error: (error) => {
            console.error('Error updating patient:', error);
            // TODO: Ajouter un message d'erreur pour l'utilisateur
          }
        });
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/patients']);
  }
} 