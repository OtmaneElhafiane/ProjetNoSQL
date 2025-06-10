// src/app/admin/admin-routing.module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Import all the components this module will route to
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { AddDoctorComponent } from './components/add-doctor/add-doctor.component';
import { EditDoctorComponent } from './components/edit-doctor/edit-doctor.component';
import { ViewDoctorComponent } from './components/view-doctor/view-doctor.component';
import { AddPatientComponent } from './components/add-patient/add-patient.component';
import { EditPatientComponent } from './components/edit-patient/edit-patient.component';
import { ViewPatientComponent } from './components/view-patient/view-patient.component';
import { PatientHistoryComponent } from './components/patient-history/patient-history.component';
import { AddConsultationComponent } from './components/add-consultation/add-consultation.component';
import { EditConsultationComponent } from './components/edit-consultation/edit-consultation.component';
import { ViewConsultationComponent } from './components/view-consultation/view-consultation.component';
import { ConsultationListComponent } from './components/consultation-list/consultation-list.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: AdminDashboardComponent },
  
  // Doctor Routes
  { path: 'doctors/add', component: AddDoctorComponent },
  { path: 'doctors/edit/:id', component: EditDoctorComponent },
  { path: 'doctors/view/:id', component: ViewDoctorComponent },

  // Patient Routes
  { path: 'patients/add', component: AddPatientComponent },
  { path: 'patients/edit/:id', component: EditPatientComponent },
  { path: 'patients/view/:id', component: ViewPatientComponent },
  { path: 'patients/history/:id', component: PatientHistoryComponent },

  // Consultation Routes
  { path: 'consultations', component: ConsultationListComponent },
  { path: 'consultations/add', component: AddConsultationComponent },
  { path: 'consultations/edit/:id', component: EditConsultationComponent },
  { path: 'consultations/view/:id', component: ViewConsultationComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }