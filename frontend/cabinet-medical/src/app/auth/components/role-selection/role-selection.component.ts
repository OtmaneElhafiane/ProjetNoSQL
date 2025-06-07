import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-role-selection',
  templateUrl: './role-selection.component.html',
  styleUrls: ['./role-selection.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class RoleSelectionComponent {
  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  selectRole(role: 'admin' | 'doctor' | 'patient') {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('selectedRole', role);
    }
    this.router.navigate(['/auth/login']);
  }
} 