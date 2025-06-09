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
    console.log('AuthGuard: Checking route', route.url);
    
    // Si l'utilisateur n'est pas authentifié, rediriger vers login
    if (!this.authService.isAuthenticated()) {
      console.log('AuthGuard: User not authenticated');
      this.router.navigate(['/auth/login']);
      return false;
    }

    const user = this.authService.getCurrentUser();
    if (!user) {
      console.log('AuthGuard: No current user');
      this.router.navigate(['/auth/login']);
      return false;
    }

    // Vérifier si l'utilisateur a accès à cette route
    const url = route.url.join('/');
    const role = user.role.toLowerCase();
    console.log('AuthGuard: Checking access', { url, role });

    // Si c'est un admin, autoriser l'accès à toutes les routes protégées
    if (role === 'admin') {
      console.log('AuthGuard: Admin access granted');
      return true;
    }

    // Pour les autres rôles, vérifier que l'URL commence par leur rôle
    if (url.startsWith(role)) {
      console.log('AuthGuard: Role-based access granted');
      return true;
    }

    // Si l'utilisateur n'a pas accès, le rediriger vers son dashboard
    console.log('AuthGuard: Access denied, redirecting to role dashboard');
    const correctPath = `/${role}`;
    this.router.navigate([correctPath]);
    return false;
  }
} 