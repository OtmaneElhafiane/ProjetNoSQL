import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> | boolean {
    console.log('🛡️ AdminGuard - Vérification...');
    console.log('🛡️ AdminGuard - URL demandée:', this.router.url);
    console.log('🛡️ AdminGuard - Tokens présents:', {
      access_token: !!this.authService.getAccessToken(),
      user: !!this.authService.getCurrentUser()
    });
    
    if (!this.authService.isAuthenticated()) {
      console.log('❌ AdminGuard - Non authentifié, redirection vers login');
      this.router.navigate(['/auth/login']);
      return false;
    }

    console.log('🔍 AdminGuard - Validation du token...');
    console.log('🔍 AdminGuard - Token utilisé:', this.authService.getAccessToken()?.substring(0, 50) + '...');
    
    return this.authService.validateToken().pipe(
      map(response => {
        console.log('📊 AdminGuard - Réponse validateToken:', response);
        
        if (!response.valid || !response.user) {
          console.log('❌ AdminGuard - Token invalide, logout');
          this.authService.logout();
          return false;
        }

        if (response.user.role !== 'admin') {
          console.log(`⚠️ AdminGuard - Rôle incorrect (${response.user.role}), redirection`);
          this.authService.redirectToRoleDashboard(response.user.role);
          return false;
        }

        console.log('✅ AdminGuard - Accès autorisé');
        return true;
      }),
      catchError(error => {
        console.error('❌ AdminGuard - Erreur validateToken:', error);
        // Ne pas faire de logout systématique en cas d'erreur serveur
        if (error.status === 0 || error.status >= 500) {
          console.log('🌐 Problème de connexion serveur, redirection vers login sans logout');
          this.router.navigate(['/auth/login']);
        } else {
          this.authService.logout();
        }
        return of(false);
      })
    );
  }
}

@Injectable({
  providedIn: 'root'
})
export class DoctorGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> | boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    return this.authService.validateToken().pipe(
      map(response => {
        if (!response.valid || !response.user) {
          this.authService.logout();
          return false;
        }

        if (response.user.role !== 'doctor') {
          this.authService.redirectToRoleDashboard(response.user.role);
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
}

@Injectable({
  providedIn: 'root'
})
export class PatientGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> | boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    return this.authService.validateToken().pipe(
      map(response => {
        if (!response.valid || !response.user) {
          this.authService.logout();
          return false;
        }

        if (response.user.role !== 'patient') {
          this.authService.redirectToRoleDashboard(response.user.role);
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
} 