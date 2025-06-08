import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Inscription
          </h2>
        </div>
        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="mt-8 space-y-6">
          <div *ngIf="error" class="rounded-md bg-red-50 p-4">
            <div class="text-sm text-red-700">{{ error }}</div>
          </div>
          <div *ngIf="success" class="rounded-md bg-green-50 p-4">
            <div class="text-sm text-green-700">{{ success }}</div>
          </div>
          
          <div class="rounded-md shadow-sm -space-y-px">
            <div>
              <label for="email" class="sr-only">Email</label>
              <input
                id="email"
                formControlName="email"
                type="email"
                required
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email"
              />
            </div>
            <div>
              <label for="first_name" class="sr-only">Prénom</label>
              <input
                id="first_name"
                formControlName="first_name"
                type="text"
                required
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Prénom"
              />
            </div>
            <div>
              <label for="last_name" class="sr-only">Nom</label>
              <input
                id="last_name"
                formControlName="last_name"
                type="text"
                required
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Nom"
              />
            </div>
            <div>
              <label for="role" class="sr-only">Rôle</label>
              <select
                id="role"
                formControlName="role"
                required
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              >
                <option value="patient">Patient</option>
                <option value="doctor">Médecin</option>
              </select>
            </div>
            <div *ngIf="registerForm.get('role')?.value === 'doctor'">
              <label for="speciality" class="sr-only">Spécialité</label>
              <input
                id="speciality"
                formControlName="speciality"
                type="text"
                required
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Spécialité"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              [disabled]="loading || !registerForm.valid"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {{ loading ? 'Inscription en cours...' : 'S\'inscrire' }}
            </button>
          </div>
          
          <div class="text-center mt-4">
            <a routerLink="/auth/login" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              Déjà un compte ? Se connecter
            </a>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  error = '';
  success = '';

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.registerForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      role: ['patient', Validators.required],
      speciality: ['']
    });

    // Mettre à jour la validation de la spécialité en fonction du rôle
    this.registerForm.get('role')?.valueChanges.subscribe(role => {
      const specialityControl = this.registerForm.get('speciality');
      if (role === 'doctor') {
        specialityControl?.setValidators([Validators.required]);
      } else {
        specialityControl?.clearValidators();
      }
      specialityControl?.updateValueAndValidity();
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    this.http.post<any>('/api/auth/register', this.registerForm.value)
      .subscribe({
        next: (response) => {
          this.success = response.message || 'Inscription réussie';
          this.loading = false;
          
          // Rediriger vers la page de connexion après 2 secondes
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        },
        error: (err) => {
          this.error = err.error?.error || 'Une erreur est survenue';
          this.loading = false;
        }
      });
  }
} 