import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import {
  PatientService,
  PatientProfileResponse,
  Consultation,
  ConsultationHistoryResponse
} from '../../core/services/patient.service';

@Component({
  selector: 'app-patient-dashboard',
  template: `
    <div class="container">
      <h2 class="mb-4">Mon espace patient</h2>

      <!-- Loading State -->
      <div *ngIf="loading" class="text-center mb-4">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>

      <div class="row" *ngIf="!loading">
        <!-- Carte Rendez-vous -->
        <div class="col-md-6 mb-4">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">
                <i class="fas fa-calendar-alt me-2"></i>
                Mes rendez-vous
              </h5>
              <div *ngIf="nextAppointment" class="mb-3">
                <h6>Prochain rendez-vous :</h6>
                <div class="appointment-details">
                  <p class="mb-2">
                    <strong>Date :</strong> {{ nextAppointment.date | date:'dd/MM/yyyy à HH:mm' }}
                  </p>
                  <p class="mb-2">
                    <strong>Médecin :</strong> Dr. {{ nextAppointment.doctor.name }}
                  </p>
                  <p class="mb-2">
                    <strong>Spécialité :</strong> {{ nextAppointment.doctor.speciality }}
                  </p>
                  <p class="mb-0">
                    <strong>Motif :</strong> {{ nextAppointment.motif }}
                  </p>
                </div>
              </div>
              <div *ngIf="!nextAppointment && upcomingConsultations?.length === 0" class="mb-3">
                <p class="text-muted">Aucun rendez-vous programmé</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Carte Profil -->
        <div class="col-md-6 mb-4">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">
                <i class="fas fa-user me-2"></i>
                Mon profil
              </h5>
              <div *ngIf="patientProfile" class="mb-3">
                <div class="profile-details">
                  <p class="mb-2">
                    <strong>Nom :</strong> {{ patientProfile.patient?.name}}
                  </p>
                  <p class="mb-2">
                    <strong>Email :</strong> {{ patientProfile.patient?.email }}
                  </p>
                  <p class="mb-2">
                    <strong>Téléphone :</strong> {{ patientProfile.patient?.phone }}
                  </p>
                  <p class="mb-2">
                    <strong>Type :</strong> {{ patientProfile.patient?.type }}
                  </p>
                  <p class="mb-0">
                    <strong>Dernière connexion :</strong> {{ patientProfile.last_login | date:'dd/MM/yyyy à HH:mm' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistiques rapides -->
      <div class="row mt-4" *ngIf="!loading">
        <div class="col-md-4 mb-3">
          <div class="card bg-primary text-white">
            <div class="card-body text-center">
              <h3>{{ totalConsultations }}</h3>
              <p class="mb-0">Consultations totales</p>
            </div>
          </div>
        </div>
        <div class="col-md-4 mb-3">
          <div class="card bg-success text-white">
            <div class="card-body text-center">
              <h3>{{ upcomingConsultations?.length || 0 }}</h3>
              <p class="mb-0">RDV à venir</p>
            </div>
          </div>
        </div>
        <div class="col-md-4 mb-3">
          <div class="card bg-info text-white">
            <div class="card-body text-center">
              <h3>{{ completedConsultations }}</h3>
              <p class="mb-0">Consultations terminées</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Historique des consultations -->
      <div class="row mt-4" *ngIf="!loading">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="card-title mb-0">
                  <i class="fas fa-history me-2"></i>
                  Mes dernières consultations
                </h5>
                <button class="btn btn-outline-primary btn-sm" (click)="navigateTo('/patient-dashboard/consultations')">
                  Voir tout l'historique
                </button>
              </div>
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead class="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Médecin</th>
                    <th>Spécialité</th>
                    <th>Motif</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr *ngFor="let consultation of recentConsultations">
                    <td>{{ consultation.date | date:'dd/MM/yyyy' }}</td>
                    <td>Dr. {{ consultation.doctor.name }}</td>
                    <td>{{ consultation.doctor.speciality }}</td>
                    <td>{{ consultation.motif }}</td>
                    <td>
                        <span class="badge" [ngClass]="getStatusBadgeClass(consultation.status)">
                          {{ getStatusText(consultation.status) }}
                        </span>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-info me-2" (click)="viewConsultation(consultation)">
                        <i class="fas fa-eye me-1"></i>
                        Détails
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="!recentConsultations?.length">
                    <td colspan="6" class="text-center text-muted py-4">
                      <i class="fas fa-calendar-times fa-2x d-block mb-2"></i>
                      Aucune consultation récente
                    </td>
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
      transition: transform 0.2s, box-shadow 0.2s;
      border: none;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .appointment-details,
    .profile-details {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #007bff;
    }

    .badge {
      font-size: 0.75rem;
      padding: 0.375rem 0.75rem;
    }

    .table th {
      border-top: none;
      font-weight: 600;
      color: #495057;
    }

    .spinner-border {
      color: #007bff;
    }

    .fas {
      color: #007bff;
    }

    .bg-primary .fas,
    .bg-success .fas,
    .bg-info .fas,
    .bg-warning .fas {
      color: white;
    }
  `]
})
export class PatientDashboardComponent implements OnInit {
  patientProfile: PatientProfileResponse | null = null;
  nextAppointment: Consultation | null = null;
  recentConsultations: Consultation[] = [];
  upcomingConsultations: Consultation[] = [];
  loading = true;
  error: string | null = null;

