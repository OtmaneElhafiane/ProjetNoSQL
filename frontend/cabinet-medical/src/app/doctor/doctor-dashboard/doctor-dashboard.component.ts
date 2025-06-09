import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-doctor-dashboard',
  template: `
    <div class="container">
      <h2 class="mb-4">Mon espace médecin</h2>
      
      <div class="row">
        <!-- Carte Rendez-vous du jour -->
        <div class="col-md-6 mb-4">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">Rendez-vous du jour</h5>
              <div class="table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Heure</th>
                      <th>Patient</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let appointment of todayAppointments">
                      <td>{{ appointment.date | date:'HH:mm' }}</td>
                      <td>{{ appointment.patientName }}</td>
                      <td>
                        <button class="btn btn-sm btn-primary" (click)="startConsultation(appointment)">
                          Démarrer
                        </button>
                      </td>
                    </tr>
                    <tr *ngIf="!todayAppointments?.length">
                      <td colspan="3" class="text-center">Aucun rendez-vous aujourd'hui</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <button class="btn btn-primary mt-3" (click)="navigateTo('/doctor-dashboard/appointments')">
                Voir tous les rendez-vous
              </button>
            </div>
          </div>
        </div>

        <!-- Carte Statistiques -->
        <div class="col-md-6 mb-4">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">Mes statistiques</h5>
              <div class="row">
                <div class="col-6 text-center mb-3">
                  <h6>Patients aujourd'hui</h6>
                  <p class="h3">{{ stats.patientsToday || 0 }}</p>
                </div>
                <div class="col-6 text-center mb-3">
                  <h6>Consultations cette semaine</h6>
                  <p class="h3">{{ stats.consultationsThisWeek || 0 }}</p>
                </div>
                <div class="col-6 text-center">
                  <h6>Total patients</h6>
                  <p class="h3">{{ stats.totalPatients || 0 }}</p>
                </div>
                <div class="col-6 text-center">
                  <h6>Taux de satisfaction</h6>
                  <p class="h3">{{ stats.satisfactionRate || 0 }}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Dernières consultations -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">Dernières consultations</h5>
              <div class="table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Patient</th>
                      <th>Motif</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let consultation of recentConsultations">
                      <td>{{ consultation.date | date:'dd/MM/yyyy HH:mm' }}</td>
                      <td>{{ consultation.patientName }}</td>
                      <td>{{ consultation.motif }}</td>
                      <td>
                        <button class="btn btn-sm btn-info" (click)="viewConsultation(consultation)">
                          Voir détails
                        </button>
                      </td>
                    </tr>
                    <tr *ngIf="!recentConsultations?.length">
                      <td colspan="4" class="text-center">Aucune consultation récente</td>
                    </tr>
                  </tbody>
                </table>
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
export class DoctorDashboardComponent implements OnInit {
  currentUser: any = null;
  todayAppointments: any[] = [];
  recentConsultations: any[] = [];
  stats = {
    patientsToday: 0,
    consultationsThisWeek: 0,
    totalPatients: 0,
    satisfactionRate: 0
  };

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        // TODO: Charger les rendez-vous, consultations et statistiques du médecin
      }
    });
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  startConsultation(appointment: any): void {
    // TODO: Implémenter le démarrage d'une consultation
  }

  viewConsultation(consultation: any): void {
    // TODO: Implémenter la vue détaillée de la consultation
  }
} 