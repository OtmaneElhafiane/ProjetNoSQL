import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DoctorService, Doctor } from '../doctor.service';

@Component({
  selector: 'app-doctor-detail',
  template: `
    <div class="container">
      <h2>{{ isNewDoctor ? 'Nouveau Médecin' : 'Détails du Médecin' }}</h2>
      <form [formGroup]="doctorForm" (ngSubmit)="onSubmit()">
        <div class="mb-3">
          <label for="lastName" class="form-label">Nom</label>
          <input type="text" class="form-control" id="lastName" formControlName="lastName">
          <div *ngIf="doctorForm.get('lastName')?.invalid && doctorForm.get('lastName')?.touched" class="text-danger">
            Le nom est requis
          </div>
        </div>
        <div class="mb-3">
          <label for="firstName" class="form-label">Prénom</label>
          <input type="text" class="form-control" id="firstName" formControlName="firstName">
          <div *ngIf="doctorForm.get('firstName')?.invalid && doctorForm.get('firstName')?.touched" class="text-danger">
            Le prénom est requis
          </div>
        </div>
        <div class="mb-3">
          <label for="speciality" class="form-label">Spécialité</label>
          <input type="text" class="form-control" id="speciality" formControlName="speciality">
          <div *ngIf="doctorForm.get('speciality')?.invalid && doctorForm.get('speciality')?.touched" class="text-danger">
            La spécialité est requise
          </div>
        </div>
        <div class="mb-3">
          <label for="phone" class="form-label">Téléphone</label>
          <input type="tel" class="form-control" id="phone" formControlName="phone">
        </div>
        <div class="mb-3">
          <label for="email" class="form-label">Email</label>
          <input type="email" class="form-control" id="email" formControlName="email">
          <div *ngIf="doctorForm.get('email')?.invalid && doctorForm.get('email')?.touched" class="text-danger">
            Un email valide est requis
          </div>
        </div>
        <button type="submit" class="btn btn-primary me-2" [disabled]="!doctorForm.valid">
          {{ isNewDoctor ? 'Créer' : 'Mettre à jour' }}
        </button>
        <button type="button" class="btn btn-secondary" (click)="goBack()">Retour</button>
      </form>
    </div>
  `,
  styles: []
})
export class DoctorDetailComponent implements OnInit {
  doctorForm: FormGroup;
  isNewDoctor: boolean = true;
  doctorId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private doctorService: DoctorService
  ) {
    this.doctorForm = this.fb.group({
      lastName: ['', Validators.required],
      firstName: ['', Validators.required],
      speciality: ['', Validators.required],
      phone: [''],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.doctorId = this.route.snapshot.paramMap.get('id');
    this.isNewDoctor = !this.doctorId || this.doctorId === 'new';

    if (!this.isNewDoctor && this.doctorId) {
      this.loadDoctorData(this.doctorId);
    }
  }

  loadDoctorData(id: string): void {
    this.doctorService.getDoctor(id).subscribe({
      next: (doctor) => {
        this.doctorForm.patchValue(doctor);
      },
      error: (error) => {
        console.error('Error loading doctor:', error);
        // TODO: Ajouter un message d'erreur pour l'utilisateur
        this.goBack();
      }
    });
  }

  onSubmit(): void {
    if (this.doctorForm.valid) {
      const doctorData: Doctor = this.doctorForm.value;
      
      if (this.isNewDoctor) {
        this.doctorService.createDoctor(doctorData).subscribe({
          next: () => {
            // TODO: Ajouter un message de succès
            this.goBack();
          },
          error: (error) => {
            console.error('Error creating doctor:', error);
            // TODO: Ajouter un message d'erreur pour l'utilisateur
          }
        });
      } else if (this.doctorId) {
        this.doctorService.updateDoctor(this.doctorId, doctorData).subscribe({
          next: () => {
            // TODO: Ajouter un message de succès
            this.goBack();
          },
          error: (error) => {
            console.error('Error updating doctor:', error);
            // TODO: Ajouter un message d'erreur pour l'utilisateur
          }
        });
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/doctors']);
  }
} 