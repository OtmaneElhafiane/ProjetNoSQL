import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, RegisterData } from '../auth.service';

@Component({
  selector: 'app-register',
  template: `
    <div class="container">
      <div class="row justify-content-center mt-5">
        <div class="col-md-6">
          <div class="card">
            <div class="card-body">
              <h2 class="text-center mb-4">Inscription</h2>
              <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
                <div class="mb-3">
                  <label for="firstName" class="form-label">Prénom</label>
                  <input
                    type="text"
                    class="form-control"
                    id="firstName"
                    formControlName="first_name"
                    [class.is-invalid]="registerForm.get('first_name')?.invalid && registerForm.get('first_name')?.touched"
                  >
                  <div class="invalid-feedback">
                    Le prénom est requis
                  </div>
                </div>

                <div class="mb-3">
                  <label for="lastName" class="form-label">Nom</label>
                  <input
                    type="text"
                    class="form-control"
                    id="lastName"
                    formControlName="last_name"
                    [class.is-invalid]="registerForm.get('last_name')?.invalid && registerForm.get('last_name')?.touched"
                  >
                  <div class="invalid-feedback">
                    Le nom est requis
                  </div>
                </div>

                <div class="mb-3">
                  <label for="email" class="form-label">Email</label>
                  <input
                    type="email"
                    class="form-control"
                    id="email"
                    formControlName="email"
                    [class.is-invalid]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched"
                  >
                  <div class="invalid-feedback" *ngIf="registerForm.get('email')?.errors?.['required']">
                    L'email est requis
                  </div>
                  <div class="invalid-feedback" *ngIf="registerForm.get('email')?.errors?.['email']">
                    L'email n'est pas valide
                  </div>
                </div>

                <div class="mb-3">
                  <label for="password" class="form-label">Mot de passe</label>
                  <input
                    type="password"
                    class="form-control"
                    id="password"
                    formControlName="password"
                    [class.is-invalid]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched"
                  >
                  <div class="invalid-feedback">
                    Le mot de passe doit contenir au moins 6 caractères
                  </div>
                </div>

                <div class="mb-3">
                  <label for="role" class="form-label">Type de compte</label>
                  <select
                    class="form-select"
                    id="role"
                    formControlName="role"
                    [class.is-invalid]="registerForm.get('role')?.invalid && registerForm.get('role')?.touched"
                  >
                    <option value="">Sélectionnez un type de compte</option>
                    <option value="patient">Patient</option>
                    <option value="doctor">Médecin</option>
                  </select>
                  <div class="invalid-feedback">
                    Veuillez sélectionner un type de compte
                  </div>
                </div>

                <div *ngIf="error" class="alert alert-danger">
                  {{ error }}
                </div>

                <button type="submit" class="btn btn-primary w-100" [disabled]="registerForm.invalid || isLoading">
                  {{ isLoading ? 'Inscription en cours...' : 'S\'inscrire' }}
                </button>

                <div class="text-center mt-3">
                  <p>Déjà un compte ? <a routerLink="/auth/login">Se connecter</a></p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.error = null;

      const formData: RegisterData = this.registerForm.value;

      this.authService.register(formData).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          console.log('Inscription réussie:', response);
          
          // Rediriger vers la page de connexion après inscription réussie
          this.router.navigate(['/auth/login'], {
            queryParams: { message: 'Inscription réussie. Veuillez vous connecter.' }
          });
        },
        error: (err: any) => {
          this.isLoading = false;
          this.error = err.error?.error || 'Une erreur est survenue lors de l\'inscription';
          console.error('Register error:', err);
        }
      });
    }
  }
} 