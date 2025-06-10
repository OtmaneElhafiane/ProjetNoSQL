import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DoctorService, DoctorInfo, DoctorResponse } from '../../../core/services/doctor.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-view-doctor',
  templateUrl: './view-doctor.component.html',
  styleUrls: ['./view-doctor.component.scss']
})
export class ViewDoctorComponent implements OnInit {
  doctor: DoctorInfo | null = null;
  isLoading = true;
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private doctorService: DoctorService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const doctorId = this.route.snapshot.paramMap.get('id');
    if (!doctorId) {
      this.errorMessage = "ID du médecin non trouvé.";
      this.isLoading = false;
      return;
    }

    this.doctorService.getDoctorById(doctorId).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response: DoctorResponse) => {
        if (!response.doctor) {
          this.errorMessage = "Données du médecin non trouvées.";
          return;
        }

        // --- PATCH: Split the 'name' field ---
        const nameParts = response.doctor.name.split(' ');
        const firstName = nameParts.shift() || ''; // Get the first part
        const lastName = nameParts.join(' ');     // Join the rest

        // --- CORRECT DATA TRANSFORMATION ---
        this.doctor = {
          user_id: response.doctor.user_id,
          email: response.doctor.email,
          first_name: firstName, // Use the split name
          last_name: lastName,   // Use the split name
          created_at: response.created_at,
          last_login: response.last_login,
          doctor_id: response.doctor._id,
          name: response.doctor.name,
          phone: response.doctor.phone,
          speciality: response.doctor.speciality,
          schedule: response.doctor.schedule,
        };
      },
      error: (err) => {
        this.errorMessage = "Médecin non trouvé ou une erreur est survenue.";
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}