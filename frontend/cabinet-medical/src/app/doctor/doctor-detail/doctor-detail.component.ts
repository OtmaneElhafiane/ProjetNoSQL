import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DoctorService, CreateDoctorRequest, UpdateDoctorRequest, DoctorResponse, DoctorInfo } from '../../core/services/doctor.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-doctor-detail',
  template: `
    <div class="container-fluid">
      <!-- Vérification des permissions admin -->
      <div *ngIf="!isAdmin" class="alert alert-danger mt-4">
        <h4>Accès refusé</h4>
        <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        <button class="btn btn-primary" (click)="goBack()">Retour</button>
      </div>

      <!-- Contenu principal (affiché seulement si admin) -->
      <div *ngIf="isAdmin">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2>
            <i class="fas fa-user-md me-2"></i>
            {{ isNewDoctor ? 'Nouveau Médecin' : 'Gestion du Médecin' }}
          </h2>
          <button class="btn btn-outline-secondary" (click)="goBack()">
            <i class="fas fa-arrow-left me-2"></i>
            Retour à la liste
          </button>
        </div>

        <!-- Loading state -->
        <div *ngIf="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Chargement...</span>
          </div>
          <p class="mt-2">Chargement des données...</p>
        </div>

        <!-- Messages d'erreur -->
        <div *ngIf="errorMessage" class="alert alert-danger alert-dismissible fade show">
          <i class="fas fa-exclamation-triangle me-2"></i>
          {{ errorMessage }}
          <button type="button" class="btn-close" (click)="clearError()"></button>
        </div>

        <!-- Messages de succès -->
        <div *ngIf="successMessage" class="alert alert-success alert-dismissible fade show">
          <i class="fas fa-check-circle me-2"></i>
          {{ successMessage }}
          <button type="button" class="btn-close" (click)="clearSuccess()"></button>
        </div>

        <!-- Contenu principal -->
        <div *ngIf="!loading">
          <div class="row">
            <!-- Formulaire de création (affiché seulement pour un nouveau docteur) -->
            <div class="col-lg-6" *ngIf="isNewDoctor">
              <div class="card">
                <div class="card-header bg-primary text-white">
                  <h5 class="mb-0">
                    <i class="fas fa-plus me-2"></i>
                    Créer un nouveau médecin
                  </h5>
                </div>
                <div class="card-body">
                  <form [formGroup]="createForm" (ngSubmit)="onCreateSubmit()">
                    <!-- Informations personnelles -->
                    <div class="row">
                      <div class="col-md-6 mb-3">
                        <label for="createFirstName" class="form-label">Prénom *</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          id="createFirstName" 
                          formControlName="first_name"
                          [class.is-invalid]="createForm.get('first_name')?.invalid && createForm.get('first_name')?.touched">
                        <div class="invalid-feedback">
                          Le prénom est requis
                        </div>
                      </div>
                      <div class="col-md-6 mb-3">
                        <label for="createLastName" class="form-label">Nom *</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          id="createLastName" 
                          formControlName="last_name"
                          [class.is-invalid]="createForm.get('last_name')?.invalid && createForm.get('last_name')?.touched">
                        <div class="invalid-feedback">
                          Le nom est requis
                        </div>
                      </div>
                    </div>

                    <!-- Email et mot de passe -->
                    <div class="mb-3">
                      <label for="createEmail" class="form-label">Email *</label>
                      <input 
                        type="email" 
                        class="form-control" 
                        id="createEmail" 
                        formControlName="email"
                        [class.is-invalid]="createForm.get('email')?.invalid && createForm.get('email')?.touched">
                      <div class="invalid-feedback">
                        Un email valide est requis
                      </div>
                    </div>

                    <div class="mb-3">
                      <label for="createPassword" class="form-label">Mot de passe *</label>
                      <input 
                        type="password" 
                        class="form-control" 
                        id="createPassword" 
                        formControlName="password"
                        [class.is-invalid]="createForm.get('password')?.invalid && createForm.get('password')?.touched">
                      <div class="invalid-feedback">
                        Le mot de passe est requis (minimum 6 caractères)
                      </div>
                    </div>

                    <!-- Informations professionnelles -->
                    <div class="row">
                      <div class="col-md-6 mb-3">
                        <label for="createSpeciality" class="form-label">Spécialité *</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          id="createSpeciality" 
                          formControlName="speciality"
                          [class.is-invalid]="createForm.get('speciality')?.invalid && createForm.get('speciality')?.touched">
                        <div class="invalid-feedback">
                          La spécialité est requise
                        </div>
                      </div>
                      <div class="col-md-6 mb-3">
                        <label for="createPhone" class="form-label">Téléphone</label>
                        <input 
                          type="tel" 
                          class="form-control" 
                          id="createPhone" 
                          formControlName="phone">
                      </div>
                    </div>

                    <!-- Boutons d'action -->
                    <div class="d-flex justify-content-end gap-2">
                      <button 
                        type="button" 
                        class="btn btn-outline-secondary"
                        (click)="resetCreateForm()">
                        <i class="fas fa-undo me-2"></i>
                        Réinitialiser
                      </button>
                      <button 
                        type="submit" 
                        class="btn btn-primary" 
                        [disabled]="!createForm.valid || createLoading">
                        <i class="fas fa-save me-2" *ngIf="!createLoading"></i>
                        <div class="spinner-border spinner-border-sm me-2" *ngIf="createLoading"></div>
                        {{ createLoading ? 'Création...' : 'Créer le médecin' }}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <!-- Informations du docteur existant et formulaire de modification -->
            <div [class]="isNewDoctor ? 'col-lg-6' : 'col-12'" *ngIf="!isNewDoctor || (doctorData && !isNewDoctor)">
              
              <!-- Informations actuelles du docteur -->
              <div class="card mb-4" *ngIf="!isNewDoctor && doctorData">
                <div class="card-header bg-info text-white">
                  <h5 class="mb-0">
                    <i class="fas fa-user me-2"></i>
                    Informations actuelles
                  </h5>
                </div>
                <div class="card-body">
                  <div class="row">
                    <div class="col-md-6">
                      <p><strong>Nom complet:</strong> {{ doctorData.first_name }} {{ doctorData.last_name }}</p>
                      <p><strong>Email:</strong> {{ doctorData.email }}</p>
                      <p><strong>Spécialité:</strong> {{ doctorData.speciality || 'Non définie' }}</p>
                    </div>
                    <div class="col-md-6">
                      <p><strong>Téléphone:</strong> {{ doctorData.phone || 'Non renseigné' }}</p>
                      <p><strong>Créé le:</strong> {{ doctorData.created_at | date:'dd/MM/yyyy à HH:mm' }}</p>
                      <p *ngIf="doctorData.last_login"><strong>Dernière connexion:</strong> {{ doctorData.last_login | date:'dd/MM/yyyy à HH:mm' }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Formulaire de modification -->
              <div class="card" *ngIf="!isNewDoctor">
                <div class="card-header bg-warning text-dark">
                  <h5 class="mb-0">
                    <i class="fas fa-edit me-2"></i>
                    Modifier les informations
                  </h5>
                </div>
                <div class="card-body">
                  <form [formGroup]="updateForm" (ngSubmit)="onUpdateSubmit()">
                    <!-- Informations personnelles -->
                    <div class="row">
                      <div class="col-md-6 mb-3">
                        <label for="updateFirstName" class="form-label">Prénom</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          id="updateFirstName" 
                          formControlName="first_name">
                      </div>
                      <div class="col-md-6 mb-3">
                        <label for="updateLastName" class="form-label">Nom</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          id="updateLastName" 
                          formControlName="last_name">
                      </div>
                    </div>

                    <!-- Email et mot de passe -->
                    <div class="mb-3">
                      <label for="updateEmail" class="form-label">Email</label>
                      <input 
                        type="email" 
                        class="form-control" 
                        id="updateEmail" 
                        formControlName="email"
                        [class.is-invalid]="updateForm.get('email')?.invalid && updateForm.get('email')?.touched">
                      <div class="invalid-feedback">
                        L'email doit être valide
                      </div>
                    </div>

                    <div class="mb-3">
                      <label for="updatePassword" class="form-label">Nouveau mot de passe</label>
                      <input 
                        type="password" 
                        class="form-control" 
                        id="updatePassword" 
                        formControlName="password"
                        placeholder="Laisser vide pour ne pas changer">
                      <small class="form-text text-muted">Laisser vide si vous ne voulez pas changer le mot de passe</small>
                    </div>

                    <!-- Informations professionnelles -->
                    <div class="row">
                      <div class="col-md-6 mb-3">
                        <label for="updateSpeciality" class="form-label">Spécialité</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          id="updateSpeciality" 
                          formControlName="speciality">
                      </div>
                      <div class="col-md-6 mb-3">
                        <label for="updatePhone" class="form-label">Téléphone</label>
                        <input 
                          type="tel" 
                          class="form-control" 
                          id="updatePhone" 
                          formControlName="phone">
                      </div>
                    </div>

                    <!-- Boutons d'action -->
                    <div class="d-flex justify-content-end gap-2">
                      <button 
                        type="button" 
                        class="btn btn-outline-secondary"
                        (click)="resetUpdateForm()">
                        <i class="fas fa-undo me-2"></i>
                        Annuler les modifications
                      </button>
                      <button 
                        type="submit" 
                        class="btn btn-warning" 
                        [disabled]="!updateForm.valid || updateLoading">
                        <i class="fas fa-save me-2" *ngIf="!updateLoading"></i>
                        <div class="spinner-border spinner-border-sm me-2" *ngIf="updateLoading"></div>
                        {{ updateLoading ? 'Mise à jour...' : 'Mettre à jour' }}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <!-- Bouton de suppression -->
              <div class="card mt-4 border-danger" *ngIf="!isNewDoctor">
                <div class="card-header bg-danger text-white">
                  <h5 class="mb-0">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Zone dangereuse
                  </h5>
                </div>
                <div class="card-body">
                  <p class="text-danger">
                    <strong>Attention:</strong> La suppression d'un médecin est une action irréversible. 
                    Toutes les données associées seront définitivement perdues.
                  </p>
                  <button 
                    type="button" 
                    class="btn btn-danger" 
                    (click)="confirmDelete()"
                    [disabled]="deleteLoading">
                    <i class="fas fa-trash me-2" *ngIf="!deleteLoading"></i>
                    <div class="spinner-border spinner-border-sm me-2" *ngIf="deleteLoading"></div>
                    {{ deleteLoading ? 'Suppression...' : 'Supprimer ce médecin' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal de confirmation de suppression -->
      <div class="modal fade" id="deleteConfirmModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-danger text-white">
              <h5 class="modal-title">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Confirmer la suppression
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <p>Êtes-vous sûr de vouloir supprimer ce médecin ?</p>
              <div class="alert alert-warning" *ngIf="doctorData">
                <strong>{{ doctorData.first_name }} {{ doctorData.last_name }}</strong><br>
                <small>{{ doctorData.email }} - {{ doctorData.speciality }}</small>
              </div>
              <p class="text-danger">
                <strong>Cette action est irréversible !</strong> Toutes les données associées à ce médecin seront définitivement supprimées.
              </p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
              <button 
                type="button" 
                class="btn btn-danger" 
                (click)="deleteDoctor()"
                [disabled]="deleteLoading">
                <i class="fas fa-trash me-2" *ngIf="!deleteLoading"></i>
                <div class="spinner-border spinner-border-sm me-2" *ngIf="deleteLoading"></div>
                {{ deleteLoading ? 'Suppression...' : 'Supprimer définitivement' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      border: 1px solid #e3e6f0;
    }
    
    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .form-control:focus {
      border-color: #4e73df;
      box-shadow: 0 0 0 0.2rem rgba(78, 115, 223, 0.25);
    }
    
    .btn {
      transition: all 0.2s ease;
    }
    
    .btn:hover {
      transform: translateY(-1px);
    }
    
    .alert {
      border-left: 4px solid;
    }
    
    .alert-danger {
      border-left-color: #e74c3c;
    }
    
    .alert-success {
      border-left-color: #27ae60;
    }
    
    .alert-warning {
      border-left-color: #f39c12;
    }
    
    .spinner-border-sm {
      width: 1rem;
      height: 1rem;
    }
    
    .card-header {
      font-weight: 600;
    }
    
    .border-danger {
      border-color: #dc3545 !important;
    }
    
    .gap-2 {
      gap: 0.5rem;
    }
  `]
})
export class DoctorDetailComponent implements OnInit {
  // Formulaires
  createForm!: FormGroup;
  updateForm!: FormGroup;
  
