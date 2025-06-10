import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DoctorService, UpdateDoctorRequest, DoctorInfo } from '../../../core/services/doctor.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-edit-doctor',
  templateUrl: './edit-doctor.component.html',
  styleUrls: ['./edit-doctor.component.scss']
})
export class EditDoctorComponent implements OnInit {
  doctorId: string | null = null;
  doctorForm!: FormGroup;
  isLoading = true;
  isSaving = false;
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private doctorService: DoctorService
  ) {
    this.doctorForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      speciality: ['', Validators.required],
      phone: ['', Validators.pattern('^[0-9]*$')]
    });
  }

  ngOnInit(): void {
    this.doctorId = this.route.snapshot.paramMap.get('id');
    if (this.doctorId) {
      this.loadDoctorData(this.doctorId);
    } else {
      this.errorMessage = "ID du médecin non trouvé.";
      this.isLoading = false;
    }
  }

  loadDoctorData(id: string): void {
    this.doctorService.getDoctorById(id).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response) => {
        if (response.doctor) {
          // The response structure is { doctor: { ... } }
          const doctorData = { ...response.doctor, ...response };
          delete doctorData.doctor; // Clean up the object
          this.doctorForm.patchValue(doctorData);
        } else {
           this.errorMessage = "Données du médecin non trouvées.";
        }
      },
      error: (err) => {
        this.errorMessage = "Erreur lors du chargement des données du médecin.";
      }
    });
  }

  onSubmit(): void {
    if (this.doctorForm.invalid || !this.doctorId) {
      return;
    }
    this.isSaving = true;
    const updateData: UpdateDoctorRequest = this.doctorForm.value;

    this.doctorService.updateDoctor(this.doctorId, updateData).pipe(
      finalize(() => this.isSaving = false)
    ).subscribe({
      next: () => {
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        this.errorMessage = "La mise à jour a échoué.";
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}