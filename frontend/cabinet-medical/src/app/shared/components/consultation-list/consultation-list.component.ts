import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConsultationService, Consultation } from '../../../core/services/consultation.service';
import { ConsultationDialogComponent } from '../consultation-dialog/consultation-dialog.component';
import { AuthService } from '../../../core/services/auth.service';
import { ConsultationDetailComponent } from '../consultation-detail/consultation-detail.component';

@Component({
  selector: 'app-consultation-list',
  template: `
    <div class="consultation-list-container">
      <div class="header">
        <h2>Liste des consultations</h2>
        <button mat-raised-button color="primary" (click)="openAddDialog()" *ngIf="canCreateConsultation">
          <mat-icon>add</mat-icon>
          Nouvelle consultation
        </button>
      </div>

      <mat-form-field class="search-field">
        <mat-label>Rechercher</mat-label>
        <input matInput (keyup)="applyFilter($event)" placeholder="Nom du patient, médecin...">
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      <div class="mat-elevation-z8">
        <table mat-table [dataSource]="consultations">
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Date</th>
            <td mat-cell *matCellDef="let consultation">
              {{ consultation.date | date:'dd/MM/yyyy HH:mm' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="patient">
            <th mat-header-cell *matHeaderCellDef>Patient</th>
            <td mat-cell *matCellDef="let consultation">
              {{ consultation.patient.name }}
            </td>
          </ng-container>

          <ng-container matColumnDef="doctor">
            <th mat-header-cell *matHeaderCellDef>Médecin</th>
            <td mat-cell *matCellDef="let consultation">
              {{ consultation.doctor.name }}
            </td>
          </ng-container>

          <ng-container matColumnDef="motif">
            <th mat-header-cell *matHeaderCellDef>Motif</th>
            <td mat-cell *matCellDef="let consultation">
              {{ consultation.motif }}
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let consultation">
              <button mat-icon-button color="primary" (click)="viewConsultation(consultation)">
                <mat-icon>visibility</mat-icon>
              </button>
              <button mat-icon-button color="accent" (click)="editConsultation(consultation)" *ngIf="canEditConsultation(consultation)">
                <mat-icon>edit</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <mat-paginator [pageSizeOptions]="[5, 10, 25, 100]" [pageSize]="10" showFirstLastButtons></mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .consultation-list-container {
      padding: 20px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h2 {
        margin: 0;
      }
    }

    .search-field {
      width: 100%;
      margin-bottom: 20px;
    }

    table {
      width: 100%;
    }

    .mat-column-date {
      width: 150px;
    }

    .mat-column-actions {
      width: 100px;
      text-align: center;
    }
  `]
})
export class ConsultationListComponent implements OnInit {
  consultations: Consultation[] = [];
  displayedColumns: string[] = ['date', 'patient', 'doctor', 'motif', 'actions'];
  totalConsultations = 0;
  currentPage = 1;
  pageSize = 10;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  get canCreateConsultation(): boolean {
    return ['admin', 'doctor'].includes(this.authService.currentUserValue?.user.role || '');
  }

  constructor(
    private consultationService: ConsultationService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadConsultations();
  }

  loadConsultations(): void {
    this.consultationService.getConsultations(this.currentPage, this.pageSize)
      .subscribe({
        next: (response) => {
          this.consultations = response.consultations;
          this.totalConsultations = response.total;
        },
        error: (error) => {
          this.snackBar.open('Erreur lors du chargement des consultations', 'Fermer', {
            duration: 3000
          });
        }
      });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    // Implémenter la logique de filtrage si nécessaire
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(ConsultationDialogComponent, {
      width: '600px',
      data: { mode: 'add' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.consultationService.createConsultation(result)
          .subscribe({
            next: () => {
              this.snackBar.open('Consultation créée avec succès', 'Fermer', {
                duration: 3000
              });
              this.loadConsultations();
            },
            error: (error) => {
              this.snackBar.open('Erreur lors de la création de la consultation', 'Fermer', {
                duration: 3000
              });
            }
          });
      }
    });
  }

  editConsultation(consultation: Consultation): void {
    const dialogRef = this.dialog.open(ConsultationDialogComponent, {
      width: '600px',
      data: { mode: 'edit', consultation }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.consultationService.updateConsultation(consultation.id, result)
          .subscribe({
            next: () => {
              this.snackBar.open('Consultation mise à jour avec succès', 'Fermer', {
                duration: 3000
              });
              this.loadConsultations();
            },
            error: (error) => {
              this.snackBar.open('Erreur lors de la mise à jour de la consultation', 'Fermer', {
                duration: 3000
              });
            }
          });
      }
    });
  }

  viewConsultation(consultation: Consultation): void {
    this.dialog.open(ConsultationDetailComponent, {
      width: '700px',
      data: consultation
    });
  }

  canEditConsultation(consultation: Consultation): boolean {
    const currentUser = this.authService.currentUserValue?.user;
    if (!currentUser) return false;

    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'doctor' && consultation.doctor.id === currentUser._id) return true;
    
    return false;
  }
} 