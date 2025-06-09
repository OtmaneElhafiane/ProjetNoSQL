import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PatientService, Patient, PatientResponse } from '../patient.service';

@Component({
  selector: 'app-patient-list',
  template: `
    <div class="container">
      <h2>Liste des Patients</h2>
      <div class="row mb-3">
        <div class="col-md-6">
          <button class="btn btn-primary" (click)="addNewPatient()">
            Ajouter un patient
          </button>
        </div>
        <div class="col-md-6">
          <div class="input-group">
            <input
              type="text"
              class="form-control"
              placeholder="Rechercher un patient..."
              [(ngModel)]="searchQuery"
              (keyup.enter)="searchPatients()"
            >
            <button class="btn btn-outline-secondary" type="button" (click)="searchPatients()">
              Rechercher
            </button>
            <button class="btn btn-outline-secondary" type="button" (click)="clearSearch()" *ngIf="searchQuery">
              Effacer
            </button>
          </div>
        </div>
      </div>

      <div class="mb-3" *ngIf="totalPatients > 0">
        <p class="text-muted">{{ totalPatients }} patient(s) trouvé(s)</p>
      </div>

      <div class="table-responsive" *ngIf="patients.length > 0">
        <table class="table table-striped">
          <thead>
          <tr>
            <th>Nom</th>
            <th>Prénom</th>
            <th>Email</th>
            <th>Téléphone</th>
            <th>CIN</th>
            <th>Type</th>
            <th>Date de création</th>
            <th>Actions</th>
          </tr>
          </thead>
          <tbody>
          <tr *ngFor="let patient of patients">
            <td>{{ patient.last_name }}</td>
            <td>{{ patient.first_name }}</td>
            <td>{{ patient.email }}</td>
            <td>{{ patient.phone }}</td>
            <td>{{ patient.cin }}</td>
            <td>
                <span class="badge" [ngClass]="getTypeClass(patient.type)">
                  {{ getTypeLabel(patient.type) }}
                </span>
            </td>
            <td>{{ patient.created_at | date:'dd/MM/yyyy' }}</td>
            <td>
              <button class="btn btn-sm btn-info me-2" (click)="viewPatient(patient.user_id)">
                Voir
              </button>
              <button class="btn btn-sm btn-warning me-2" (click)="editPatient(patient.user_id)">
                Modifier
              </button>
              <button class="btn btn-sm btn-danger" (click)="deletePatient(patient.user_id)">
                Supprimer
              </button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <div class="text-center py-4" *ngIf="patients.length === 0 && !isLoading">
        <p class="text-muted">Aucun patient trouvé</p>
      </div>

      <div class="text-center py-4" *ngIf="isLoading">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .badge {
      font-size: 0.75rem;
    }
    .badge.bg-primary {
      background-color: #0d6efd !important;
    }
    .badge.bg-success {
      background-color: #198754 !important;
    }
  `]
})
export class PatientListComponent implements OnInit {
  patients: Patient[] = [];
  totalPatients: number = 0;
  searchQuery: string = '';
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private patientService: PatientService
  ) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.isLoading = true;
    this.patientService.getAllPatients().subscribe({
      next: (response: PatientResponse) => {
        this.patients = response.patients;
        this.totalPatients = response.total;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading patients:', error);
        this.isLoading = false;
        // TODO: Ajouter un message d'erreur pour l'utilisateur
      }
    });
  }

  searchPatients(): void {
    if (this.searchQuery.trim()) {
      this.isLoading = true;
      this.patientService.searchPatients(this.searchQuery.trim()).subscribe({
        next: (response: PatientResponse) => {
          this.patients = response.patients;
          this.totalPatients = response.total;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error searching patients:', error);
          this.isLoading = false;
          // TODO: Ajouter un message d'erreur pour l'utilisateur
        }
      });
    } else {
      this.loadPatients();
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.loadPatients();
  }

  addNewPatient(): void {
    this.router.navigate(['/patients/new']);
  }

  viewPatient(userId: string): void {
    if (userId) {
      this.router.navigate(['/patients/view', userId]);
    }
  }

  editPatient(userId: string): void {
    if (userId) {
      this.router.navigate(['/patients/edit', userId]);
    }
  }

  deletePatient(userId: string): void {
    if (userId && confirm('Êtes-vous sûr de vouloir supprimer ce patient ?')) {
      this.patientService.deletePatient(userId).subscribe({
        next: () => {
          // Recharger la liste après suppression
          if (this.searchQuery.trim()) {
            this.searchPatients();
          } else {
            this.loadPatients();
          }
          // TODO: Ajouter un message de succès
        },
        error: (error) => {
          console.error('Error deleting patient:', error);
          // TODO: Ajouter un message d'erreur pour l'utilisateur
        }
      });
    }
  }

  getTypeClass(type: string): string {
    switch (type?.toLowerCase()) {
      case 'patient_vip':
        return 'bg-success';
      case 'patient':
        return 'bg-primary';
      default:
        return 'bg-secondary';
    }
  }

  getTypeLabel(type: string): string {
    switch (type?.toLowerCase()) {
      case 'patient_vip':
        return 'VIP';
      case 'patient':
        return 'Standard';
      default:
        return type || 'N/A';
    }
  }
}
