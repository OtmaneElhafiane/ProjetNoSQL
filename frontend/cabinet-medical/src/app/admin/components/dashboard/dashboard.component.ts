import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConsultationService, ConsultationStats } from '../../../core/services/consultation.service';
import { environment } from '../../../../environments/environment';

interface Stats {
  total_patients: number;
  total_doctors: number;
  total_consultations: number;
}

@Component({
  selector: 'app-admin-dashboard',
  template: `
    <div class="dashboard-container">
      <h1>Tableau de bord administrateur</h1>
      
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-header>
            <mat-card-title>Patients</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="stat-value">{{ stats?.total_patients || 0 }}</div>
            <mat-icon>people</mat-icon>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-header>
            <mat-card-title>Médecins</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="stat-value">{{ stats?.total_doctors || 0 }}</div>
            <mat-icon>medical_services</mat-icon>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-header>
            <mat-card-title>Consultations</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="stat-value">{{ consultationStats?.total_consultations || 0 }}</div>
            <mat-icon>event_note</mat-icon>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="consultations-by-doctor" *ngIf="consultationStats?.consultations_by_doctor">
        <h2>Consultations par médecin</h2>
        <div class="stats-grid">
          <mat-card class="stat-card" *ngFor="let stat of consultationStats.consultations_by_doctor">
            <mat-card-header>
              <mat-card-title>{{ stat.doctor_name }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="stat-value">{{ stat.consultation_count }}</div>
              <div class="stat-label">consultations</div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <div class="action-buttons">
        <button mat-raised-button color="primary" routerLink="/admin/patients">
          <mat-icon>people</mat-icon>
          Gérer les patients
        </button>
        <button mat-raised-button color="accent" routerLink="/admin/doctors">
          <mat-icon>medical_services</mat-icon>
          Gérer les médecins
        </button>
        <button mat-raised-button color="warn" routerLink="/admin/consultations">
          <mat-icon>event_note</mat-icon>
          Gérer les consultations
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    h1, h2 {
      margin-bottom: 30px;
      color: #333;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      padding: 16px;
      
      mat-card-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 16px;
      }

      .stat-value {
        font-size: 2.5em;
        font-weight: bold;
        color: #2196f3;
      }

      .stat-label {
        color: #666;
        font-size: 0.9em;
      }

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #90caf9;
      }
    }

    .consultations-by-doctor {
      margin-top: 40px;
      
      .stat-card {
        text-align: center;
        
        mat-card-content {
          flex-direction: column;
          align-items: center;
        }
        
        .stat-value {
          font-size: 2em;
          margin-bottom: 8px;
        }
      }
    }

    .action-buttons {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-top: 30px;

      button {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats: Stats | null = null;
  consultationStats: ConsultationStats | null = null;

  constructor(
    private http: HttpClient,
    private consultationService: ConsultationService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadConsultationStats();
  }

  private loadStats(): void {
    this.http.get<Stats>(`${environment.apiUrl}/admin/stats`)
      .subscribe({
        next: (stats) => {
          this.stats = stats;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des statistiques:', error);
        }
      });
  }

  private loadConsultationStats(): void {
    this.consultationService.getStats()
      .subscribe({
        next: (stats) => {
          this.consultationStats = stats;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des statistiques de consultation:', error);
        }
      });
  }
} 