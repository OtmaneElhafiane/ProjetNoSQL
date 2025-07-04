import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { Consultation, DoctorResponse, DoctorService, PatientHistoryResponse, Patient } from '../../../app/core/services/doctor.service';
import {ConsultationService} from "../../core/services/consultation.service";

@Component({
  selector: 'app-doctor-dashboard',
  template: `
    <div class="container-fluid">
      <div class="row">
        <!-- Sidebar avec profil -->
        <div class="col-md-3">
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">Mon Profil</h5>
            </div>
            <div class="card-body" *ngIf="doctorProfile">
              <div class="text-center mb-3">
                <div class="avatar-placeholder bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center"
                     style="width: 80px; height: 80px; font-size: 2rem;">
                  {{ getInitials() }}
                </div>
              </div>
              <h6 class="card-title text-center">{{ doctorProfile.doctor?.name || 'Nom non défini' }}</h6>
              <p class="text-muted text-center">{{ doctorProfile.doctor?.speciality || 'Spécialité non définie' }}</p>

              <hr>

              <div class="profile-info">
                <p><strong>Email:</strong> {{ doctorProfile.doctor?.email }}</p>
                <p><strong>Téléphone:</strong> {{ doctorProfile.doctor?.phone || 'Non renseigné' }}</p>
                <p><strong>Membre depuis:</strong> {{ doctorProfile.created_at | date:'dd/MM/yyyy' }}</p>
                <p *ngIf="doctorProfile.last_login"><strong>Dernière connexion:</strong> {{ doctorProfile.last_login | date:'dd/MM/yyyy HH:mm' }}</p>
              </div>
            </div>
            <div class="card-body" *ngIf="!doctorProfile && !profileLoading">
              <p class="text-center text-muted">Profil indisponible</p>
            </div>
            <div class="card-body" *ngIf="profileLoading">
              <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Chargement...</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Historique des consultations -->
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h6 class="mb-0">Historique récent</h6>
            </div>
            <div class="card-body">
              <div *ngIf="recentConsultations.length > 0; else noHistory">
                <div class="consultation-item clickable-item"
                     *ngFor="let consultation of recentConsultations.slice(0, 5)"
                     (click)="viewPatientHistoryInline(consultation.patient.id)">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <small class="text-muted">{{ consultation.date | date:'dd/MM HH:mm' }}</small>
                      <p class="mb-1 fw-semibold">{{ consultation.patient.name }}</p>
                      <p class="mb-1 text-muted small">{{ consultation.motif | slice:0:30 }}{{ consultation.motif.length > 30 ? '...' : '' }}</p>
                      <span class="badge" [ngClass]="getStatusBadgeClass(consultation.status)">
                        {{ getStatusText(consultation.status) }}
                      </span>
                    </div>
                  </div>
                  <hr *ngIf="recentConsultations.indexOf(consultation) < 4">
                </div>
              </div>
              <ng-template #noHistory>
                <p class="text-muted text-center">Aucun historique disponible</p>
              </ng-template>

              <div *ngIf="historyLoading" class="text-center">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                  <span class="visually-hidden">Chargement...</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Contenu principal -->
        <div class="col-md-9">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Mon espace médecin</h2>
            <div class="text-muted">
              <i class="fas fa-calendar"></i> {{ currentDate | date:'EEEE dd MMMM yyyy' }}
            </div>
          </div>

          <!-- Rendez-vous à venir -->
          <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">
                <i class="fas fa-calendar-alt me-2"></i>
                Consultations à venir
              </h5>
              <button class="btn btn-sm btn-outline-primary" (click)="refreshUpcoming()" [disabled]="upcomingLoading">
                <i class="fas fa-sync-alt" [class.fa-spin]="upcomingLoading"></i>
                Actualiser
              </button>
            </div>
            <div class="card-body">
              <div *ngIf="upcomingLoading" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Chargement...</span>
                </div>
              </div>

              <div *ngIf="!upcomingLoading && upcomingConsultations.length > 0" class="table-responsive">
                <table class="table table-hover">
                  <thead>
                  <tr>
                    <th>Date & Heure</th>
                    <th>Patient</th>
                    <th>Motif</th>
                    <th>Contact</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr *ngFor="let consultation of upcomingConsultations">
                    <td>
                      <div>
                        <div class="fw-semibold">{{ consultation.date | date:'dd/MM/yyyy' }}</div>
                        <small class="text-muted">{{ consultation.date | date:'HH:mm' }}</small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div class="fw-semibold">{{ consultation.patient.name }}</div>
                        <small class="text-muted">{{ consultation.patient.birth_date | date:'dd/MM/yyyy' }}</small>
                      </div>
                    </td>
                    <td>
                        <span class="text-truncate d-inline-block" style="max-width: 150px;"
                              [title]="consultation.motif">
                          {{ consultation.motif }}
                        </span>
                    </td>
                    <td>
                      <div>
                        <small class="d-block">{{ consultation.patient.phone }}</small>
                        <small class="d-block text-muted">{{ consultation.patient.email }}</small>
                      </div>
                    </td>
                    <td>
                        <span class="badge" [ngClass]="getStatusBadgeClass(consultation.status)">
                          {{ getStatusText(consultation.status) }}
                        </span>
                    </td>
                    <td>
                      <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-primary"
                                (click)="startConsultation(consultation)"
                                [disabled]="consultation.status === 'completed'">
                          <i class="fas fa-play me-1"></i>
                          {{ consultation.status === 'completed' ? 'Terminée' : 'Démarrer' }}
                        </button>
                      </div>
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>

              <div *ngIf="!upcomingLoading && upcomingConsultations.length === 0" class="text-center py-5">
                <i class="fas fa-calendar-check fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">Aucune consultation à venir</h5>
                <p class="text-muted">Vos prochains rendez-vous apparaîtront ici.</p>
              </div>

              <div *ngIf="upcomingError" class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                {{ upcomingError }}
                <button class="btn btn-sm btn-outline-warning ms-2" (click)="refreshUpcoming()">
                  Réessayer
                </button>
              </div>
            </div>
          </div>

          <!-- Historique du patient sélectionné -->
          <div class="card mb-4" *ngIf="showPatientHistory">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">
                <i class="fas fa-user-md me-2"></i>
                Historique de {{ selectedPatient?.name }}
              </h5>
              <button class="btn btn-sm btn-outline-secondary" (click)="closePatientHistory()">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="card-body">
              <div *ngIf="patientHistoryLoading" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Chargement...</span>
                </div>
              </div>

              <div *ngIf="selectedPatient && !patientHistoryLoading" class="mb-3">
                <div class="row">
                  <div class="col-md-6">
                    <p><strong>Email:</strong> {{ selectedPatient.email }}</p>
                    <p><strong>Téléphone:</strong> {{ selectedPatient.phone }}</p>
                  </div>
                  <div class="col-md-6">
                    <p><strong>Date de naissance:</strong> {{ selectedPatient.birth_date | date:'dd/MM/yyyy' }}</p>
                    <p><strong>Adresse:</strong> {{ selectedPatient.address }}</p>
                  </div>
                </div>
                <hr>
              </div>

              <div *ngIf="!patientHistoryLoading && patientConsultations.length > 0" class="table-responsive">
                <table class="table table-striped">
                  <thead>
                  <tr>
                    <th>Date</th>
                    <th>Motif</th>
                    <th>Diagnostic</th>
                    <th>Traitement</th>
                    <th>Statut</th>
                    <th>Notes</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr *ngFor="let consultation of patientConsultations">
                    <td>
                      <div class="fw-semibold">{{ consultation.date | date:'dd/MM/yyyy' }}</div>
                      <small class="text-muted">{{ consultation.date | date:'HH:mm' }}</small>
                    </td>
                    <td>
                        <span class="text-truncate d-inline-block" style="max-width: 150px;"
                              [title]="consultation.motif">
                          {{ consultation.motif }}
                        </span>
                    </td>
                    <td>
                        <span class="text-truncate d-inline-block" style="max-width: 150px;"
                              [title]="consultation.diagnostic">
                          {{ consultation.diagnostic || 'Non renseigné' }}
                        </span>
                    </td>
                    <td>
                        <span class="text-truncate d-inline-block" style="max-width: 150px;"
                              [title]="consultation.traitement">
                          {{ consultation.traitement || 'Non renseigné' }}
                        </span>
                    </td>
                    <td>
                        <span class="badge" [ngClass]="getStatusBadgeClass(consultation.status)">
                          {{ getStatusText(consultation.status) }}
                        </span>
                    </td>
                    <td>
                        <span class="text-truncate d-inline-block" style="max-width: 120px;"
                              [title]="consultation.notes">
                          {{ consultation.notes || 'Aucune note' }}
                        </span>
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>

              <div *ngIf="!patientHistoryLoading && patientConsultations.length === 0" class="text-center py-4">
                <i class="fas fa-history fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">Aucun historique trouvé</h5>
                <p class="text-muted">Ce patient n'a pas d'historique de consultations.</p>
              </div>

              <div *ngIf="patientHistoryError" class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                {{ patientHistoryError }}
              </div>
            </div>
          </div>

          <!-- Statistiques rapides -->
          <div class="row">
            <div class="col-md-3 mb-3">
              <div class="card bg-primary text-white">
                <div class="card-body text-center">
                  <i class="fas fa-calendar-day fa-2x mb-2"></i>
                  <h4>{{ getTodayConsultationsCount() }}</h4>
                  <small>Aujourd'hui</small>
                </div>
              </div>
            </div>
            <div class="col-md-3 mb-3">
              <div class="card bg-success text-white">
                <div class="card-body text-center">
                  <i class="fas fa-check-circle fa-2x mb-2"></i>
                  <h4>{{ getCompletedConsultationsCount() }}</h4>
                  <small>Terminées</small>
                </div>
              </div>
            </div>
            <div class="col-md-3 mb-3">
              <div class="card bg-warning text-white">
                <div class="card-body text-center">
                  <i class="fas fa-clock fa-2x mb-2"></i>
                  <h4>{{ getPendingConsultationsCount() }}</h4>
                  <small>En attente</small>
                </div>
              </div>
            </div>
            <div class="col-md-3 mb-3">
              <div class="card bg-info text-white">
                <div class="card-body text-center">
                  <i class="fas fa-users fa-2x mb-2"></i>
                  <h4>{{ getTotalPatientsCount() }}</h4>
                  <small>Patients totaux</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de consultation -->
    <div class="modal fade" id="consultationModal" tabindex="-1" aria-labelledby="consultationModalLabel" aria-hidden="true"
         [class.show]="showConsultationModal" [style.display]="showConsultationModal ? 'block' : 'none'">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title" id="consultationModalLabel">
              <i class="fas fa-stethoscope me-2"></i>
              Consultation - {{ currentConsultation?.patient?.name }}
            </h5>
            <button type="button" class="btn-close btn-close-white" (click)="closeConsultationModal()" aria-label="Close"></button>
          </div>

          <form [formGroup]="consultationForm" (ngSubmit)="saveConsultation()">
            <div class="modal-body">
              <!-- Informations du patient -->
              <div class="row mb-4" *ngIf="currentConsultation">
                <div class="col-12">
                  <div class="alert alert-light">
                    <h6 class="mb-2"><i class="fas fa-user me-2"></i>Informations du patient</h6>
                    <div class="row">
                      <div class="col-md-6">
                        <p class="mb-1"><strong>Nom:</strong> {{ currentConsultation.patient.name }}</p>
                        <p class="mb-1"><strong>Date de naissance:</strong> {{ currentConsultation.patient.birth_date | date:'dd/MM/yyyy' }}</p>
                      </div>
                      <div class="col-md-6">
                        <p class="mb-1"><strong>Téléphone:</strong> {{ currentConsultation.patient.phone }}</p>
                        <p class="mb-1"><strong>Email:</strong> {{ currentConsultation.patient.email }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Formulaire de consultation -->
              <div class="row">
                <div class="col-12 mb-3">
                  <label for="motif" class="form-label">
                    <i class="fas fa-clipboard-list me-1"></i>
                    Motif de consultation <span class="text-danger">*</span>
                  </label>
                  <textarea
                    class="form-control"
                    id="motif"
                    formControlName="motif"
                    rows="2"
                    placeholder="Décrivez le motif de la consultation...">
                  </textarea>
                  <div class="invalid-feedback" *ngIf="consultationForm.get('motif')?.touched && consultationForm.get('motif')?.errors?.['required']">
                    Le motif de consultation est obligatoire
                  </div>
                </div>

                <div class="col-md-6 mb-3">
                  <label for="diagnostic" class="form-label">
                    <i class="fas fa-search-plus me-1"></i>
                    Diagnostic
                  </label>
                  <textarea
                    class="form-control"
                    id="diagnostic"
                    formControlName="diagnostic"
                    rows="3"
                    placeholder="Diagnostic médical (optionnel)...">
                  </textarea>
                </div>

                <div class="col-md-6 mb-3">
                  <label for="traitement" class="form-label">
                    <i class="fas fa-pills me-1"></i>
                    Traitement prescrit
                  </label>
                  <textarea
                    class="form-control"
                    id="traitement"
                    formControlName="traitement"
                    rows="3"
                    placeholder="Traitement et posologie (optionnel)...">
                  </textarea>
                </div>

                <div class="col-12 mb-3">
                  <label for="notes" class="form-label">
                    <i class="fas fa-sticky-note me-1"></i>
                    Notes complémentaires
                  </label>
                  <textarea
                    class="form-control"
                    id="notes"
                    formControlName="notes"
                    rows="3"
                    placeholder="Notes additionnelles, observations, recommandations... (optionnel)">
                  </textarea>
                </div>

                <div class="col-md-6 mb-3">
                  <label for="status" class="form-label">
                    <i class="fas fa-flag me-1"></i>
                    Statut de la consultation <span class="text-danger">*</span>
                  </label>
                  <select class="form-select" id="status" formControlName="status">
                    <option value="pending">En attente</option>
                    <option value="completed">Terminée</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                </div>


              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeConsultationModal()">
                <i class="fas fa-times me-1"></i>
                Annuler
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="consultationForm.invalid || isSaving">
                <i class="fas fa-save me-1" *ngIf="!isSaving"></i>
                <i class="fas fa-spinner fa-spin me-1" *ngIf="isSaving"></i>
                {{ isSaving ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Overlay pour le modal -->
    <div class="modal-backdrop fade" [class.show]="showConsultationModal" *ngIf="showConsultationModal"
         (click)="closeConsultationModal()"></div>
  `,
  styles: [`
    .avatar-placeholder {
      font-weight: bold;
    }

    .profile-info p {
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }

    .consultation-item {
      padding: 0.5rem 0;
    }

    .clickable-item {
      cursor: pointer;
      transition: all 0.2s ease;
      padding: 0.75rem !important;
      margin: 0.25rem 0;
      border-radius: 0.375rem;
    }

    .clickable-item:hover {
      background-color: #f8f9fc;
      transform: translateX(5px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .card {
      transition: transform 0.2s ease;
      border: 1px solid #e3e6f0;
    }

    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .table th {
      border-top: none;
      font-weight: 600;
      background-color: #f8f9fc;
    }

    .btn-group .btn {
      margin-right: 0.25rem;
    }

    .badge {
      font-size: 0.75rem;
    }

    .text-truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .bg-primary { background-color: #4e73df !important; }
    .bg-success { background-color: #1cc88a !important; }
    .bg-warning { background-color: #f6c23e !important; }
    .bg-info { background-color: #36b9cc !important; }

    /* Styles pour le modal */
    .modal {
      z-index: 1050;
    }

    .modal-backdrop {
      z-index: 1040;
      background-color: rgba(0,0,0,0.5);
    }

    .modal.show {
      display: block !important;
    }

    .modal-backdrop.show {
      opacity: 0.5;
    }

    .modal-header {
      border-bottom: 1px solid #dee2e6;
    }

    .modal-footer {
      border-top: 1px solid #dee2e6;
    }

    .form-label {
      font-weight: 600;
      color: #495057;
    }

    .form-control:focus,
    .form-select:focus {
      border-color: #4e73df;
      box-shadow: 0 0 0 0.2rem rgba(78, 115, 223, 0.25);
    }

    .invalid-feedback {
      display: block;
    }

    .alert-light {
      background-color: #f8f9fc;
      border-color: #e3e6f0;
    }

    .btn-close-white {
      filter: invert(1) grayscale(100%) brightness(200%);
    }
  `]
})
export class DoctorDashboardComponent implements OnInit {
  currentUser: any = null;
  currentDate = new Date();

