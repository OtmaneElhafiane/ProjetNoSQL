import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  PatientService,
  Consultation,
  ConsultationHistoryResponse
} from '../../core/services/patient.service';

@Component({
  selector: 'app-consultation-history',
  template: `
    <div class="container">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>Historique des consultations</h2>
        <button class="btn btn-outline-secondary" (click)="goBack()">
          <i class="fas fa-arrow-left me-2"></i>
          Retour au tableau de bord
        </button>
      </div>

      <!-- Filtres -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-3">
              <label for="statusFilter" class="form-label">Statut</label>
              <select
                id="statusFilter"
                class="form-select"
                [(ngModel)]="selectedStatus"
                (change)="applyFilters()">
                <option value="">Tous les statuts</option>
                <option value="completed">Terminées</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmées</option>
                <option value="cancelled">Annulées</option>
              </select>
            </div>
            <div class="col-md-3">
              <label for="dateFrom" class="form-label">Date de début</label>
              <input
                type="date"
                id="dateFrom"
                class="form-control"
                [(ngModel)]="dateFrom"
                (change)="applyFilters()">
            </div>
            <div class="col-md-3">
              <label for="dateTo" class="form-label">Date de fin</label>
              <input
                type="date"
                id="dateTo"
                class="form-control"
                [(ngModel)]="dateTo"
                (change)="applyFilters()">
            </div>
            <div class="col-md-3">
              <label for="searchTerm" class="form-label">Rechercher</label>
              <input
                type="text"
                id="searchTerm"
                class="form-control"
                placeholder="Médecin, motif..."
                [(ngModel)]="searchTerm"
                (input)="applyFilters()">
            </div>
          </div>
          <div class="row mt-3">
            <div class="col-12">
              <button class="btn btn-outline-primary me-2" (click)="resetFilters()">
                <i class="fas fa-refresh me-1"></i>
                Réinitialiser
              </button>
              <small class="text-muted">
                {{ filteredConsultations.length }} consultation(s) trouvée(s)
              </small>
            </div>
          </div>
        </div>
      </div>

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

      <!-- Tableau des consultations -->
      <div class="card" *ngIf="!loading">
        <div class="card-header">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="mb-0">
              <i class="fas fa-history me-2"></i>
              Mes consultations
            </h5>
            <div class="d-flex align-items-center">
              <span class="me-3">Consultations par page:</span>
              <select
                class="form-select form-select-sm"
                style="width: auto;"
                [(ngModel)]="itemsPerPage"
                (change)="onItemsPerPageChange()">
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th style="cursor: pointer;" (click)="sortBy('date')">
                    Date
                    <i class="fas fa-sort ms-1"
                       [class.fa-sort-up]="sortField === 'date' && sortDirection === 'asc'"
                       [class.fa-sort-down]="sortField === 'date' && sortDirection === 'desc'"></i>
                  </th>
                  <th style="cursor: pointer;" (click)="sortBy('doctor.name')">
                    Médecin
                    <i class="fas fa-sort ms-1"
                       [class.fa-sort-up]="sortField === 'doctor.name' && sortDirection === 'asc'"
                       [class.fa-sort-down]="sortField === 'doctor.name' && sortDirection === 'desc'"></i>
                  </th>
                  <th>Spécialité</th>
                  <th>Motif</th>
                  <th style="cursor: pointer;" (click)="sortBy('status')">
                    Statut
                    <i class="fas fa-sort ms-1"
                       [class.fa-sort-up]="sortField === 'status' && sortDirection === 'asc'"
                       [class.fa-sort-down]="sortField === 'status' && sortDirection === 'desc'"></i>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let consultation of paginatedConsultations">
                  <td>{{ consultation.date | date:'dd/MM/yyyy à HH:mm' }}</td>
                  <td>
                    <div class="d-flex align-items-center">
                      <div class="doctor-avatar me-2">
                        <i class="fas fa-user-md"></i>
                      </div>
                      <div>
                        <div class="fw-semibold">Dr. {{ consultation.doctor.name }}</div>
                        <small class="text-muted" *ngIf="consultation.doctor.email">
                          {{ consultation.doctor.email }}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="badge bg-light text-dark">
                      {{ consultation.doctor.speciality }}
                    </span>
                  </td>
                  <td>
                    <div class="consultation-motif">
                      {{ consultation.motif }}
                    </div>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="getStatusBadgeClass(consultation.status)">
                      {{ getStatusText(consultation.status) }}
                    </span>
                  </td>
                  <td>
                    <div class="btn-group" role="group">
                      <button
                        class="btn btn-sm btn-outline-info"
                        (click)="showConsultationDetails(consultation)"
                        title="Voir les détails">
                        <i class="fas fa-eye"></i>
                      </button>
                      <button
                        class="btn btn-sm btn-outline-secondary"
                        (click)="printConsultation(consultation)"
                        title="Imprimer">
                        <i class="fas fa-print"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="paginatedConsultations.length === 0">
                  <td colspan="6" class="text-center text-muted py-5">
                    <i class="fas fa-calendar-times fa-3x d-block mb-3"></i>
                    <h5>Aucune consultation trouvée</h5>
                    <p class="mb-0">Aucune consultation ne correspond à vos critères de recherche.</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pagination -->
        <div class="card-footer" *ngIf="totalPages > 1">
          <nav aria-label="Navigation des pages">
            <ul class="pagination justify-content-center mb-0">
              <li class="page-item" [class.disabled]="currentPage === 1">
                <button class="page-link" (click)="goToPage(1)" [disabled]="currentPage === 1">
                  <i class="fas fa-angle-double-left"></i>
                </button>
              </li>
              <li class="page-item" [class.disabled]="currentPage === 1">
                <button class="page-link" (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 1">
                  <i class="fas fa-angle-left"></i>
                </button>
              </li>

              <li class="page-item"
                  *ngFor="let page of getVisiblePages()"
                  [class.active]="page === currentPage">
                <button class="page-link" (click)="goToPage(page)">
                  {{ page }}
                </button>
              </li>

              <li class="page-item" [class.disabled]="currentPage === totalPages">
                <button class="page-link" (click)="goToPage(currentPage + 1)" [disabled]="currentPage === totalPages">
                  <i class="fas fa-angle-right"></i>
                </button>
              </li>
              <li class="page-item" [class.disabled]="currentPage === totalPages">
                <button class="page-link" (click)="goToPage(totalPages)" [disabled]="currentPage === totalPages">
                  <i class="fas fa-angle-double-right"></i>
                </button>
              </li>
            </ul>
          </nav>
          <div class="text-center mt-2">
            <small class="text-muted">
              Page {{ currentPage }} sur {{ totalPages }}
              ({{ startIndex + 1 }} - {{ endIndex }} sur {{ filteredConsultations.length }} consultations)
            </small>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal pour les détails de la consultation -->
    <div class="modal fade" id="consultationModal" tabindex="-1" aria-labelledby="consultationModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-xl">
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
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Fermer
            </button>
            <button type="button" class="btn btn-primary" (click)="printConsultation(selectedConsultation!)">
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
      border: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border-radius: 12px;
    }

    .card-header {
      background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
      color: white;
      border-radius: 12px 12px 0 0 !important;
      border-bottom: none;
    }

    .table th {
      border-top: none;
      font-weight: 600;
      color: #495057;
      background: #f8f9fa;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .table td {
      vertical-align: middle;
      border-color: #e9ecef;
    }

    .table-hover tbody tr:hover {
      background-color: #f8f9fa;
    }

    .doctor-avatar {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #007bff, #0056b3);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.2rem;
    }

    .consultation-motif {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .badge {
      font-size: 0.75rem;
      padding: 0.375rem 0.75rem;
      border-radius: 6px;
    }

    .btn-group .btn {
      margin-right: 0;
    }

    .pagination .page-link {
      border: 1px solid #dee2e6;
      color: #007bff;
      padding: 0.5rem 0.75rem;
    }

    .pagination .page-item.active .page-link {
      background: linear-gradient(135deg, #007bff, #0056b3);
      border-color: #007bff;
    }

    .pagination .page-link:hover {
      background-color: #e9ecef;
      border-color: #dee2e6;
    }

    .spinner-border {
      color: #007bff;
    }

    /* Styles pour le modal */
    .modal-xl {
      max-width: 1200px;
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

    /* Responsive */
    @media (max-width: 768px) {
      .info-item {
        flex-direction: column;
        align-items: flex-start;
      }

      .info-item strong {
        min-width: auto;
        margin-bottom: 5px;
      }

      .table-responsive {
        font-size: 0.9rem;
      }

      .consultation-motif {
        max-width: 150px;
      }

      .doctor-avatar {
        width: 35px;
        height: 35px;
        font-size: 1rem;
      }
    }

    /* Animations */
    .card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }

    .btn {
      transition: all 0.2s ease;
    }

    .table tbody tr {
      transition: background-color 0.2s ease;
    }
  `]
})
export class ConsultationHistoryComponent implements OnInit {
  consultations: Consultation[] = [];
  filteredConsultations: Consultation[] = [];
  paginatedConsultations: Consultation[] = [];
  selectedConsultation: Consultation | null = null;

