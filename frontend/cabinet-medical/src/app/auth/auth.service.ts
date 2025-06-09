import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'doctor' | 'patient';
  first_name?: string;
  last_name?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
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
  private apiUrl = environment.apiUrl;
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();
  private initialized = false;
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.initializeAuth();
  }

  private initializeAuth(): void {
    if (this.initialized) return;
    
    try {
      if (this.isBrowser) {
        const token = localStorage.getItem('access_token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
          const user = JSON.parse(userStr);
          this.userSubject.next(user);
        } else {
          this.clearAuth();
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      this.clearAuth();
    }
    
    this.initialized = true;
  }

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response?.access_token && response?.user) {
            this.setAuthData(response);
          } else {
            throw new Error('Invalid login response');
          }
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  register(data: RegisterData): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/register`, data)
      .pipe(
        tap(response => {
          if (response?.access_token && response?.user) {
            this.setAuthData(response);
          }
        }),
        catchError(error => {
          console.error('Register error:', error);
          return throwError(() => error);
        })
      );
  }

  private setAuthData(response: LoginResponse): void {
    if (!response?.access_token || !response?.user) {
      throw new Error('Invalid auth data');
    }
    if (this.isBrowser) {
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    this.userSubject.next(response.user);
  }

  private clearAuth(): void {
    if (this.isBrowser) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
    this.userSubject.next(null);
  }

  logout(): void {
    this.clearAuth();
  }

  isAuthenticated(): boolean {
    const token = this.isBrowser ? localStorage.getItem('access_token') : null;
    const user = this.userSubject.value;
    return !!(token && user);
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  getAccessToken(): string | null {
    return this.isBrowser ? localStorage.getItem('access_token') : null;
  }

  validateToken(): Observable<{ valid: boolean; user?: User }> {
    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${this.getAccessToken()}`
    );
    return this.http.get<{ valid: boolean; user?: User }>(
      `${this.apiUrl}/auth/validate-token`,
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Token validation error:', error);
        return throwError(() => error);
      })
    );
  }
} 