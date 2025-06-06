import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export interface User {
  _id: string;
  email: string;
  role: 'admin' | 'doctor' | 'patient';
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api';
  private userSubject = new BehaviorSubject<any>(null);
  public user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const user = localStorage.getItem('user');
      if (user) {
        this.userSubject.next(JSON.parse(user));
      }
    }
  }

  getSelectedRole(): string {
    if (isPlatformBrowser(this.platformId)) {
      return sessionStorage.getItem('selectedRole') || '';
    }
    return '';
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    const role = this.getSelectedRole();
    return this.http.post(`${this.apiUrl}/auth/${role}/login`, credentials).pipe(
      tap(user => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        this.userSubject.next(user);
      })
    );
  }

  register(userData: any): Observable<any> {
    const role = this.getSelectedRole();
    return this.http.post(`${this.apiUrl}/auth/${role}/register`, userData);
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('user');
      sessionStorage.removeItem('selectedRole');
    }
    this.userSubject.next(null);
    this.router.navigate(['/auth/select-role']);
  }

  isAuthenticated(): boolean {
    return this.userSubject.value !== null;
  }

  getCurrentUser(): any {
    return this.userSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
} 