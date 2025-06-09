import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PatientService, Patient, CreatePatientData } from '../patient.service';

@Component({
  selector: 'app-patient-detail',
  template: `
    <div class="container">
      <h2>{{ isNewPatient ? 'Nouveau Patient' : 'Détails du Patient' }}</h2>
      <form [formGroup]="patientForm" (ngSubmit)="onSubmit()">
        <div class="mb-3">
          <label for="last_name" class="form-label">Nom</label>
          <input type="text" class="form-control" id="last_name" formControlName="last_name">
          <div *ngIf="patientForm.get('last_name')?.invalid && patientForm.get('last_name')?.touched" class="text-danger">
            Le nom est requis
          </div>
        </div>
        <div class="mb-3">
          <label for="first_name" class="form-label">Prénom</label>
          <input type="text" class="form-control" id="first_name" formControlName="first_name">
          <div *ngIf="patientForm.get('first_name')?.invalid && patientForm.get('first_name')?.touched" class="text-danger">
            Le prénom est requis
          </div>
        </div>
        <div class="mb-3">
          <label for="email" class="form-label">Email</label>
          <input type="email" class="form-control" id="email" formControlName="email">
          <div *ngIf="patientForm.get('email')?.errors?.['email'] && patientForm.get('email')?.touched" class="text-danger">
            L'email n'est pas valide
          </div>
          <div *ngIf="patientForm.get('email')?.errors?.['required'] && patientForm.get('email')?.touched" class="text-danger">
            L'email est requis
          </div>
        </div>
        <div class="mb-3" *ngIf="isNewPatient">
          <label for="password" class="form-label">Mot de passe</label>
          <input type="password" class="form-control" id="password" formControlName="password">
          <div *ngIf="patientForm.get('password')?.invalid && patientForm.get('password')?.touched" class="text-danger">
            Le mot de passe est requis
          </div>
        </div>
        <div class="mb-3">
          <label for="cin" class="form-label">CIN</label>
          <input type="text" class="form-control" id="cin" formControlName="cin">
          <div *ngIf="patientForm.get('cin')?.invalid && patientForm.get('cin')?.touched" class="text-danger">
            Le CIN est requis
          </div>
        </div>
        <div class="mb-3">
          <label for="phone" class="form-label">Téléphone</label>
          <input type="tel" class="form-control" id="phone" formControlName="phone">
          <div *ngIf="patientForm.get('phone')?.invalid && patientForm.get('phone')?.touched" class="text-danger">
            Le téléphone est requis
          </div>
        </div>
        <div class="mb-3">
          <label for="address" class="form-label">Adresse</label>
          <textarea class="form-control" id="address" formControlName="address" rows="3"></textarea>
          <div *ngIf="patientForm.get('address')?.invalid && patientForm.get('address')?.touched" class="text-danger">
            L'adresse est requise
          </div>
        </div>
        <div class="mb-3">
          <label for="type" class="form-label">Type</label>
          <select class="form-control" id="type" formControlName="type">
            <option value="">Sélectionner un type</option>
            <option value="patient">Patient</option>
            <option value="patient_vip">Patient VIP</option>
          </select>
          <div *ngIf="patientForm.get('type')?.invalid && patientForm.get('type')?.touched" class="text-danger">
            Le type est requis
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
      last_name: ['', Validators.required],
      first_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      cin: ['', Validators.required],
      phone: ['', Validators.required],
      address: ['', Validators.required],
      type: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id');
    this.isNewPatient = !this.patientId || this.patientId === 'new';

    // Configurer les validateurs selon le mode (nouveau/édition)
    this.setupFormValidators();

    if (!this.isNewPatient && this.patientId) {
      this.loadPatientData(this.patientId);
    }
  }

  private setupFormValidators(): void {
    if (this.isNewPatient) {
      // Pour un nouveau patient, le mot de passe est requis
      this.patientForm.get('password')?.setValidators([Validators.required]);
    } else {
      // Pour la modification, le mot de passe n'est pas requis
      this.patientForm.get('password')?.clearValidators();
    }
    this.patientForm.get('password')?.updateValueAndValidity();
  }

  loadPatientData(userId: string): void {
    this.patientService.getPatientById(userId).subscribe({
      next: (response) => {
        if (response.patient) {
          // Mapper les données de l'interface Patient vers le formulaire
          this.patientForm.patchValue({
            last_name: response.patient.last_name,
            first_name: response.patient.first_name,
            email: response.patient.email,
            cin: response.patient.cin,
            phone: response.patient.phone,
            address: response.patient.address,
            type: response.patient.type
          });
        }
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
      if (this.isNewPatient) {
        // Pour créer un nouveau patient, utiliser CreatePatientData
        const createPatientData: CreatePatientData = {
          email: this.patientForm.value.email,
          password: this.patientForm.value.password,
          first_name: this.patientForm.value.first_name,
          last_name: this.patientForm.value.last_name,
          cin: this.patientForm.value.cin,
          phone: this.patientForm.value.phone,
          type: this.patientForm.value.type,
          address: this.patientForm.value.address
        };

        this.patientService.createPatient(createPatientData).subscribe({
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
        // Pour la mise à jour, utiliser Partial<Patient>
        const updatePatientData: Partial<Patient> = {
          first_name: this.patientForm.value.first_name,
          last_name: this.patientForm.value.last_name,
          email: this.patientForm.value.email,
          cin: this.patientForm.value.cin,
          phone: this.patientForm.value.phone,
          address: this.patientForm.value.address,
          type: this.patientForm.value.type
        };

        this.patientService.updatePatient(this.patientId, updatePatientData).subscribe({
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
