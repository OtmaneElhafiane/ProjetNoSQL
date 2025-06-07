import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { ConsultationDialogComponent } from '../../../shared/components/consultation-dialog/consultation-dialog.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-consultation-management',
  template: `
    <div class="consultation-management-container">
      <h1>Gestion des consultations</h1>
      
      <app-consultation-list></app-consultation-list>
    </div>
  `,
  styles: [`
    .consultation-management-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;

      h1 {
        margin-bottom: 20px;
        color: #333;
      }
    }
  `]
})
export class ConsultationManagementComponent implements OnInit {
  patients: Array<{ id: string; name: string }> = [];
  doctors: Array<{ id: string; name: string }> = [];

  constructor(
    private http: HttpClient,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadPatientsAndDoctors();
  }

  private loadPatientsAndDoctors(): void {
    // Charger la liste des patients
    this.http.get<any[]>(`${environment.apiUrl}/admin/patients`)
      .subscribe({
        next: (patients) => {
          this.patients = patients.map(p => ({
            id: p._id,
            name: p.name
          }));
        },
        error: (error) => {
          console.error('Erreur lors du chargement des patients:', error);
        }
      });

    // Charger la liste des médecins
    this.http.get<any[]>(`${environment.apiUrl}/admin/doctors`)
      .subscribe({
        next: (doctors) => {
          this.doctors = doctors.map(d => ({
            id: d._id,
            name: d.name
          }));
        },
        error: (error) => {
          console.error('Erreur lors du chargement des médecins:', error);
        }
      });
  }
} 