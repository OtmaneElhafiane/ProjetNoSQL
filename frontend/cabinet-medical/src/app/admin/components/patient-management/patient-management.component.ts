import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';
import { PatientDialogComponent } from '../patient-dialog/patient-dialog.component';

interface Patient {
  _id: string;
  name: string;
  email: string;
  phone: string;
  birth_date: string;
  address: string;
}

@Component({
  selector: 'app-patient-management',
  template: `
    <div class="patient-management-container">
      <div class="header">
        <h1>Gestion des patients</h1>
        <button mat-raised-button color="primary" (click)="openAddPatientDialog()">
          <mat-icon>add</mat-icon>
          Nouveau patient
        </button>
      </div>

      <mat-form-field class="search-field">
        <mat-label>Rechercher un patient</mat-label>
        <input matInput (keyup)="applyFilter($event)" placeholder="Nom, email...">
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      <div class="table-container">
        <table mat-table [dataSource]="patients" class="patient-table">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nom</th>
            <td mat-cell *matCellDef="let patient">{{ patient.name }}</td>
          </ng-container>

          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let patient">{{ patient.email }}</td>
          </ng-container>

          <ng-container matColumnDef="phone">
            <th mat-header-cell *matHeaderCellDef>Téléphone</th>
            <td mat-cell *matCellDef="let patient">{{ patient.phone }}</td>
          </ng-container>

          <ng-container matColumnDef="birth_date">
            <th mat-header-cell *matHeaderCellDef>Date de naissance</th>
            <td mat-cell *matCellDef="let patient">{{ patient.birth_date | date:'dd/MM/yyyy' }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let patient">
              <button mat-icon-button color="primary" (click)="editPatient(patient)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deletePatient(patient)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <mat-paginator [pageSizeOptions]="[5, 10, 25, 100]" aria-label="Sélectionner la page"></mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .patient-management-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h1 {
        margin: 0;
      }
    }

    .search-field {
      width: 100%;
      margin-bottom: 20px;
    }

    .table-container {
      background: white;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .patient-table {
      width: 100%;
    }

    .mat-column-actions {
      width: 100px;
      text-align: center;
    }
  `]
})
export class PatientManagementComponent implements OnInit {
  patients: Patient[] = [];
  displayedColumns: string[] = ['name', 'email', 'phone', 'birth_date', 'actions'];
  filteredPatients: Patient[] = [];

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.http.get<Patient[]>(`${environment.apiUrl}/admin/patients`)
      .subscribe({
        next: (patients) => {
          this.patients = patients;
          this.filteredPatients = patients;
        },
        error: (error) => {
          this.snackBar.open('Erreur lors du chargement des patients', 'Fermer', {
            duration: 3000
          });
        }
      });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredPatients = this.patients.filter(patient => 
      patient.name.toLowerCase().includes(filterValue) ||
      patient.email.toLowerCase().includes(filterValue)
    );
  }

  openAddPatientDialog(): void {
    const dialogRef = this.dialog.open(PatientDialogComponent, {
      width: '500px',
      data: { mode: 'add' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.http.post(`${environment.apiUrl}/admin/patients`, result)
          .subscribe({
            next: () => {
              this.snackBar.open('Patient ajouté avec succès', 'Fermer', {
                duration: 3000
              });
              this.loadPatients();
            },
            error: (error) => {
              this.snackBar.open('Erreur lors de l\'ajout du patient', 'Fermer', {
                duration: 3000
              });
            }
          });
      }
    });
  }

  editPatient(patient: Patient): void {
    const dialogRef = this.dialog.open(PatientDialogComponent, {
      width: '500px',
      data: { mode: 'edit', patient }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.http.put(`${environment.apiUrl}/admin/patients/${patient._id}`, result)
          .subscribe({
            next: () => {
              this.snackBar.open('Patient modifié avec succès', 'Fermer', {
                duration: 3000
              });
              this.loadPatients();
            },
            error: (error) => {
              this.snackBar.open('Erreur lors de la modification du patient', 'Fermer', {
                duration: 3000
              });
            }
          });
      }
    });
  }

  deletePatient(patient: Patient): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le patient ${patient.name} ?`)) {
      this.http.delete(`${environment.apiUrl}/admin/patients/${patient._id}`)
        .subscribe({
          next: () => {
            this.snackBar.open('Patient supprimé avec succès', 'Fermer', {
              duration: 3000
            });
            this.loadPatients();
          },
          error: (error) => {
            this.snackBar.open('Erreur lors de la suppression du patient', 'Fermer', {
              duration: 3000
            });
          }
        });
    }
  }
} 