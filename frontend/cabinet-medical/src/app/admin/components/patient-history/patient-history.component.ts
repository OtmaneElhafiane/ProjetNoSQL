import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { ConsultationService, Consultation } from '../../../core/services/consultation.service';

@Component({
  selector: 'app-patient-history',
  templateUrl: './patient-history.component.html',
})
export class PatientHistoryComponent implements OnInit {
  patientId: string | null = null;
  consultations: Consultation[] = [];
  isLoading = true;
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private consultationService: ConsultationService
  ) {}

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id');
    if (this.patientId) {
      this.consultationService.getPatientConsultations(this.patientId).pipe(
        finalize(() => this.isLoading = false)
      ).subscribe({
        next: (data) => this.consultations = data,
        error: (err) => this.errorMessage = "Erreur chargement de l'historique."
      });
    }
  }
}