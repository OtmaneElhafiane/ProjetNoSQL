import { Component } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-test-validate',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 20px; font-family: Arial;">
      <h2>🔍 Test de l'endpoint validate-token</h2>
      
      <div style="margin: 20px 0;">
        <button (click)="testLogin()" style="padding: 10px; margin-right: 10px; background: #007bff; color: white; border: none; border-radius: 4px;">
          1. Se connecter
        </button>
        
        <button (click)="testValidateToken()" [disabled]="!isLoggedIn" style="padding: 10px; margin-right: 10px; background: #28a745; color: white; border: none; border-radius: 4px;">
          2. Valider le token
        </button>
        
        <button (click)="clearLogs()" style="padding: 10px; background: #6c757d; color: white; border: none; border-radius: 4px;">
          Effacer les logs
        </button>
      </div>
      
      <div style="margin: 20px 0;">
        <strong>Statut:</strong> 
        <span [style.color]="isLoggedIn ? 'green' : 'red'">
          {{ isLoggedIn ? 'Connecté' : 'Non connecté' }}
        </span>
      </div>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; max-height: 400px; overflow-y: auto;">
        <h3>📋 Logs:</h3>
        <div *ngFor="let log of logs" [innerHTML]="log" style="margin: 5px 0; font-family: monospace; font-size: 12px;"></div>
      </div>
    </div>
  `
})
export class TestValidateComponent {
  isLoggedIn = false;
  logs: string[] = [];

  constructor(private authService: AuthService) {
    this.addLog('🚀 Composant de test initialisé');
    this.checkAuthStatus();
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

  testValidateToken() {
    this.addLog('🔍 Test de validation du token...');
    
    this.authService.validateToken().subscribe({
      next: (response) => {
        this.addLog('✅ Validation réussie!');
        this.addLog(`📊 Valid: ${response.valid}`);
        if (response.user) {
          this.addLog(`👤 Utilisateur: ${response.user.email} (${response.user.role})`);
        }
      },
      error: (error) => {
        this.addLog(`❌ Erreur de validation: ${error.message}`);
        this.addLog(`📊 Status: ${error.status}`);
        this.addLog(`🌐 URL: ${error.url}`);
        console.error('Erreur de validation:', error);
      }
    });
  }

  clearLogs() {
    this.logs = [];
    this.addLog('🧹 Logs effacés');
  }

  private addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    this.logs.push(`<span style="color: #666;">[${timestamp}]</span> ${message}`);
  }
} 