  // États
  isNewDoctor: boolean = true;
  isAdmin: boolean = false;
  doctorId: string | null = null;
  doctorData: DoctorInfo | null = null;
  
  // Loading states
  loading = false;
  createLoading = false;
  updateLoading = false;
  deleteLoading = false;
  
  // Messages
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private doctorService: DoctorService,
    private authService: AuthService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.checkAdminPermissions();
    this.doctorId = this.route.snapshot.paramMap.get('id');
    this.isNewDoctor = !this.doctorId || this.doctorId === 'new';

    if (!this.isNewDoctor && this.doctorId && this.isAdmin) {
      this.loadDoctorData(this.doctorId);
    }
  }

  private initializeForms(): void {
    // Formulaire de création
    this.createForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      speciality: ['', Validators.required],
      phone: ['']
    });

    // Formulaire de mise à jour
    this.updateForm = this.fb.group({
      first_name: [''],
      last_name: [''],
      email: ['', Validators.email],
      password: [''],
      speciality: [''],
      phone: ['']
    });
  }

  private checkAdminPermissions(): void {
    this.isAdmin = this.doctorService.isAdmin();
    
    if (!this.isAdmin) {
      this.errorMessage = 'Vous devez être administrateur pour accéder à cette page.';
    }
  }

  private loadDoctorData(userId: string): void {
    this.loading = true;
    this.clearMessages();
    
    this.doctorService.getDoctorById(userId).subscribe({
      next: (response: DoctorResponse) => {
        // Construire les données du docteur à partir de la réponse
        if (response.doctor) {
          this.doctorData = {
            user_id: response.doctor.user_id,
            email: response.doctor.email,
            first_name: response.doctor.name?.split(' ')[0] || '',
            last_name: response.doctor.name?.split(' ').slice(1).join(' ') || '',
            created_at: response.created_at,
            last_login: response.last_login,
            doctor_id: response.doctor._id,
            name: response.doctor.name,
            phone: response.doctor.phone,
            speciality: response.doctor.speciality
          };
          
          // Pré-remplir le formulaire de mise à jour
          this.updateForm.patchValue({
            first_name: this.doctorData.first_name,
            last_name: this.doctorData.last_name,
            email: this.doctorData.email,
            speciality: this.doctorData.speciality,
            phone: this.doctorData.phone
          });
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading doctor:', error);
        this.errorMessage = 'Erreur lors du chargement des données du médecin.';
        this.loading = false;
      }
    });
  }

  onCreateSubmit(): void {
    if (this.createForm.valid) {
      this.createLoading = true;
      this.clearMessages();
      
      const doctorData: CreateDoctorRequest = this.createForm.value;
      
      this.doctorService.createDoctor(doctorData).subscribe({
        next: (response) => {
          this.successMessage = 'Médecin créé avec succès !';
          this.createLoading = false;
          this.resetCreateForm();
          
          // Rediriger vers la liste après un délai
          setTimeout(() => {
            this.goBack();
          }, 2000);
        },
        error: (error) => {
          console.error('Error creating doctor:', error);
          this.errorMessage = error.error?.message || 'Erreur lors de la création du médecin.';
          this.createLoading = false;
        }
      });
    }
  }

  onUpdateSubmit(): void {
    if (this.updateForm.valid && this.doctorId) {
      this.updateLoading = true;
      this.clearMessages();
      
      // Filtrer les champs vides pour ne pas les envoyer
      const updateData: UpdateDoctorRequest = {};
      const formValue = this.updateForm.value;
      
      Object.keys(formValue).forEach(key => {
        if (formValue[key] && formValue[key].trim() !== '') {
          updateData[key as keyof UpdateDoctorRequest] = formValue[key];
        }
      });
      
      this.doctorService.updateDoctor(this.doctorId, updateData).subscribe({
        next: (response) => {
          this.successMessage = 'Médecin mis à jour avec succès !';
          this.updateLoading = false;
          
          // Recharger les données
          this.loadDoctorData(this.doctorId!);
        },
        error: (error) => {
          console.error('Error updating doctor:', error);
          this.errorMessage = error.error?.message || 'Erreur lors de la mise à jour du médecin.';
          this.updateLoading = false;
        }
      });
    }
  }

  confirmDelete(): void {
    // Ouvrir le modal de confirmation
    const modal = new (window as any).bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    modal.show();
  }

  deleteDoctor(): void {
    if (this.doctorId) {
      this.deleteLoading = true;
      this.clearMessages();
      
      this.doctorService.deleteDoctor(this.doctorId).subscribe({
        next: (response) => {
          this.successMessage = 'Médecin supprimé avec succès !';
          this.deleteLoading = false;
          
          // Fermer le modal
          const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
          modal?.hide();
          
          // Rediriger vers la liste après un délai
          setTimeout(() => {
            this.goBack();
          }, 2000);
        },
        error: (error) => {
          console.error('Error deleting doctor:', error);
          this.errorMessage = error.error?.message || 'Erreur lors de la suppression du médecin.';
          this.deleteLoading = false;
          
          // Fermer le modal
          const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
          modal?.hide();
        }
      });
    }
  }

  resetCreateForm(): void {
    this.createForm.reset();
    this.clearMessages();
  }

  resetUpdateForm(): void {
    if (this.doctorData) {
      this.updateForm.patchValue({
        first_name: this.doctorData.first_name,
        last_name: this.doctorData.last_name,
        email: this.doctorData.email,
        speciality: this.doctorData.speciality,
        phone: this.doctorData.phone,
        password: ''
      });
    }
    this.clearMessages();
  }

  clearMessages(): void {
    this.errorMessage = null;
    this.successMessage = null;
  }

  clearError(): void {
    this.errorMessage = null;
  }

  clearSuccess(): void {
    this.successMessage = null;
  }

  goBack(): void {
    this.router.navigate(['/doctors']);
  }
}