  loading = true;
  error: string | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;

  // Filtres
  selectedStatus = '';
  dateFrom = '';
  dateTo = '';
  searchTerm = '';

  // Tri
  sortField = 'date';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(
    private router: Router,
    private patientService: PatientService
  ) {}

  ngOnInit(): void {
    this.loadConsultations();
  }

  private loadConsultations(): void {
    this.loading = true;
    this.error = null;

    this.patientService.getConsultationHistory().subscribe({
      next: (response: ConsultationHistoryResponse) => {
        this.consultations = response.consultations;
        this.applyFilters();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des consultations:', error);
        this.error = 'Erreur lors du chargement de l\'historique des consultations';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.consultations];

    // Filtre par statut
    if (this.selectedStatus) {
      filtered = filtered.filter(c => c.status === this.selectedStatus);
    }

    // Filtre par date
    if (this.dateFrom) {
      const fromDate = new Date(this.dateFrom);
      filtered = filtered.filter(c => new Date(c.date) >= fromDate);
    }

    if (this.dateTo) {
      const toDate = new Date(this.dateTo);
      toDate.setHours(23, 59, 59, 999); // Fin de journée
      filtered = filtered.filter(c => new Date(c.date) <= toDate);
    }

    // Filtre par terme de recherche
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.doctor.name.toLowerCase().includes(term) ||
        c.motif.toLowerCase().includes(term) ||
        c.doctor.speciality.toLowerCase().includes(term)
      );
    }

    this.filteredConsultations = filtered;
    this.sortConsultations();
    this.currentPage = 1; // Reset à la première page
    this.updatePagination();
  }

