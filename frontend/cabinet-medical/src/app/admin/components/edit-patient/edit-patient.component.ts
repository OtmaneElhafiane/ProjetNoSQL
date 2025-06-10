import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PatientService, Patient } from '../../../core/services/patient.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-edit-patient',
  templateUrl: './edit-patient.component.html',
})
export class EditPatientComponent implements OnInit {
  patientId: string | null = null;
  patientForm!: FormGroup;
  isLoading = true;
  isSaving = false;
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private patientService: PatientService
  ) {
    this.patientForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      cin: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9+ ]*$')]],
      type: ['', Validators.required],
      address: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id');
    if (this.patientId) {
      this.loadPatientData(this.patientId);
    } else {
      this.errorMessage = "ID du patient non trouvé.";
      this.isLoading = false;
    }
  }

  loadPatientData(id: string): void {
    this.patientService.getPatientById(id).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response) => {
        if(response.patient) {
            this.patientForm.patchValue(response.patient);
        } else {
            this.errorMessage = "Patient non trouvé.";
        }
      },
      error: (err) => this.errorMessage = "Erreur lors du chargement du patient."
    });
  }

  onSubmit(): void {
    if (this.patientForm.invalid || !this.patientId) return;
    this.isSaving = true;
    const updateData: Partial<Patient> = this.patientForm.value;

    this.patientService.updatePatient(this.patientId, updateData).pipe(
      finalize(() => this.isSaving = false)
    ).subscribe({
      next: () => this.router.navigate(['/admin/dashboard']),
      error: (err) => this.errorMessage = "La mise à jour a échoué."
    });
  }

  onCancel(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}