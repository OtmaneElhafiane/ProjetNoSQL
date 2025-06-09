import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { TestValidateComponent } from './test-validate/test-validate.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'doctor',
    loadChildren: () => import('./doctor/doctor.module').then(m => m.DoctorModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'patient',
    loadChildren: () => import('./patient/patient.module').then(m => m.PatientModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'test-validate',
    component: TestValidateComponent
  },
  {
    path: 'dashboard',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];
