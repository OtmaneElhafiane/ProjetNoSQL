import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

// Import services AND their specific interfaces
import {
    DoctorService,
    DoctorInfo as ServiceDoctor,
    DoctorsListResponse
} from '../../core/services/doctor.service';
import {
    PatientService,
    Patient as ServicePatient,
    PatientResponse
} from '../../core/services/patient.service';
import {
    ConsultationService,
    Consultation as ServiceConsultation
} from '../../core/services/consultation.service';

// --- Use Type Aliases for clarity, referencing the service interfaces ---
type Doctor = ServiceDoctor;
type Patient = ServicePatient;
type Consultation = ServiceConsultation;

declare var bootstrap: any;

@Component({
  selector: 'app-admin-dashboard',
  template: `
    <div class="container-fluid">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="h3">Tableau de bord Administrateur</h2>
        <div class="d-flex gap-2">
          <button class="btn btn-success" (click)="addDoctor()"><i class="fas fa-user-md me-2"></i>Ajouter Médecin</button>
          <button class="btn btn-primary" (click)="addPatient()"><i class="fas fa-user-plus me-2"></i>Ajouter Patient</button>
          <button class="btn btn-info text-white" (click)="addConsultation()"><i class="fas fa-calendar-plus me-2"></i>Nouvelle Consultation</button>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="row mb-4">
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="card stats-card h-100 bg-primary text-white">
                <div class="card-body d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="card-title text-uppercase">Total Médecins</h6>
                        <h2 class="mb-0 fw-bold">{{ doctors.length }}</h2>
                    </div>
                    <i class="fas fa-user-md fa-3x opacity-75"></i>
                </div>
            </div>
        </div>
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="card stats-card h-100 bg-success text-white">
                <div class="card-body d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="card-title text-uppercase">Total Patients</h6>
                        <h2 class="mb-0 fw-bold">{{ patients.length }}</h2>
                    </div>
                    <i class="fas fa-users fa-3x opacity-75"></i>
                </div>
            </div>
        </div>
        <div class="col-lg-4 col-md-12 mb-4">
            <div class="card stats-card h-100 bg-info text-white">
                <div class="card-body d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="card-title text-uppercase">Consultations (30 Jours)</h6>
                        <h2 class="mb-0 fw-bold">{{ getMonthlyConsultationsCount() }}</h2>
                    </div>
                    <i class="fas fa-notes-medical fa-3x opacity-75"></i>
                </div>
            </div>
        </div>
      </div>

      <!-- Doctors Section -->
      <div class="card mb-5">
        <div class="card-header"><h5 class="mb-0"><i class="fas fa-user-md me-2"></i>Gestion des Médecins</h5></div>
        <div class="card-body pb-0">
          <div class="row g-3 mb-3">
            <div class="col-md-4">
              <label for="doctorSpecialityFilter" class="form-label">Spécialité</label>
              <select id="doctorSpecialityFilter" class="form-select" [(ngModel)]="doctorFilters.speciality" (change)="applyDoctorFilters()">
                <option value="">Toutes</option>
                <option *ngFor="let speciality of uniqueSpecialities" [value]="speciality">{{ speciality }}</option>
              </select>
            </div>
            <div class="col-md-6">
              <label for="doctorSearch" class="form-label">Rechercher</label>
              <input type="text" id="doctorSearch" class="form-control" placeholder="Nom, email..." [(ngModel)]="doctorFilters.searchTerm" (input)="applyDoctorFilters()">
            </div>
            <div class="col-md-2 d-flex align-items-end">
              <button class="btn btn-outline-secondary w-100" (click)="resetDoctorFilters()"><i class="fas fa-sync-alt me-1"></i>Reset</button>
            </div>
          </div>
        </div>
        <div class="table-responsive" *ngIf="!loadingDoctors">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th (click)="sortDoctors('name')">Nom <i class="fas" [ngClass]="getSortIcon('doctors', 'name')"></i></th>
                <th>Email</th><th>Téléphone</th><th>Spécialité</th>
                <th (click)="sortDoctors('created_at')">Date d'ajout <i class="fas" [ngClass]="getSortIcon('doctors', 'created_at')"></i></th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let doctor of paginatedDoctors">
                <td>Dr. {{ doctor.first_name }} {{ doctor.last_name }}</td>
                <td>{{ doctor.email }}</td><td>{{ doctor.phone || '-' }}</td>
                <td><span class="badge bg-light text-dark">{{ doctor.speciality }}</span></td>
                <td>{{ doctor.created_at | date:'dd/MM/yyyy' }}</td>
                <td>
                  <button class="btn btn-sm btn-outline-info me-1" (click)="viewDoctor(doctor)" title="Détails"><i class="fas fa-eye"></i></button>
                  <button class="btn btn-sm btn-outline-warning me-1" (click)="editDoctor(doctor)" title="Modifier"><i class="fas fa-edit"></i></button>

                </td>
              </tr>
              <tr *ngIf="filteredDoctors.length === 0"><td colspan="6" class="text-center text-muted py-5"><h5>Aucun médecin trouvé</h5></td></tr>
            </tbody>
          </table>
        </div>
        <div *ngIf="loadingDoctors" class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>
        <div class="card-footer" *ngIf="doctorTotalPages > 1 && !loadingDoctors">
          <nav><ul class="pagination justify-content-center mb-0"><li class="page-item" [class.disabled]="doctorCurrentPage === 1"><a class="page-link" (click)="goToDoctorPage(doctorCurrentPage - 1)">Précédent</a></li><li class="page-item" *ngFor="let page of getDoctorVisiblePages()" [class.active]="page === doctorCurrentPage"><a class="page-link" (click)="goToDoctorPage(page)">{{ page }}</a></li><li class="page-item" [class.disabled]="doctorCurrentPage === doctorTotalPages"><a class="page-link" (click)="goToDoctorPage(doctorCurrentPage + 1)">Suivant</a></li></ul></nav>
        </div>
      </div>

      <!-- Patients Section -->
      <div class="card mb-5">
        <div class="card-header"><h5 class="mb-0"><i class="fas fa-users me-2"></i>Gestion des Patients</h5></div>
         <div class="card-body pb-0">
          <div class="row g-3 mb-3">
            <div class="col-md-9">
              <label for="patientSearch" class="form-label">Rechercher</label>
              <input type="text" id="patientSearch" class="form-control" placeholder="Nom, email, CIN..." [(ngModel)]="patientFilters.searchTerm" (input)="applyPatientFilters()">
            </div>
            <div class="col-md-3 d-flex align-items-end">
              <button class="btn btn-outline-secondary w-100" (click)="resetPatientFilters()"><i class="fas fa-sync-alt me-1"></i>Reset</button>
            </div>
          </div>
        </div>
        <div class="table-responsive" *ngIf="!loadingPatients">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th (click)="sortPatients('name')">Nom <i class="fas" [ngClass]="getSortIcon('patients', 'name')"></i></th>
                <th>Email</th><th>Téléphone</th><th>CIN</th>
                <th (click)="sortPatients('created_at')">Date d'ajout <i class="fas" [ngClass]="getSortIcon('patients', 'created_at')"></i></th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let patient of paginatedPatients">
                <td>{{ patient.first_name }} {{ patient.last_name }}</td>
                <td>{{ patient.email }}</td><td>{{ patient.phone || '-' }}</td><td>{{ patient.cin }}</td>
                <td>{{ patient.created_at | date:'dd/MM/yyyy' }}</td>
                <td>
                  <button class="btn btn-sm btn-outline-info me-1" (click)="viewPatient(patient)" title="Détails"><i class="fas fa-eye"></i></button>
                  <button class="btn btn-sm btn-outline-warning me-1" (click)="editPatient(patient)" title="Modifier"><i class="fas fa-edit"></i></button>
                  <button class="btn btn-sm btn-outline-success me-1" (click)="viewPatientHistory(patient)" title="Historique"><i class="fas fa-history"></i></button>
                </td>
              </tr>
              <tr *ngIf="filteredPatients.length === 0"><td colspan="6" class="text-center text-muted py-5"><h5>Aucun patient trouvé</h5></td></tr>
            </tbody>
          </table>
        </div>
        <div *ngIf="loadingPatients" class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>
        <div class="card-footer" *ngIf="patientTotalPages > 1 && !loadingPatients">
          <nav><ul class="pagination justify-content-center mb-0"><li class="page-item" [class.disabled]="patientCurrentPage === 1"><a class="page-link" (click)="goToPatientPage(patientCurrentPage - 1)">Précédent</a></li><li class="page-item" *ngFor="let page of getPatientVisiblePages()" [class.active]="page === patientCurrentPage"><a class="page-link" (click)="goToPatientPage(page)">{{ page }}</a></li><li class="page-item" [class.disabled]="patientCurrentPage === patientTotalPages"><a class="page-link" (click)="goToPatientPage(patientCurrentPage + 1)">Suivant</a></li></ul></nav>
        </div>
      </div>

      <!-- Consultations, Modals, etc. (No Changes) -->
    </div>
  `,
  styles: [`/* ... No changes needed in styles ... */`],
})
export class AdminDashboardComponent implements OnInit {
  // Data arrays using aliased types from services
  doctors: Doctor[] = [];
  patients: Patient[] = [];
  consultations: Consultation[] = [];

