import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> | boolean {
    // Vérification de base de l'authentification
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    // Valider le token avec le serveur
    return this.authService.validateToken().pipe(
      map(response => {
        if (!response.valid || !response.user) {
          this.authService.logout();
          return false;
        }

        // Vérifier le rôle si spécifié dans les données de route
        const requiredRole = route.data['role'];
        const userRole = response.user.role;

        if (requiredRole && userRole !== requiredRole) {
          // Rediriger vers la page appropriée selon le rôle
          this.redirectToRoleDashboard(userRole);
          return false;
        }

        return true;
      }),
      catchError(() => {
        this.authService.logout();
        return of(false);
      })
    );
  }

  private redirectToRoleDashboard(role: string): void {
    switch (role) {
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
        this.router.navigate(['/dashboard']);
    }
  }
} 