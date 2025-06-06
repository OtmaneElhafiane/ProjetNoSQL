import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  template: `
    <div class="container">
      <h2 class="mb-4">Tableau de bord administrateur</h2>
      
      <div class="row">
        <!-- Carte Patients -->
        <div class="col-md-4 mb-4">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">Gestion des patients</h5>
              <p class="card-text">Gérez les dossiers des patients, leurs informations et leurs rendez-vous.</p>
              <button class="btn btn-primary" (click)="navigateTo('/admin/patients')">
                Accéder aux patients
              </button>
            </div>
          </div>
        </div>

        <!-- Carte Médecins -->
        <div class="col-md-4 mb-4">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">Gestion des médecins</h5>
              <p class="card-text">Gérez les profils des médecins, leurs disponibilités et leurs spécialités.</p>
              <button class="btn btn-primary" (click)="navigateTo('/admin/doctors')">
                Accéder aux médecins
              </button>
            </div>
          </div>
        </div>

        <!-- Carte Rendez-vous -->
        <div class="col-md-4 mb-4">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">Gestion des rendez-vous</h5>
              <p class="card-text">Consultez et gérez tous les rendez-vous du cabinet médical.</p>
              <button class="btn btn-primary" (click)="navigateTo('/admin/appointments')">
                Accéder aux rendez-vous
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">Statistiques du cabinet</h5>
              <div class="row">
                <div class="col-md-4">
                  <div class="text-center">
                    <h6>Nombre total de patients</h6>
                    <p class="h3">{{ stats.totalPatients || 0 }}</p>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="text-center">
                    <h6>Nombre total de médecins</h6>
                    <p class="h3">{{ stats.totalDoctors || 0 }}</p>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="text-center">
                    <h6>Rendez-vous aujourd'hui</h6>
                    <p class="h3">{{ stats.appointmentsToday || 0 }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      height: 100%;
      transition: transform 0.2s;
    }
    .card:hover {
      transform: translateY(-5px);
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats = {
    totalPatients: 0,
    totalDoctors: 0,
    appointmentsToday: 0
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    // TODO: Charger les statistiques depuis le service
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
} 