  // Local state arrays
  filteredDoctors: Doctor[] = [];
  filteredPatients: Patient[] = [];
  recentConsultations: Consultation[] = [];
  paginatedDoctors: Doctor[] = [];
  paginatedPatients: Patient[] = [];

  // UI State
  loadingDoctors = true;
  loadingPatients = true;
  loadingConsultations = true;
  error: string | null = null;
  successMessage: string | null = null;
  private confirmationModalInstance: any;

  // Pagination
  doctorCurrentPage = 1;
  doctorItemsPerPage = 5;
  doctorTotalPages = 0;

  patientCurrentPage = 1;
  patientItemsPerPage = 7;
  patientTotalPages = 0;

  // FIX: Filters now match the properties available in the service models
  doctorFilters = {speciality: '', searchTerm: ''};
  patientFilters = {searchTerm: ''};

  // FIX: Sorting fields match the properties available in the service models
  doctorSort: { field: keyof Doctor | 'name', direction: 'asc' | 'desc' } = {field: 'created_at', direction: 'desc'};
  patientSort: { field: keyof Patient | 'name', direction: 'asc' | 'desc' } = {field: 'created_at', direction: 'desc'};

  confirmationMessage = '';
  confirmAction: (() => void) | null = null;

  uniqueSpecialities: string[] = [];

