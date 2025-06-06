import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DoctorDashboardComponent } from './components/doctor-dashboard/doctor-dashboard.component';
import { DoctorConsultationsComponent } from './components/doctor-consultations/doctor-consultations.component';

const routes: Routes = [
  {
    path: '',
    component: DoctorDashboardComponent
  },
  {
    path: 'consultations',
    component: DoctorConsultationsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DoctorRoutingModule { }