  sortConsultations(): void {
    this.filteredConsultations.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (this.sortField === 'doctor.name') {
        aValue = a.doctor.name;
        bValue = b.doctor.name;
      } else if (this.sortField === 'date') {
        aValue = new Date(a.date);
        bValue = new Date(b.date);
      } else {
        aValue = a[this.sortField as keyof Consultation];
        bValue = b[this.sortField as keyof Consultation];
      }

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.sortConsultations();
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredConsultations.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedConsultations = this.filteredConsultations.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;

    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, this.currentPage - 2);
      let end = Math.min(this.totalPages, start + maxVisible - 1);

      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.itemsPerPage, this.filteredConsultations.length);
  }

  resetFilters(): void {
    this.selectedStatus = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.searchTerm = '';
    this.sortField = 'date';
    this.sortDirection = 'desc';
    this.applyFilters();
  }

  showConsultationDetails(consultation: Consultation): void {
    this.selectedConsultation = consultation;

    const modalElement = document.getElementById('consultationModal');
    if (modalElement) {
      // @ts-ignore
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  printConsultation(consultation: Consultation): void {
    const printContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007bff; padding-bottom: 20px;">
          <h1 style="color: #007bff; margin: 0;">Consultation Médicale</h1>
          <p style="color: #666; margin: 5px 0;">Détails de la consultation</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
          <div>
            <h3 style="color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Informations générales</h3>
            <p><strong>Date:</strong> ${new Date(consultation.date).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })}</p>
            <p><strong>Motif:</strong> ${consultation.motif}</p>
            <p><strong>Statut:</strong> ${this.getStatusText(consultation.status)}</p>
            ${consultation.created_at ? `<p><strong>Créée le:</strong> ${new Date(consultation.created_at).toLocaleDateString('fr-FR')}</p>` : ''}
          </div>

          <div>
            <h3 style="color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Médecin traitant</h3>
            <p><strong>Nom:</strong> Dr. ${consultation.doctor.name}</p>
            <p><strong>Spécialité:</strong> ${consultation.doctor.speciality}</p>
            ${consultation.doctor.email ? `<p><strong>Email:</strong> ${consultation.doctor.email}</p>` : ''}
            ${consultation.doctor.phone ? `<p><strong>Téléphone:</strong> ${consultation.doctor.phone}</p>` : ''}
          </div>
        </div>

        ${consultation.diagnostic ? `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Diagnostic</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff;">
              <p style="margin: 0; line-height: 1.6;">${consultation.diagnostic}</p>
            </div>
          </div>
        ` : ''}

        ${consultation.traitement ? `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Traitement prescrit</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
              <p style="margin: 0; line-height: 1.6;">${consultation.traitement}</p>
            </div>
          </div>
        ` : ''}

        ${consultation.notes ? `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Notes additionnelles</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
              <p style="margin: 0; line-height: 1.6;">${consultation.notes}</p>
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
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Consultation - Dr. ${consultation.doctor.name}</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
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

  goBack(): void {
    this.router.navigate(['']);
  }

  refreshData(): void {
    this.loadConsultations();
  }
}
