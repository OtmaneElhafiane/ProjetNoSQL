import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, User } from './auth/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  isLoggedIn$: Observable<boolean>;
  user$: Observable<User | null>;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.isLoggedIn$ = this.authService.user$.pipe(map(user => !!user));
    this.user$ = this.authService.user$;
  }

  ngOnInit(): void {}

  hasRole(role: string): Observable<boolean> {
    return this.authService.user$.pipe(
      map(user => user?.role === role || false)
    );
  }

  logout(): void {
    this.authService.logout();
  }
}
