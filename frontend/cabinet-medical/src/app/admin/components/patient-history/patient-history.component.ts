import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { ConsultationService, Consultation } from '../../../core/services/consultation.service';

@Component({
  selector: 'app-patient-history',
  templateUrl: './patient-history.component.html',

})
export class PatientHistoryComponent implements OnInit {
  patientId: string | null = null;
  consultations: Consultation[] = [];
  filteredConsultations: Consultation[] = [];
  paginatedConsultations: Consultation[] = [];
  selectedConsultation: Consultation | null = null;

  isLoading = true;
  errorMessage: string | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;

  // Filtres
  dateFrom = '';
  dateTo = '';
  searchTerm = '';

  // Tri
  sortField = 'date';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private consultationService: ConsultationService
  ) {}

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id');
    if (this.patientId) {
      this.loadConsultations();
    } else {
      this.errorMessage = 'ID du patient non fourni';
      this.isLoading = false;
    }
  }

  private loadConsultations(): void {
    this.isLoading = true;
    this.errorMessage = null;

    if (!this.patientId) return;

    this.consultationService.getPatientConsultations(this.patientId).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (data: Consultation[]) => {
        this.consultations = data;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des consultations:', err);
        this.errorMessage = "Erreur lors du chargement de l'historique du patient.";
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.consultations];

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
        c.doctorName.toLowerCase().includes(term) ||
        c.motif.toLowerCase().includes(term)
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

      if (this.sortField === 'doctorName') {
        aValue = a.doctorName;
        bValue = b.doctorName;
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
          <p style="color: #666; margin: 5px 0;">Patient ID: ${this.patientId}</p>
        </div>



        ${consultation.notes ? `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Notes de consultation</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff;">
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
          <title>Consultation - Patient ${this.patientId}</title>
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

  goBack(): void {
    this.router.navigate(['/patients']); // Ajustez la route selon votre routing
  }

  refreshData(): void {
    this.loadConsultations();
  }

  // Méthodes utilitaires pour formater les données si nécessaire
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDuration(duration?: number): string {
    if (!duration) return 'Non spécifiée';
    return `${duration} minute${duration > 1 ? 's' : ''}`;
  }

  // Méthode pour obtenir la couleur de badge selon la spécialité (optionnel)
  getSpecialityColor(speciality?: string): string {
    if (!speciality) return 'bg-secondary';

    const colors: { [key: string]: string } = {
      'cardiologie': 'bg-danger',
      'neurologie': 'bg-primary',
      'dermatologie': 'bg-warning',
      'pediatrie': 'bg-success',
      'psychiatrie': 'bg-info',
      'gynecologie': 'bg-pink',
      'orthopédie': 'bg-dark',
      'ophtalmologie': 'bg-purple'
    };

    return colors[speciality.toLowerCase()] || 'bg-secondary';
  }

  // Méthode pour calculer les statistiques (optionnel)
  getConsultationStats(): { total: number, thisMonth: number, lastVisit: Date | null } {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisMonth = this.consultations.filter(c =>
      new Date(c.date) >= thisMonthStart
    ).length;

    const lastVisit = this.consultations.length > 0
      ? new Date(Math.max(...this.consultations.map(c => new Date(c.date).getTime())))
      : null;

    return {
      total: this.consultations.length,
      thisMonth,
      lastVisit
    };
  }
}