  constructor(
    private router: Router,
    private doctorService: DoctorService,
    private patientService: PatientService,
    private consultationService: ConsultationService
  ) {
  }

  ngOnInit(): void {
    this.loadAllData();
    const modalElement = document.getElementById('confirmationModal');
    if (modalElement) {
      this.confirmationModalInstance = new bootstrap.Modal(modalElement);
    }
  }

  private loadAllData(): void {
    this.loadDoctors();
    this.loadPatients();
    this.loadConsultations();
  }

  private loadDoctors(): void {
    this.loadingDoctors = true;
    this.doctorService.getAllDoctors().pipe(
      finalize(() => this.loadingDoctors = false)
    ).subscribe({
      next: (response: DoctorsListResponse) => {
        this.doctors = response.doctors;
        this.updateUniqueSpecialities();
        this.applyDoctorFilters();
      },
      error: (err) => {
        this.error = "Erreur chargement médecins.";
      }
    });
  }

  private loadPatients(): void {
    this.loadingPatients = true;
    this.patientService.getAllPatients().pipe(
      finalize(() => this.loadingPatients = false)
    ).subscribe({
      next: (response: PatientResponse) => {
        this.patients = response.patients;
        this.applyPatientFilters();
      },
      error: (err) => {
        this.error = "Erreur chargement patients.";
      }
    });
  }

