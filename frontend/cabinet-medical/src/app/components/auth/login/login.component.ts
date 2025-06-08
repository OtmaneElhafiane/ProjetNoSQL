import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connexion
          </h2>
        </div>
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="mt-8 space-y-6">
          <div *ngIf="error" class="rounded-md bg-red-50 p-4">
            <div class="text-sm text-red-700">{{ error }}</div>
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
              <label for="code" class="sr-only">Code</label>
              <input
                id="code"
                formControlName="code"
                type="text"
                required
                maxlength="6"
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Code à 6 chiffres"
              />
            </div>
          </div>

          <div class="flex items-center justify-between">
            <button
              type="button"
              (click)="resetCode()"
              [disabled]="loading"
              class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Obtenir un nouveau code
            </button>
          </div>

          <div>
            <button
              type="submit"
              [disabled]="loading || !loginForm.valid"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {{ loading ? 'Connexion en cours...' : 'Se connecter' }}
            </button>
          </div>
          
          <div class="text-center mt-4">
            <a routerLink="/auth/register" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              Pas encore de compte ? S'inscrire
            </a>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  error = '';

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.error = '';

    this.http.post<any>('/api/auth/login', this.loginForm.value)
      .subscribe({
        next: (response) => {
          // Stocker le token dans le localStorage
          localStorage.setItem('token', response.access_token);
          localStorage.setItem('user', JSON.stringify(response.user));

          // Rediriger selon le rôle
          switch(response.user.role) {
            case 'admin':
              this.router.navigate(['/admin/dashboard']);
              break;
            case 'doctor':
              this.router.navigate(['/doctor/dashboard']);
              break;
            case 'patient':
              this.router.navigate(['/patient/dashboard']);
              break;
            default:
              this.router.navigate(['/']);
          }
        },
        error: (err) => {
          this.error = err.error?.error || 'Une erreur est survenue';
          this.loading = false;
        }
      });
  }

  resetCode() {
    if (!this.loginForm.get('email')?.value) {
      this.error = 'Veuillez entrer votre email';
      return;
    }

    this.loading = true;
    this.http.post('/api/auth/reset-code', { email: this.loginForm.get('email')?.value })
      .subscribe({
        next: () => {
          this.error = '';
          alert('Un nouveau code a été envoyé à votre email');
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.error || 'Une erreur est survenue';
          this.loading = false;
        }
      });
  }
} 