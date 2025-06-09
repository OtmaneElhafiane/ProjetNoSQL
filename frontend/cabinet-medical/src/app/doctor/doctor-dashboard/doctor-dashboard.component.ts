import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { Consultation, DoctorResponse, DoctorService } from '../../../app/core/services/doctor.service';
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
              
              <button class="btn btn-outline-primary btn-sm w-100 mt-3" (click)="editProfile()">
                Modifier le profil
              </button>
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
              <button class="btn btn-sm btn-outline-primary" (click)="viewAllHistory()">
                Voir tout
              </button>
            </div>
            <div class="card-body">
              <div *ngIf="recentConsultations.length > 0; else noHistory">
                <div class="consultation-item" *ngFor="let consultation of recentConsultations.slice(0, 5)">
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
                          <button class="btn btn-sm btn-outline-secondary" 
                                  (click)="viewPatientHistory(consultation.patient.id)">
                            <i class="fas fa-history me-1"></i>
                            Historique
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
  
  // Patients uniques (pour les statistiques)
  uniquePatients = new Set<string>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private doctorService: DoctorService
  ) {}

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
      next: (profile:any) => {
        this.doctorProfile = profile;
        this.profileLoading = false;
      },
      error: (error:any) => {
        console.error('Erreur lors du chargement du profil:', error);
        this.profileLoading = false;
      }
    });
  }

  private loadUpcomingConsultations(): void {
    this.upcomingLoading = true;
    this.upcomingError = null;
    
    this.doctorService.getUpcomingConsultations().subscribe({
      next: (response:any) => {
        this.upcomingConsultations = response.upcoming_consultations;
        this.upcomingLoading = false;
        this.updateUniquePatients();
      },
      error: (error:any) => {
        console.error('Erreur lors du chargement des consultations à venir:', error);
        this.upcomingError = 'Erreur lors du chargement des consultations à venir';
        this.upcomingLoading = false;
      }
    });
  }

  private loadConsultationHistory(): void {
    this.historyLoading = true;
    
    this.doctorService.getConsultationHistory().subscribe({
      next: (response :any) => {
        this.recentConsultations = response.consultations;
        this.historyLoading = false;
        this.updateUniquePatients();
      },
      error: (error : any) => {
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

  // Actions
  startConsultation(consultation: Consultation): void {
    // Mettre à jour le statut en "completed" ou naviguer vers la page de consultation
    if (consultation.status === 'pending') {
      this.doctorService.updateConsultationStatus(consultation.consultation_id, 'completed').subscribe({
        next: () => {
          consultation.status = 'completed';
          // Optionnel: naviguer vers une page de détails de consultation
          this.router.navigate(['/doctor-dashboard/consultation', consultation.consultation_id]);
        },
        error: (error :any) => {
          console.error('Erreur lors de la mise à jour du statut:', error);
        }
      });
    }
  }

  viewPatientHistory(patientId: string): void {
    this.router.navigate(['/doctor-dashboard/patient-history', patientId]);
  }

  viewAllHistory(): void {
    this.router.navigate(['/doctor-dashboard/consultations-history']);
  }

  editProfile(): void {
    this.router.navigate(['/doctor-dashboard/profile']);
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}