import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/select-role']);
      return false;
    }

    // Vérifier le rôle si spécifié dans les données de route
    const requiredRole = route.data['role'];
    if (requiredRole && !this.authService.hasRole(requiredRole)) {
      // Rediriger vers la page appropriée en fonction du rôle de l'utilisateur
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        switch (currentUser.role) {
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
      }
      return false;
    }

    return true;
  }
} 