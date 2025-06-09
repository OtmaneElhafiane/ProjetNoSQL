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
                <button class="btn btn-outline-primary btn-sm" (click)="navigateTo('/patient/consultations')">
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
                      <button class="btn btn-sm btn-info me-2" (click)="showConsultationDetails(consultation)">
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

    <!-- Modal pour les détails de la consultation -->
    <div class="modal fade" id="consultationModal" tabindex="-1" aria-labelledby="consultationModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="consultationModalLabel">
              <i class="fas fa-file-medical me-2"></i>
              Détails de la consultation
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" *ngIf="selectedConsultation">
            <div class="row">
              <!-- Informations générales -->
              <div class="col-md-6 mb-4">
                <div class="info-section">
                  <h6 class="section-title">
                    <i class="fas fa-info-circle me-2"></i>
                    Informations générales
                  </h6>
                  <div class="info-item">
                    <strong>Date :</strong>
                    <span>{{ selectedConsultation.date | date:'dd/MM/yyyy à HH:mm' }}</span>
                  </div>
                  <div class="info-item">
                    <strong>Motif :</strong>
                    <span>{{ selectedConsultation.motif }}</span>
                  </div>
                  <div class="info-item">
                    <strong>Statut :</strong>
                    <span class="badge" [ngClass]="getStatusBadgeClass(selectedConsultation.status)">
                      {{ getStatusText(selectedConsultation.status) }}
                    </span>
                  </div>
                  <div class="info-item" *ngIf="selectedConsultation.created_at">
                    <strong>Créée le :</strong>
                    <span>{{ selectedConsultation.created_at | date:'dd/MM/yyyy à HH:mm' }}</span>
                  </div>
                </div>
              </div>

              <!-- Informations du médecin -->
              <div class="col-md-6 mb-4">
                <div class="info-section">
                  <h6 class="section-title">
                    <i class="fas fa-user-md me-2"></i>
                    Médecin traitant
                  </h6>
                  <div class="info-item">
                    <strong>Nom :</strong>
                    <span>Dr. {{ selectedConsultation.doctor.name }}</span>
                  </div>
                  <div class="info-item">
                    <strong>Spécialité :</strong>
                    <span>{{ selectedConsultation.doctor.speciality }}</span>
                  </div>
                  <div class="info-item" *ngIf="selectedConsultation.doctor.email">
                    <strong>Email :</strong>
                    <span>{{ selectedConsultation.doctor.email }}</span>
                  </div>
                  <div class="info-item" *ngIf="selectedConsultation.doctor.phone">
                    <strong>Téléphone :</strong>
                    <span>{{ selectedConsultation.doctor.phone }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Diagnostic -->
            <div class="row" *ngIf="selectedConsultation.diagnostic">
              <div class="col-12 mb-4">
                <div class="info-section">
                  <h6 class="section-title">
                    <i class="fas fa-stethoscope me-2"></i>
                    Diagnostic
                  </h6>
                  <div class="diagnostic-content">
                    {{ selectedConsultation.diagnostic }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Traitement -->
            <div class="row" *ngIf="selectedConsultation.traitement">
              <div class="col-12 mb-4">
                <div class="info-section">
                  <h6 class="section-title">
                    <i class="fas fa-pills me-2"></i>
                    Traitement prescrit
                  </h6>
                  <div class="treatment-content">
                    {{ selectedConsultation.traitement }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="row" *ngIf="selectedConsultation.notes">
              <div class="col-12 mb-4">
                <div class="info-section">
                  <h6 class="section-title">
                    <i class="fas fa-sticky-note me-2"></i>
                    Notes additionnelles
                  </h6>
                  <div class="notes-content">
                    {{ selectedConsultation.notes }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
            <button type="button" class="btn btn-primary" (click)="printConsultation()">
              <i class="fas fa-print me-1"></i>
              Imprimer
            </button>
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

    /* Styles pour le modal */
    .modal-header {
      color: black;
      border-bottom: none;
    }

    .modal-header .btn-close {
      filter: invert(1);
    }

    .info-section {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 10px;
      border-left: 4px solid #007bff;
      height: 100%;
    }

    .section-title {
      color: #495057;
      font-weight: 600;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e9ecef;
    }

    .info-item {
      margin-bottom: 12px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
    }

    .info-item strong {
      min-width: 100px;
      color: #495057;
      margin-right: 10px;
    }

    .info-item span {
      flex: 1;
    }

    .diagnostic-content,
    .treatment-content,
    .notes-content {
      background: white;
      padding: 15px;
      border-radius: 8px;
      border: 1px solid #e9ecef;
      line-height: 1.6;
      white-space: pre-wrap;
    }

    .modal-footer {
      border-top: 1px solid #e9ecef;
      background: #f8f9fa;
    }

    .section-title i {
      color: #007bff;
    }

    @media (max-width: 768px) {
      .info-item {
        flex-direction: column;
        align-items: flex-start;
      }

      .info-item strong {
        min-width: auto;
        margin-bottom: 5px;
      }
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
  selectedConsultation: Consultation | null = null;

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

  // Nouvelle méthode pour afficher les détails dans le modal
  showConsultationDetails(consultation: Consultation): void {
    this.selectedConsultation = consultation;

    // Utiliser Bootstrap modal (nécessite que Bootstrap JS soit chargé)
    const modalElement = document.getElementById('consultationModal');
    if (modalElement) {
      // @ts-ignore
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  // Ancienne méthode pour navigation (gardée pour compatibilité)
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

  // Méthode pour imprimer la consultation
  printConsultation(): void {
    if (!this.selectedConsultation) return;

    const printContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007bff; padding-bottom: 20px;">
          <h1 style="color: #007bff; margin: 0;">Consultation Médicale</h1>
          <p style="color: #666; margin: 5px 0;">Détails de la consultation</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
          <div>
            <h3 style="color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Informations générales</h3>
            <p><strong>Date:</strong> ${new Date(this.selectedConsultation.date).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })}</p>
            <p><strong>Motif:</strong> ${this.selectedConsultation.motif}</p>
            <p><strong>Statut:</strong> ${this.getStatusText(this.selectedConsultation.status)}</p>
            ${this.selectedConsultation.created_at ? `<p><strong>Créée le:</strong> ${new Date(this.selectedConsultation.created_at).toLocaleDateString('fr-FR')}</p>` : ''}
          </div>

          <div>
            <h3 style="color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Médecin traitant</h3>
            <p><strong>Nom:</strong> Dr. ${this.selectedConsultation.doctor.name}</p>
            <p><strong>Spécialité:</strong> ${this.selectedConsultation.doctor.speciality}</p>
            ${this.selectedConsultation.doctor.email ? `<p><strong>Email:</strong> ${this.selectedConsultation.doctor.email}</p>` : ''}
            ${this.selectedConsultation.doctor.phone ? `<p><strong>Téléphone:</strong> ${this.selectedConsultation.doctor.phone}</p>` : ''}
          </div>
        </div>

        ${this.selectedConsultation.diagnostic ? `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Diagnostic</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff;">
              <p style="margin: 0; line-height: 1.6;">${this.selectedConsultation.diagnostic}</p>
            </div>
          </div>
        ` : ''}

        ${this.selectedConsultation.traitement ? `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Traitement prescrit</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
              <p style="margin: 0; line-height: 1.6;">${this.selectedConsultation.traitement}</p>
            </div>
          </div>
        ` : ''}

        ${this.selectedConsultation.notes ? `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Notes additionnelles</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
              <p style="margin: 0; line-height: 1.6;">${this.selectedConsultation.notes}</p>
            </div>
          </div>
        ` : ''}

        <div style="margin-top: 50px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px;">
          <p>Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  }

  // Méthode pour rafraîchir les données
  refreshData(): void {
    this.loadPatientData();
  }
}
