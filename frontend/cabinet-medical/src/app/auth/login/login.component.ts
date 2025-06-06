import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="container">
      <div class="row justify-content-center mt-5">
        <div class="col-md-6">
          <div class="card">
            <div class="card-body">
              <h2 class="text-center mb-4">Connexion</h2>
              <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
                <div class="mb-3">
                  <label for="email" class="form-label">Email</label>
                  <input
                    type="email"
                    class="form-control"
                    id="email"
                    formControlName="email"
                    [class.is-invalid]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
                  >
                  <div class="invalid-feedback" *ngIf="loginForm.get('email')?.errors?.['required']">
                    L'email est requis
                  </div>
                  <div class="invalid-feedback" *ngIf="loginForm.get('email')?.errors?.['email']">
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
                    [class.is-invalid]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
                  >
                  <div class="invalid-feedback" *ngIf="loginForm.get('password')?.errors?.['required']">
                    Le mot de passe est requis
                  </div>
                </div>

                <div *ngIf="error" class="alert alert-danger">
                  {{ error }}
                </div>

                <button type="submit" class="btn btn-primary w-100" [disabled]="loginForm.invalid || isLoading">
                  {{ isLoading ? 'Connexion en cours...' : 'Se connecter' }}
                </button>

                <div class="text-center mt-3">
                  <p>Pas encore de compte ? <a routerLink="/auth/register">S'inscrire</a></p>
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
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.error = null;

      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: (response) => {
          this.isLoading = false;
          // Rediriger vers la page appropriée en fonction du rôle
          switch (response.user.role) {
            case 'admin':
              this.router.navigate(['/admin']);
              break;
            case 'doctor':
              this.router.navigate(['/doctor-dashboard']);
              break;
            case 'patient':
              this.router.navigate(['/patient-dashboard']);
              break;
            default:
              this.router.navigate(['/']);
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.error = 'Email ou mot de passe incorrect';
          console.error('Login error:', err);
        }
      });
    }
  }
} 