import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-patient-dashboard',
  template: `
    <div class="container">
      <h2 class="mb-4">Mon espace patient</h2>
      
      <div class="row">
        <!-- Carte Rendez-vous -->
        <div class="col-md-6 mb-4">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">Mes rendez-vous</h5>
              <div *ngIf="nextAppointment" class="mb-3">
                <h6>Prochain rendez-vous :</h6>
                <p>
                  <strong>Date :</strong> {{ nextAppointment.date | date:'dd/MM/yyyy HH:mm' }}<br>
                  <strong>Médecin :</strong> {{ nextAppointment.doctorName }}
                </p>
              </div>
              <button class="btn btn-primary" (click)="navigateTo('/patient-dashboard/appointments')">
                Gérer mes rendez-vous
              </button>
            </div>
          </div>
        </div>

        <!-- Carte Profil -->
        <div class="col-md-6 mb-4">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">Mon profil</h5>
              <div *ngIf="currentUser" class="mb-3">
                <p>
                  <strong>Nom :</strong> {{ currentUser.lastName }}<br>
                  <strong>Prénom :</strong> {{ currentUser.firstName }}<br>
                  <strong>Email :</strong> {{ currentUser.email }}
                </p>
              </div>
              <button class="btn btn-primary" (click)="navigateTo('/patient-dashboard/profile')">
                Modifier mon profil
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Historique des consultations -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">Mes dernières consultations</h5>
              <div class="table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Médecin</th>
                      <th>Motif</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let consultation of recentConsultations">
                      <td>{{ consultation.date | date:'dd/MM/yyyy' }}</td>
                      <td>{{ consultation.doctorName }}</td>
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
export class PatientDashboardComponent implements OnInit {
  currentUser: any = null;
  nextAppointment: any = null;
  recentConsultations: any[] = [];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        // TODO: Charger les rendez-vous et consultations du patient
      }
    });
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  viewConsultation(consultation: any): void {
    // TODO: Implémenter la vue détaillée de la consultation
  }
} 