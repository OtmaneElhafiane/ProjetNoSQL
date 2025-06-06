import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PatientService, Patient } from '../patient.service';

@Component({
  selector: 'app-patient-list',
  template: `
    <div class="container">
      <h2>Liste des Patients</h2>
      <div class="row mb-3">
        <div class="col">
          <button class="btn btn-primary" (click)="addNewPatient()">
            Ajouter un patient
          </button>
        </div>
      </div>
      <div class="table-responsive">
        <table class="table table-striped">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Date de naissance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let patient of patients">
              <td>{{ patient.lastName }}</td>
              <td>{{ patient.firstName }}</td>
              <td>{{ patient.dateOfBirth | date:'dd/MM/yyyy' }}</td>
              <td>
                <button class="btn btn-sm btn-info me-2" (click)="viewPatient(patient._id)">
                  Voir
                </button>
                <button class="btn btn-sm btn-danger" (click)="deletePatient(patient._id)">
                  Supprimer
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: []
})
export class PatientListComponent implements OnInit {
  patients: Patient[] = [];

  constructor(
    private router: Router,
    private patientService: PatientService
  ) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.patientService.getPatients().subscribe({
      next: (patients) => {
        this.patients = patients;
      },
      error: (error) => {
        console.error('Error loading patients:', error);
        // TODO: Ajouter un message d'erreur pour l'utilisateur
      }
    });
  }

  addNewPatient(): void {
    this.router.navigate(['/patients/new']);
  }

  viewPatient(id: string | undefined): void {
    if (id) {
      this.router.navigate(['/patients', id]);
    }
  }

  deletePatient(id: string | undefined): void {
    if (id && confirm('Êtes-vous sûr de vouloir supprimer ce patient ?')) {
      this.patientService.deletePatient(id).subscribe({
        next: () => {
          this.loadPatients();
          // TODO: Ajouter un message de succès
        },
        error: (error) => {
          console.error('Error deleting patient:', error);
          // TODO: Ajouter un message d'erreur pour l'utilisateur
        }
      });
    }
  }
} 