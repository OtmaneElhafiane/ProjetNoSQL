import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  error: string = '';
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Si déjà authentifié, rediriger vers le dashboard approprié
    if (this.authService.isAuthenticated()) {
      const user = this.authService.getCurrentUser();
      if (user) {
        this.navigateToDashboard(user.role);
      }
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.error = '';

      this.authService.login(this.loginForm.value)
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (response) => {
            console.log('Login response:', response);
            if (response?.user?.role) {
              // Réinitialiser le formulaire et l'état
              this.loginForm.reset();
              this.error = '';
              
              // Attendre un court instant pour permettre à l'état de se mettre à jour
              setTimeout(() => {
                this.navigateToDashboard(response.user.role);
              }, 100);
            } else {
              this.error = 'Réponse de connexion invalide';
            }
          },
          error: (err) => {
            console.error('Login error:', err);
            this.error = err.error?.message || 'Erreur de connexion. Veuillez réessayer.';
          }
        });
    }
  }

  private navigateToDashboard(role: string): void {
    const dashboardRoutes: { [key: string]: string } = {
      'admin': '/admin',
      'doctor': '/doctor',
      'patient': '/patient'
    };

    const route = dashboardRoutes[role.toLowerCase()];
    if (route) {
      console.log('Navigating to:', route);
      // Forcer une navigation complète
      window.location.href = route;
    } else {
      console.error('Invalid role:', role);
      this.error = 'Rôle utilisateur invalide';
      this.authService.logout();
    }
  }

  // Getters pour faciliter l'accès aux contrôles dans le template
  get emailControl() {
    return this.loginForm.get('email');
  }

  get passwordControl() {
    return this.loginForm.get('password');
  }

  get isEmailInvalid() {
    return this.emailControl?.invalid && this.emailControl?.touched;
  }

  get isPasswordInvalid() {
    return this.passwordControl?.invalid && this.passwordControl?.touched;
  }
} 