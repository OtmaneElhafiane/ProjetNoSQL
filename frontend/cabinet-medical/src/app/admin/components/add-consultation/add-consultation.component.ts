import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { ConsultationService, ConsultationCreate } from '../../../core/services/consultation.service';
import { DoctorService, DoctorInfo } from '../../../core/services/doctor.service';
import { PatientService, Patient } from '../../../core/services/patient.service';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-consultation',
  templateUrl: './add-consultation.component.html',
  styleUrls: ['./add-consultation.component.scss']
})
export class AddConsultationComponent implements OnInit {
  consultationForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;

  doctors: DoctorInfo[] = [];
  patients: Patient[] = [];

  constructor(
    private fb: FormBuilder,
    private consultationService: ConsultationService,
    private doctorService: DoctorService,
    private patientService: PatientService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDoctorsAndPatients();
    
    this.consultationForm = this.fb.group({
      doctor_id: ['', Validators.required],
      patient_id: ['', Validators.required],
      date: ['', Validators.required],
      motif: ['', Validators.required],
      diagnostic: [''], // Optional
      traitement: [''], // Optional
      notes: [''] // Optional
    });
  }

  loadDoctorsAndPatients(): void {
    this.doctorService.getAllDoctors().subscribe((res: { doctors: DoctorInfo[]; }) => this.doctors = res.doctors);
    this.patientService.getAllPatients().subscribe((res: { patients: Patient[]; }) => this.patients = res.patients);
  }

  onSubmit(): void {
    if (this.consultationForm.invalid) {
      this.consultationForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    const formData: ConsultationCreate = this.consultationForm.value;

    this.consultationService.createConsultation(formData).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: () => {
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err: { error: { error: string; }; }) => {
        console.error('Failed to create consultation:', err);
        this.errorMessage = err.error?.error || 'An unexpected error occurred. Please try again.';
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}