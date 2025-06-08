import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  error: string = '';
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  ngOnInit(): void {
    console.log('🔄 LoginComponent ngOnInit - Démarrage');
    console.log('🔄 URL actuelle:', this.router.url);
    console.log('🔄 Platform:', isPlatformBrowser(this.platformId) ? 'Browser' : 'Server');
    
    // Vérifier si on est côté client avant d'accéder à localStorage
    if (isPlatformBrowser(this.platformId)) {
      console.log('🔄 localStorage tokens:', {
        access_token: !!localStorage.getItem('access_token'),
        refresh_token: !!localStorage.getItem('refresh_token'),
        user: !!localStorage.getItem('user')
      });
    } else {
      console.log('🔄 Rendu côté serveur - localStorage non disponible');
      return; // Sortir immédiatement côté serveur
    }
    
    // Rediriger si déjà connecté - mais seulement si on n'est pas déjà en cours de redirection
    if (this.authService.isAuthenticated()) {
      const user = this.authService.getCurrentUser();
      console.log('👤 Utilisateur déjà connecté:', user);
      
      if (user) {
        console.log('🔍 Validation du token pour utilisateur:', user.email, 'Rôle:', user.role);
        
        // Test simple : redirection directe sans validation pour voir si c'est le problème
        console.log('🚀 TEST: Redirection directe sans validation');
        setTimeout(() => {
          this.authService.redirectToRoleDashboard(user.role);
        }, 100);
        
        return;
        
        /*
        // Vérifier d'abord que le token est valide avant de rediriger
        this.authService.validateToken().subscribe({
          next: (response) => {
            console.log('✅ Réponse validateToken:', response);
            if (response.valid && response.user) {
              console.log('✅ Token valide, redirection vers dashboard');
              this.authService.redirectToRoleDashboard(response.user.role);
            } else {
              console.log('❌ Token invalide, nettoyage de la session');
              this.authService.logout();
            }
          },
          error: (error) => {
            console.error('❌ Erreur validation token dans ngOnInit:', error);
            console.error('❌ Status:', error.status);
            console.error('❌ Message:', error.message);
            // Ne pas faire de logout automatique, laisser l'utilisateur se reconnecter
            if (error.status === 0 || error.status >= 500) {
              console.log('🌐 Problème de connexion serveur, on reste sur login');
            } else {
              this.authService.logout();
            }
          }
        });
        */
      }
    } else {
      console.log('❌ Utilisateur non authentifié');
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.error = '';
      
      const { email, password } = this.loginForm.value;
      
      this.authService.login({ email, password }).subscribe({
        next: (response) => {
          console.log('🎉 Connexion réussie:', response);
          console.log('🎯 redirect_path reçu:', response.redirect_path);
          console.log('👤 Utilisateur:', response.user);
          
          // TEST: Redirection manuelle simple
          console.log('🚀 TEST: Redirection directe vers admin dashboard');
          
          // Attendre un peu pour que la session soit bien enregistrée
          setTimeout(() => {
            console.log('⏰ Timeout terminé, navigation vers /admin/dashboard');
            this.router.navigate(['/admin/dashboard']).then(
              (success) => {
                console.log('✅ Navigation réussie:', success);
                console.log('📍 URL finale:', this.router.url);
              },
              (error) => {
                console.error('❌ Erreur navigation:', error);
              }
            );
          }, 500);
          
          /*
          // Redirection basée sur le rôle
          if (response.redirect_path) {
            this.router.navigate([response.redirect_path]);
          } else {
            this.authService.redirectToRoleDashboard(response.user.role);
          }
          */
        },
        error: (error) => {
          console.error('Erreur de connexion:', error);
          this.isLoading = false;
          
          if (error.error && error.error.error) {
            this.error = error.error.error;
          } else if (error.message) {
            this.error = error.message;
          } else {
            this.error = 'Une erreur est survenue lors de la connexion. Veuillez réessayer.';
          }
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.loginForm.controls).forEach(key => {
        const control = this.loginForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
    }
  }

  // Getters pour faciliter l'accès aux contrôles dans le template
  get emailControl() {
    return this.loginForm.get('email');
  }

  get passwordControl() {
    return this.loginForm.get('password');
  }

  get isEmailInvalid() {
    return this.emailControl?.invalid && this.emailControl?.touched;
  }

  get isPasswordInvalid() {
    return this.passwordControl?.invalid && this.passwordControl?.touched;
  }
} 