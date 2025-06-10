import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { DoctorService, CreateDoctorRequest } from '../../../core/services/doctor.service';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-add-doctor',
  templateUrl: './add-doctor.component.html',
  styleUrls: ['./add-doctor.component.scss']
})
export class AddDoctorComponent implements OnInit {
  doctorForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private doctorService: DoctorService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.doctorForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      speciality: ['', Validators.required],
      phone: ['', Validators.pattern('^[0-9]*$')] // Optional, but must be numeric if provided
    });
  }

  onSubmit(): void {
    if (this.doctorForm.invalid) {
      this.doctorForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    const formData: CreateDoctorRequest = this.doctorForm.value;

    this.doctorService.createDoctor(formData).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: () => {
        // Optionally, you can use a notification service here
        // For now, we navigate back to the dashboard.
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err: { error: { error: string; }; }) => {
        console.error('Failed to create doctor:', err);
        this.errorMessage = err.error?.error || 'An unexpected error occurred. Please try again.';
      }
    });
  }
  
  onCancel(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}