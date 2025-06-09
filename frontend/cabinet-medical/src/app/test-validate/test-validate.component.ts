import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { CommonModule } from '@angular/common';

interface ValidationResponse {
  valid: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

interface ValidationError extends Error {
  status?: number;
  url?: string;
}

@Component({
  selector: 'app-test-validate',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="test-container">
      <h2>Test de Validation du Token</h2>
      <div *ngIf="isLoading">Validation en cours...</div>
      <div *ngIf="error" class="error">{{ error }}</div>
      <div *ngIf="validationResult" class="result">
        <p>Token valide: {{ validationResult.valid }}</p>
        <div *ngIf="validationResult.user">
          <p>Utilisateur: {{ validationResult.user.email }}</p>
          <p>Rôle: {{ validationResult.user.role }}</p>
      </div>
      </div>
      <div class="logs">
        <h3>Logs</h3>
        <div *ngFor="let log of logs">{{ log }}</div>
      </div>
    </div>
  `,
  styles: [`
    .test-container {
      padding: 20px;
      max-width: 600px;
      margin: 0 auto;
    }
    .error {
      color: red;
      margin: 10px 0;
    }
    .result {
      margin-top: 20px;
      padding: 15px;
      background-color: #f5f5f5;
      border-radius: 5px;
    }
    .logs {
      margin-top: 20px;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 5px;
    }
  `]
})
export class TestValidateComponent implements OnInit {
  isLoggedIn = false;
  logs: string[] = [];
  isLoading = false;
  error = '';
  validationResult: ValidationResponse | null = null;

  constructor(private authService: AuthService) {
    this.addLog('🚀 Composant de test initialisé');
    this.checkAuthStatus();
  }

  ngOnInit(): void {
    this.testValidateToken();
  }

  checkAuthStatus() {
    this.isLoggedIn = this.authService.isAuthenticated();
    this.addLog(`🔍 Statut d'authentification: ${this.isLoggedIn ? 'Connecté' : 'Non connecté'}`);
  }

  testLogin() {
    this.addLog('🔐 Tentative de connexion...');
    
    const credentials = {
      email: 'admin@cabinet.com',
      password: 'admin123'
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.addLog('✅ Connexion réussie!');
        this.addLog(`👤 Utilisateur: ${response.user.email} (${response.user.role})`);
        this.addLog(`🔑 Token: ${response.access_token.substring(0, 50)}...`);
        this.isLoggedIn = true;
      },
      error: (error) => {
        this.addLog(`❌ Erreur de connexion: ${error.message}`);
        this.addLog(`📊 Status: ${error.status}`);
        console.error('Erreur de connexion:', error);
      }
    });
  }

  testValidateToken(): void {
    this.isLoading = true;
    this.error = '';
    this.validationResult = null;
    this.addLog('🔍 Test de validation du token...');
    
    this.authService.validateToken().subscribe({
      next: (response: ValidationResponse) => {
        this.validationResult = response;
        this.isLoading = false;
        this.addLog('✅ Validation réussie!');
        this.addLog(`📊 Valid: ${response.valid}`);
        if (response.user) {
          this.addLog(`👤 User: ${response.user.email}`);
          this.addLog(`🎭 Role: ${response.user.role}`);
        }
      },
      error: (error: ValidationError) => {
        this.error = error.message || 'Une erreur est survenue lors de la validation';
        this.isLoading = false;
        this.addLog(`❌ Erreur de validation: ${this.error}`);
        if (error.status) this.addLog(`📊 Status: ${error.status}`);
        if (error.url) this.addLog(`🌐 URL: ${error.url}`);
      }
    });
  }

  clearLogs() {
    this.logs = [];
    this.addLog('🧹 Logs effacés');
  }

  private addLog(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.logs.unshift(`[${timestamp}] ${message}`);
  }
} 