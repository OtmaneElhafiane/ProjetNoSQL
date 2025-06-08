import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'doctor' | 'patient';
  first_name?: string;
  last_name?: string;
  created_at?: string;
  last_login?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
  redirect_path: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: 'patient' | 'doctor';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://127.0.0.1:5000/api/auth';
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeAuth();
    }
  }

  private initializeAuth(): void {
    const token = this.getAccessToken();
    console.log('🔄 initializeAuth - Token présent:', !!token);
    
    if (token) {
      // Éviter la validation automatique qui peut créer des boucles de redirection
      // La validation sera faite par les guards quand nécessaire
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          this.userSubject.next(user);
          console.log('👤 Utilisateur restauré depuis localStorage:', user.email);
        } catch (error) {
          console.error('❌ Erreur parsing user localStorage:', error);
          this.logout();
        }
      }
    }
  }

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);
          localStorage.setItem('user', JSON.stringify(response.user));
        }
        this.userSubject.next(response.user);
      }),
      catchError(error => {
        console.error('Erreur de connexion:', error);
        throw error;
      })
    );
  }

  register(userData: RegisterData): Observable<any> {
    console.log('📝 Inscription avec données:', userData);
    
    // Utiliser l'endpoint de création d'admin si c'est un administrateur, sinon endpoint générique
    const endpoint = '/register';
    return this.http.post<any>(`${this.apiUrl}${endpoint}`, userData).pipe(
      tap(response => {
        console.log('✅ Réponse inscription:', response);
        // Si l'inscription retourne un token, connecter automatiquement l'utilisateur
        if (response?.access_token && response?.user) {
          console.log('🔑 Connexion automatique après inscription');
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('refresh_token', response.refresh_token || '');
            localStorage.setItem('user', JSON.stringify(response.user));
          }
          this.userSubject.next(response.user);
        }
      }),
      catchError(error => {
        console.error('❌ Erreur d\'inscription:', error);
        throw error;
      })
    );
  }

  validateToken(): Observable<{valid: boolean, user?: User}> {
    const headers = this.getAuthHeaders();
    console.log('🔍 Validation du token - URL:', `${this.apiUrl}/validate-token`);
    console.log('🔍 Headers:', headers.get('Authorization'));
    
    return this.http.get<{valid: boolean, user?: User}>(`${this.apiUrl}/validate-token`, { headers }).pipe(
      tap(response => {
        console.log('✅ Réponse validate-token:', response);
      }),
      catchError(error => {
        console.error('❌ Erreur validate-token:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ URL appelée:', error.url);
        throw error;
      })
    );
  }

  refreshToken(): Observable<{access_token: string}> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${refreshToken}`
    });

    return this.http.post<{access_token: string}>(`${this.apiUrl}/refresh`, {}, { headers }).pipe(
      tap(response => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('access_token', response.access_token);
        }
      })
    );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      sessionStorage.clear();
    }
    this.userSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    
    const token = this.getAccessToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  getCurrentUser(): User | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return this.userSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }

  getAccessToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return localStorage.getItem('refresh_token');
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getAccessToken();
    console.log('🔑 Token récupéré:', token ? `${token.substring(0, 50)}...` : 'AUCUN TOKEN');
    
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  getProfile(): Observable<User> {
    const headers = this.getAuthHeaders();
    return this.http.get<User>(`${this.apiUrl}/profile`, { headers });
  }

  redirectToRoleDashboard(role?: string): void {
    const userRole = role || this.getCurrentUser()?.role;
    console.log('🔄 redirectToRoleDashboard appelée avec rôle:', userRole);
    console.log('🔄 URL actuelle avant redirection:', this.router.url);
    console.log('🔄 isRedirecting flag:', this.isRedirecting);
    
    // Éviter les redirections multiples
    if (this.isRedirecting) {
      console.log('⚠️ Redirection déjà en cours, ignorée');
      return;
    }
    
    // Vérifier si on n'est pas déjà sur la bonne route
    const currentUrl = this.router.url;
    const targetPath = this.getRoleTargetPath(userRole);
    
    console.log('🎯 Path cible calculé:', targetPath);
    console.log('📍 URL actuelle:', currentUrl);
    
    if (currentUrl === targetPath) {
      console.log('✅ Déjà sur la bonne route:', currentUrl);
      return;
    }
    
    this.isRedirecting = true;
    console.log('⏳ Flag isRedirecting mis à true');
    
    // Réinitialiser le flag après un délai
    setTimeout(() => {
      this.isRedirecting = false;
      console.log('🔄 Flag isRedirecting remis à false');
    }, 1000);
    
    console.log('🚀 Tentative de navigation vers:', targetPath);
    
    this.router.navigate([targetPath]).then(
      (success) => {
        console.log('✅ Navigation réussie:', success);
        console.log('📍 Nouvelle URL:', this.router.url);
      },
      (error) => {
        console.error('❌ Erreur de navigation:', error);
      }
    );
  }

  private getRoleTargetPath(role?: string): string {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'doctor':
        return '/doctor/dashboard';
      case 'patient':
        return '/patient/dashboard';
      default:
        return '/dashboard';
    }
  }

  private isRedirecting = false;

  canAccessRoute(requiredRole: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    return user.role === requiredRole;
  }

  canAccessAdminRoutes(): boolean {
    return this.canAccessRoute('admin');
  }

  canAccessDoctorRoutes(): boolean {
    return this.canAccessRoute('doctor');
  }

  canAccessPatientRoutes(): boolean {
    return this.canAccessRoute('patient');
  }
} 