  private loadConsultations(): void {
    this.loadingConsultations = true;
    this.consultationService.getConsultations().pipe(
      finalize(() => this.loadingConsultations = false)
    ).subscribe({
      next: (consultations: Consultation[]) => {
        this.consultations = consultations;
        this.recentConsultations = [...this.consultations]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);
      },
      error: (err) => {
        this.error = "Erreur chargement consultations.";
      }
    });
  }

  confirmDeleteDoctor(doctor: Doctor): void {
    this.confirmationMessage = `Supprimer le Dr. ${doctor.first_name} ${doctor.last_name} ?`;
    this.confirmAction = () => this.deleteDoctor(doctor.user_id);
    this.confirmationModalInstance.show();
  }

  confirmDeletePatient(patient: Patient): void {
    this.confirmationMessage = `Supprimer ${patient.first_name} ${patient.last_name} ?`;
    this.confirmAction = () => this.deletePatient(patient.user_id);
    this.confirmationModalInstance.show();
  }

  executeConfirmAction(): void {
    if (this.confirmAction) this.confirmAction();
    this.confirmationModalInstance.hide();
    this.confirmAction = null;
  }

  private deleteDoctor(userId: string): void {
    this.doctorService.deleteDoctor(userId).subscribe({
      next: () => {
        this.doctors = this.doctors.filter(d => d.user_id !== userId);
        this.applyDoctorFilters();
        this.setSuccessMessage('Médecin supprimé.');
      },
      error: (err) => {
        this.error = 'La suppression a échoué.';
      }
    });
  }

  private deletePatient(userId: string): void {
    this.patientService.deletePatient(userId).subscribe({
      next: () => {
        this.patients = this.patients.filter(p => p.user_id !== userId);
        this.applyPatientFilters();
        this.setSuccessMessage('Patient supprimé.');
      },
      error: (err) => {
        this.error = 'La suppression a échoué.';
      }
    });
  }

  addDoctor() {
    this.router.navigate(['/admin/doctors/add']);
  }

  editDoctor(doctor: Doctor) {
    this.router.navigate(['/admin/doctors/edit', doctor.user_id]);
  }

  viewDoctor(doctor: Doctor) {
    this.router.navigate(['/admin/doctors/view', doctor.user_id]);
  }

  addPatient() {
    this.router.navigate(['/admin/patients/add']);
  }

  editPatient(patient: Patient) {
    this.router.navigate(['/admin/patients/edit', patient.user_id]);
  }

  viewPatient(patient: Patient) {
    this.router.navigate(['/admin/patients/view', patient.user_id]);
  }

  viewPatientHistory(patient: Patient) {
    this.router.navigate(['/admin/patients/history', patient.user_id]);
  }

  addConsultation() {
    this.router.navigate(['/admin/consultations/add']);
  }

  editConsultation(consultation: Consultation) {
    this.router.navigate(['/admin/consultations/edit', consultation._id]);
  }

  viewConsultation(consultation: Consultation) {
    this.router.navigate(['/admin/consultations/view', consultation._id]);
  }

  viewAllConsultations() {
    this.router.navigate(['/admin/consultations']);
  }

  applyDoctorFilters(): void {
    this.doctorCurrentPage = 1;
    let tempDoctors = [...this.doctors];
    const {speciality, searchTerm} = this.doctorFilters;

    if (speciality) {
      tempDoctors = tempDoctors.filter(d => d.speciality === speciality);
    }
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      tempDoctors = tempDoctors.filter(d =>
        `${d.first_name} ${d.last_name}`.toLowerCase().includes(lowerSearchTerm) ||
        d.email.toLowerCase().includes(lowerSearchTerm)
      );
    }
    this.filteredDoctors = tempDoctors;
    this.sortAndPaginateDoctors();
  }

  resetDoctorFilters(): void {
    this.doctorFilters = {speciality: '', searchTerm: ''};
    this.applyDoctorFilters();
  }

  applyPatientFilters(): void {
    this.patientCurrentPage = 1;
    const lowerSearchTerm = this.patientFilters.searchTerm.toLowerCase();

    this.filteredPatients = this.patients.filter(p =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(lowerSearchTerm) ||
      p.email.toLowerCase().includes(lowerSearchTerm) ||
      p.cin.toLowerCase().includes(lowerSearchTerm)
    );
    this.sortAndPaginatePatients();
  }

  resetPatientFilters(): void {
    this.patientFilters = {searchTerm: ''};
    this.applyPatientFilters();
  }

  private sortAndPaginateDoctors(): void {
    this.sortDoctors(this.doctorSort.field, true);
  }

  sortDoctors(field: keyof Doctor | 'name', keepDirection = false): void {
    if (!keepDirection) {
      if (this.doctorSort.field === field) {
        this.doctorSort.direction = this.doctorSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        this.doctorSort.field = field;
        this.doctorSort.direction = 'asc';
      }
    }

    this.filteredDoctors.sort((a, b) => {
      let valA: any, valB: any;
      if (field === 'name') {
        valA = `${a.first_name} ${a.last_name}`;
        valB = `${b.first_name} ${b.last_name}`;
      } else {
        valA = a[field as keyof Doctor] ?? '';
        valB = b[field as keyof Doctor] ?? '';
      }
      const comparison = valA < valB ? -1 : valA > valB ? 1 : 0;
      return this.doctorSort.direction === 'asc' ? comparison : -comparison;
    });

    this.updateDoctorPagination();
  }

  private sortAndPaginatePatients(): void {
    this.sortPatients(this.patientSort.field, true);
  }

  sortPatients(field: keyof Patient | 'name', keepDirection = false): void {
    if (!keepDirection) {
      if (this.patientSort.field === field) {
        this.patientSort.direction = this.patientSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        this.patientSort.field = field;
        this.patientSort.direction = 'asc';
      }
    }

    this.filteredPatients.sort((a, b) => {
      let valA: any, valB: any;
      if (field === 'name') {
        valA = `${a.first_name} ${a.last_name}`;
        valB = `${b.first_name} ${b.last_name}`;
      } else {
        valA = a[field as keyof Patient] ?? '';
        valB = b[field as keyof Patient] ?? '';
      }
      const comparison = valA < valB ? -1 : valA > valB ? 1 : 0;
      return this.patientSort.direction === 'asc' ? comparison : -comparison;
    });

    this.updatePatientPagination();
  }

  updateDoctorPagination(): void {
    this.doctorTotalPages = Math.ceil(this.filteredDoctors.length / this.doctorItemsPerPage);
    const start = (this.doctorCurrentPage - 1) * this.doctorItemsPerPage;
    const end = start + this.doctorItemsPerPage;
    this.paginatedDoctors = this.filteredDoctors.slice(start, end);
  }

  goToDoctorPage(page: number): void {
    if (page >= 1 && page <= this.doctorTotalPages) {
      this.doctorCurrentPage = page;
      this.updateDoctorPagination();
    }
  }

  updatePatientPagination(): void {
    this.patientTotalPages = Math.ceil(this.filteredPatients.length / this.patientItemsPerPage);
    const start = (this.patientCurrentPage - 1) * this.patientItemsPerPage;
    const end = start + this.patientItemsPerPage;
    this.paginatedPatients = this.filteredPatients.slice(start, end);
  }

  goToPatientPage(page: number): void {
    if (page >= 1 && page <= this.patientTotalPages) {
      this.patientCurrentPage = page;
      this.updatePatientPagination();
    }
  }

  getSortIcon(type: 'doctors' | 'patients', field: string): string {
    const sortInfo = type === 'doctors' ? this.doctorSort : this.patientSort;
    if (sortInfo.field !== field) return 'fa-sort text-muted';
    return sortInfo.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  private updateUniqueSpecialities(): void {
    const specialities = this.doctors.map(d => d.speciality).filter(Boolean);
    this.uniqueSpecialities = [...new Set(specialities as string[])].sort();
  }

  getMonthlyConsultationsCount(): number {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return this.consultations.filter(c => new Date(c.date) > oneMonthAgo).length;
  }

  private setSuccessMessage(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.successMessage = null, 4000);
  }

  getDoctorVisiblePages(): number[] {
    const visiblePages = [];
    for (let i = Math.max(1, this.doctorCurrentPage - 2); i <= Math.min(this.doctorTotalPages, this.doctorCurrentPage + 2); i++) {
      visiblePages.push(i);
    }
    return visiblePages;
  }

  getPatientVisiblePages(): number[] {
    const visiblePages = [];
    for (let i = Math.max(1, this.patientCurrentPage - 2); i <= Math.min(this.patientTotalPages, this.patientCurrentPage + 2); i++) {
      visiblePages.push(i);
    }
    return visiblePages;
  }



}