  // Statistiques
  totalConsultations = 0;
  completedConsultations = 0;
  pendingConsultations = 0;

  constructor(
    private router: Router,
    private authService: AuthService,
    private patientService: PatientService
  ) {}

  ngOnInit(): void {
    this.loadPatientData();
  }

  private loadPatientData(): void {
    this.loading = true;
    this.error = null;

    // Charger le profil du patient
    this.patientService.getPatientProfile().subscribe({
      next: (profile: PatientProfileResponse) => {
        this.patientProfile = profile;
        this.loadConsultationsData();
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement du profil:', error);
        this.error = 'Erreur lors du chargement de votre profil';
        this.loading = false;
      }
    });
  }

  private loadConsultationsData(): void {
    // Charger l'historique des consultations
    this.patientService.getConsultationHistory().subscribe({
      next: (historyResponse: ConsultationHistoryResponse) => {
        this.totalConsultations = historyResponse.total;
        this.recentConsultations = historyResponse.consultations.slice(0, 5); // 5 dernières consultations

        // Calculer les statistiques
        this.completedConsultations = historyResponse.consultations.filter((c: Consultation) => c.status === 'completed').length;
        this.pendingConsultations = historyResponse.consultations.filter((c: Consultation) => c.status === 'pending').length;

        this.loadUpcomingConsultations();
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement de l\'historique:', error);
        this.loadUpcomingConsultations(); // Continuer même en cas d'erreur
      }
    });
  }

  private loadUpcomingConsultations(): void {
    // Charger les consultations à venir
    this.patientService.getUpcomingConsultations().subscribe({
      next: (upcomingResponse: any) => {
        this.upcomingConsultations = upcomingResponse.upcoming_consultations;
        this.nextAppointment = this.upcomingConsultations.length > 0 ? this.upcomingConsultations[0] : null;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des consultations à venir:', error);
        this.loading = false;
      }
    });
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  viewConsultation(consultation: Consultation): void {
    // Naviguer vers la vue détaillée de la consultation
    this.router.navigate(['/patient-dashboard/consultation', consultation.consultation_id]);
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-success';
      case 'pending':
        return 'bg-warning text-dark';
      case 'cancelled':
        return 'bg-danger';
      case 'confirmed':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  }

  getStatusText(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'Terminée';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulée';
      case 'confirmed':
        return 'Confirmée';
      default:
        return 'Inconnue';
    }
  }

  // Méthode pour rafraîchir les données
  refreshData(): void {
    this.loadPatientData();
  }
}
