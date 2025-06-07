import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DoctorService, Doctor } from '../doctor.service';

@Component({
  selector: 'app-doctor-list',
  template: `
    <div class="container">
      <h2>Liste des Médecins</h2>
      <div class="row mb-3">
        <div class="col">
          <button class="btn btn-primary" (click)="addNewDoctor()">
            Ajouter un médecin
          </button>
        </div>
      </div>
      <div class="table-responsive">
        <table class="table table-striped">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Spécialité</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let doctor of doctors">
              <td>{{ doctor.lastName }}</td>
              <td>{{ doctor.firstName }}</td>
              <td>{{ doctor.speciality }}</td>
              <td>{{ doctor.email }}</td>
              <td>
                <button class="btn btn-sm btn-info me-2" (click)="viewDoctor(doctor._id)">
                  Voir
                </button>
                <button class="btn btn-sm btn-danger" (click)="deleteDoctor(doctor._id)">
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
export class DoctorListComponent implements OnInit {
  doctors: Doctor[] = [];

  constructor(
    private router: Router,
    private doctorService: DoctorService
  ) {}

  ngOnInit(): void {
    this.loadDoctors();
  }

  loadDoctors(): void {
    this.doctorService.getDoctors().subscribe({
      next: (doctors) => {
        this.doctors = doctors;
      },
      error: (error) => {
        console.error('Error loading doctors:', error);
        // TODO: Ajouter un message d'erreur pour l'utilisateur
      }
    });
  }

  addNewDoctor(): void {
    this.router.navigate(['/doctors/new']);
  }

  viewDoctor(id: string | undefined): void {
    if (id) {
      this.router.navigate(['/doctors', id]);
    }
  }

  deleteDoctor(id: string | undefined): void {
    if (id && confirm('Êtes-vous sûr de vouloir supprimer ce médecin ?')) {
      this.doctorService.deleteDoctor(id).subscribe({
        next: () => {
          this.loadDoctors();
          // TODO: Ajouter un message de succès
        },
        error: (error) => {
          console.error('Error deleting doctor:', error);
          // TODO: Ajouter un message d'erreur pour l'utilisateur
        }
      });
    }
  }
} 