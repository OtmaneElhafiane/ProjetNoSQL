import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  template: `
    <div class="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <p>Welcome to the admin dashboard!</p>
    </div>
  `,
  styles: [`
    .admin-dashboard {
      padding: 20px;
    }
  `]
})
export class AdminDashboardComponent {
  constructor() { }
} 