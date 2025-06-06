import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';
import { DoctorDialogComponent } from '../doctor-dialog/doctor-dialog.component';

interface Doctor {
  _id: string;
  name: string;
  email: string;
  phone: string;
  speciality: string;
  schedule: Record<string, any>;
}

@Component({
  selector: 'app-doctor-management',
  template: `
    <div class="doctor-management-container">
      <div class="header">
        <h1>Gestion des médecins</h1>
        <button mat-raised-button color="primary" (click)="openAddDoctorDialog()">
          <mat-icon>add</mat-icon>
          Nouveau médecin
        </button>
      </div>

      <mat-form-field class="search-field">
        <mat-label>Rechercher un médecin</mat-label>
        <input matInput (keyup)="applyFilter($event)" placeholder="Nom, spécialité...">
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      <div class="table-container">
        <table mat-table [dataSource]="doctors" class="doctor-table">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nom</th>
            <td mat-cell *matCellDef="let doctor">{{ doctor.name }}</td>
          </ng-container>

          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let doctor">{{ doctor.email }}</td>
          </ng-container>

          <ng-container matColumnDef="phone">
            <th mat-header-cell *matHeaderCellDef>Téléphone</th>
            <td mat-cell *matCellDef="let doctor">{{ doctor.phone }}</td>
          </ng-container>

          <ng-container matColumnDef="speciality">
            <th mat-header-cell *matHeaderCellDef>Spécialité</th>
            <td mat-cell *matCellDef="let doctor">{{ doctor.speciality }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let doctor">
              <button mat-icon-button color="primary" (click)="editDoctor(doctor)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="accent" (click)="manageSchedule(doctor)">
                <mat-icon>schedule</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteDoctor(doctor)">
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
    .doctor-management-container {
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

    .doctor-table {
      width: 100%;
    }

    .mat-column-actions {
      width: 140px;
      text-align: center;
    }
  `]
})
export class DoctorManagementComponent implements OnInit {
  doctors: Doctor[] = [];
  displayedColumns: string[] = ['name', 'email', 'phone', 'speciality', 'actions'];
  filteredDoctors: Doctor[] = [];

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadDoctors();
  }

  loadDoctors(): void {
    this.http.get<Doctor[]>(`${environment.apiUrl}/admin/doctors`)
      .subscribe({
        next: (doctors) => {
          this.doctors = doctors;
          this.filteredDoctors = doctors;
        },
        error: (error) => {
          this.snackBar.open('Erreur lors du chargement des médecins', 'Fermer', {
            duration: 3000
          });
        }
      });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredDoctors = this.doctors.filter(doctor => 
      doctor.name.toLowerCase().includes(filterValue) ||
      doctor.speciality.toLowerCase().includes(filterValue)
    );
  }

  openAddDoctorDialog(): void {
    const dialogRef = this.dialog.open(DoctorDialogComponent, {
      width: '500px',
      data: { mode: 'add' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.http.post(`${environment.apiUrl}/admin/doctors`, result)
          .subscribe({
            next: () => {
              this.snackBar.open('Médecin ajouté avec succès', 'Fermer', {
                duration: 3000
              });
              this.loadDoctors();
            },
            error: (error) => {
              this.snackBar.open('Erreur lors de l\'ajout du médecin', 'Fermer', {
                duration: 3000
              });
            }
          });
      }
    });
  }

  editDoctor(doctor: Doctor): void {
    const dialogRef = this.dialog.open(DoctorDialogComponent, {
      width: '500px',
      data: { mode: 'edit', doctor }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.http.put(`${environment.apiUrl}/admin/doctors/${doctor._id}`, result)
          .subscribe({
            next: () => {
              this.snackBar.open('Médecin modifié avec succès', 'Fermer', {
                duration: 3000
              });
              this.loadDoctors();
            },
            error: (error) => {
              this.snackBar.open('Erreur lors de la modification du médecin', 'Fermer', {
                duration: 3000
              });
            }
          });
      }
    });
  }

  manageSchedule(doctor: Doctor): void {
    // TODO: Implémenter la gestion du planning
  }

  deleteDoctor(doctor: Doctor): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le médecin ${doctor.name} ?`)) {
      this.http.delete(`${environment.apiUrl}/admin/doctors/${doctor._id}`)
        .subscribe({
          next: () => {
            this.snackBar.open('Médecin supprimé avec succès', 'Fermer', {
              duration: 3000
            });
            this.loadDoctors();
          },
          error: (error) => {
            this.snackBar.open('Erreur lors de la suppression du médecin', 'Fermer', {
              duration: 3000
            });
          }
        });
    }
  }
} 