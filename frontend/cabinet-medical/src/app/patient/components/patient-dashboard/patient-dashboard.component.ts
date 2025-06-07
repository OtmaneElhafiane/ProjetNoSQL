import { Component, OnInit } from '@angular/core';
import { ConsultationService } from '../../../core/services/consultation.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-patient-dashboard',
  template: `
    <div class="patient-dashboard-container">
      <h1>Mon espace patient</h1>

      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-header>
            <mat-card-title>Prochain rendez-vous</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="stat-value">{{ nextConsultationDate || 'Aucun' }}</div>
            <mat-icon>event</mat-icon>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-header>
            <mat-card-title>Consultations à venir</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="stat-value">{{ upcomingConsultations }}</div>
            <mat-icon>schedule</mat-icon>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-header>
            <mat-card-title>Total des consultations</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="stat-value">{{ totalConsultations }}</div>
            <mat-icon>assessment</mat-icon>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="upcoming-consultations" *ngIf="nextConsultations.length > 0">
        <h2>Mes prochains rendez-vous</h2>
        <mat-list>
          <mat-list-item *ngFor="let consultation of nextConsultations">
            <mat-icon matListItemIcon>medical_services</mat-icon>
            <div matListItemTitle>Dr. {{ consultation.doctorName }}</div>
            <div matListItemLine>{{ consultation.date | date:'short' }}</div>
            <div matListItemLine>{{ consultation.reason }}</div>
            <button mat-icon-button [routerLink]="['/patient/consultations', consultation._id]">
              <mat-icon>visibility</mat-icon>
            </button>
          </mat-list-item>
        </mat-list>
      </div>

      <div class="action-buttons">
        <button mat-raised-button color="primary" routerLink="/patient/consultations">
          <mat-icon>list</mat-icon>
          Voir mes consultations
        </button>
        <button mat-raised-button color="accent" (click)="openNewConsultation()">
          <mat-icon>add</mat-icon>
          Prendre rendez-vous
        </button>
      </div>
    </div>
  `,
  styles: [`
    .patient-dashboard-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;

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
          font-size: 2em;
          font-weight: bold;
          color: #2196f3;
        }

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          color: #90caf9;
        }
      }

      .upcoming-consultations {
        margin: 30px 0;
        
        mat-list-item {
          margin-bottom: 8px;
          
          &:hover {
            background-color: #f5f5f5;
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
        }
      }
    }
  `]
})
export class PatientDashboardComponent implements OnInit {
  nextConsultationDate: string | null = null;
  upcomingConsultations: number = 0;
  totalConsultations: number = 0;
  nextConsultations: any[] = [];
  currentPatientId: string = '';

  constructor(
    private consultationService: ConsultationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.role === 'patient') {
      this.currentPatientId = user.id;
      this.loadDashboardData();
    }
  }

  private loadDashboardData(): void {
    this.consultationService.getConsultations({ patientId: this.currentPatientId })
      .subscribe(consultations => {
        const now = new Date();
        
        this.upcomingConsultations = consultations.filter(c => {
          const consultDate = new Date(c.date);
          return consultDate > now;
        }).length;

        this.totalConsultations = consultations.length;

        // Récupérer les 5 prochaines consultations
        this.nextConsultations = consultations
          .filter(c => new Date(c.date) > now)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 5);

        if (this.nextConsultations.length > 0) {
          this.nextConsultationDate = new Date(this.nextConsultations[0].date).toLocaleDateString();
        }
      });
  }

  openNewConsultation(): void {
    this.consultationService.openConsultationDialog({
      patientId: this.currentPatientId,
      mode: 'create'
    });
  }
} 