  // Données du profil
  doctorProfile: DoctorResponse | null = null;
  profileLoading = false;

  // Consultations à venir
  upcomingConsultations: Consultation[] = [];
  upcomingLoading = false;
  upcomingError: string | null = null;

  // Historique des consultations
  recentConsultations: Consultation[] = [];
  historyLoading = false;

  // Historique du patient sélectionné
  showPatientHistory = false;
  selectedPatient: Patient | null = null;
  patientConsultations: Omit<Consultation, 'patient'>[] = [];
  patientHistoryLoading = false;
  patientHistoryError: string | null = null;

  // Patients uniques (pour les statistiques)
  uniquePatients = new Set<string>();

  // Modal de consultation
  showConsultationModal = false;
  currentConsultation: Consultation | null = null;
  consultationForm: FormGroup;
  isSaving = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private doctorService: DoctorService,
    private consultationService: ConsultationService,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder
  ) {
    // Initialisation du formulaire
    this.consultationForm = this.formBuilder.group({
      motif: ['', [Validators.required]],
      diagnostic: [''],
      traitement: [''],
      notes: [''],
      status: ['completed', [Validators.required]],
      date: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadDoctorData();
      }
    });
  }

  private loadDoctorData(): void {
    this.loadDoctorProfile();
    this.loadUpcomingConsultations();
    this.loadConsultationHistory();
  }

  private loadDoctorProfile(): void {
    this.profileLoading = true;
    this.doctorService.getDoctorProfile().subscribe({
      next: (profile: any) => {
        this.doctorProfile = profile;
        this.profileLoading = false;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement du profil:', error);
        this.profileLoading = false;
      }
    });
  }

  private loadUpcomingConsultations(): void {
    this.upcomingLoading = true;
    this.upcomingError = null;

    this.doctorService.getUpcomingConsultations().subscribe({
      next: (response: any) => {
        this.upcomingConsultations = response.upcoming_consultations;
        this.upcomingLoading = false;
        this.updateUniquePatients();
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des consultations à venir:', error);
        this.upcomingError = 'Erreur lors du chargement des consultations à venir';
        this.upcomingLoading = false;
      }
    });
  }

  private loadConsultationHistory(): void {
    this.historyLoading = true;

    this.doctorService.getConsultationHistory().subscribe({
      next: (response: any) => {
        this.recentConsultations = response.consultations;
        this.historyLoading = false;
        this.updateUniquePatients();
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement de l\'historique:', error);
        this.historyLoading = false;
      }
    });
  }

  private updateUniquePatients(): void {
    this.uniquePatients.clear();

    [...this.upcomingConsultations, ...this.recentConsultations].forEach(consultation => {
      this.uniquePatients.add(consultation.patient.id);
    });
  }

  // Nouvelle méthode pour afficher l'historique d'un patient
  viewPatientHistoryInline(patientId: string): void {
    this.patientHistoryLoading = true;
    this.patientHistoryError = null;
    this.showPatientHistory = true;

    this.doctorService.getPatientHistory(patientId).subscribe({
      next: (response: PatientHistoryResponse) => {
        this.selectedPatient = response.patient;
        this.patientConsultations = response.consultations;
        this.patientHistoryLoading = false;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement de l\'historique du patient:', error);
        this.patientHistoryError = 'Erreur lors du chargement de l\'historique du patient';
        this.patientHistoryLoading = false;
      }
    });
  }

  // Méthode pour fermer l'historique du patient
  closePatientHistory(): void {
    this.showPatientHistory = false;
    this.selectedPatient = null;
    this.patientConsultations = [];
    this.patientHistoryError = null;
  }

  refreshUpcoming(): void {
    this.loadUpcomingConsultations();
  }

  getInitials(): string {
    if (!this.doctorProfile?.doctor?.name) return 'DR';

    return this.doctorProfile.doctor.name
      .split(' ')
      .map((word: string) => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-success';
      case 'pending':
        return 'bg-warning text-dark';
      case 'cancelled':
        return 'bg-danger';
      case 'rescheduled':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'completed':
        return 'Terminée';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulée';
      case 'rescheduled':
        return 'Reportée';
      default:
        return 'Inconnu';
    }
  }

  // Statistiques
  getTodayConsultationsCount(): number {
    const today = new Date().toDateString();
    return this.upcomingConsultations.filter(consultation =>
      new Date(consultation.date).toDateString() === today
    ).length;
  }

  getCompletedConsultationsCount(): number {
    return this.recentConsultations.filter(consultation =>
      consultation.status === 'completed'
    ).length;
  }

  getPendingConsultationsCount(): number {
    return this.upcomingConsultations.filter(consultation =>
      consultation.status === 'pending'
    ).length;
  }

  getTotalPatientsCount(): number {
    return this.uniquePatients.size;
  }

  // Gestion du modal de consultation
  startConsultation(consultation: Consultation): void {
    this.currentConsultation = consultation;
    this.showConsultationModal = true;

    // Pré-remplir le formulaire avec les données existantes
    this.consultationForm.patchValue({
      motif: consultation.motif || '',
      diagnostic: consultation.diagnostic || '',
      traitement: consultation.traitement || '',
      notes: consultation.notes || '',
      status: consultation.status || 'pending',
      date: this.formatDateForInput(consultation.date)
    });
  }

  closeConsultationModal(): void {
    this.showConsultationModal = false;
    this.currentConsultation = null;
    this.consultationForm.reset();
    this.isSaving = false;
  }

  saveConsultation(): void {
    if (this.consultationForm.valid && this.currentConsultation) {
      this.isSaving = true;

      const formData = this.consultationForm.value;
      const consultationData = {
        consultation_id: this.currentConsultation.consultation_id,
        motif: formData.motif,
        diagnostic: formData.diagnostic,
        traitement: formData.traitement,
        notes: formData.notes,
        status: formData.status,
      };

      // Appel au service pour sauvegarder la consultation
      this.consultationService.updateConsultation(this.currentConsultation.consultation_id,consultationData).subscribe({
        next: (response: any) => {
          // Mettre à jour la consultation dans la liste
          const index = this.upcomingConsultations.findIndex(
            c => c.consultation_id === this.currentConsultation!.consultation_id
          );

          if (index !== -1) {
            this.upcomingConsultations[index] = {
              ...this.upcomingConsultations[index],
              ...formData
            };
          }

          this.isSaving = false;
          this.closeConsultationModal();

          // Afficher un message de succès (vous pouvez implémenter un service de notification)
          console.log('Consultation mise à jour avec succès');

          // Recharger les données si nécessaire
          this.loadUpcomingConsultations();
          this.loadConsultationHistory();
        },
        error: (error: any) => {
          console.error('Erreur lors de la sauvegarde:', error);
          this.isSaving = false;

          // Afficher un message d'erreur (vous pouvez implémenter un service de notification)
          alert('Erreur lors de la sauvegarde de la consultation');
        }
      });
    }
  }

  private formatDateForInput(date: string | Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  viewPatientHistory(patientId: string): void {
    this.router.navigate(['/doctor-dashboard/patient-history', patientId]);
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
