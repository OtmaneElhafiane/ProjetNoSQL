import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './components/dashboard/dashboard.component';
import { PatientManagementComponent } from './components/patient-management/patient-management.component';
import { DoctorManagementComponent } from './components/doctor-management/doctor-management.component';
import { ConsultationManagementComponent } from './components/consultation-management/consultation-management.component';

const routes: Routes = [
  {
    path: '',
    component: AdminDashboardComponent
  },
  {
    path: 'patients',
    component: PatientManagementComponent
  },
  {
    path: 'doctors',
    component: DoctorManagementComponent
  },
  {
    path: 'consultations',
    component: ConsultationManagementComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
