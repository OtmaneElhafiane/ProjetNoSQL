import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    console.log('AuthService initialized with API URL:', this.apiUrl);
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    console.log('Attempting login with URL:', `${this.apiUrl}/auth/login`);
    
    return this.http.post(`${this.apiUrl}/auth/login`, credentials, {
      headers,
      withCredentials: true
    }).pipe(
      tap(response => console.log('Login response:', response)),
      catchError(this.handleError)
    );
  }

  register(userData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.apiUrl}/auth/register`, userData, {
      headers,
      withCredentials: true
    }).pipe(
      catchError(this.handleError)
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/logout`, {}, {
      withCredentials: true
    }).pipe(
      catchError(this.handleError)
    );
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/profile`, {
      withCredentials: true
    }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error);
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      console.error('Client-side error:', error.error.message);
      errorMessage = error.error.message;
    } else {
      // Erreur côté serveur
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${JSON.stringify(error.error)}`);
      
      if (error.status === 0) {
        errorMessage = 'Impossible de contacter le serveur. Veuillez vérifier votre connexion.';
      } else if (error.status === 401) {
        errorMessage = 'Email ou mot de passe incorrect';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
} 