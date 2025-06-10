// src/app/admin/admin.module.ts

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// --- 1. IMPORT YOUR NEW ROUTING MODULE ---
import { AdminRoutingModule } from './admin-routing.module';

// --- 2. IMPORT ALL YOUR ADMIN COMPONENTS ---
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

@NgModule({
  // --- 3. DECLARE ALL THE COMPONENTS ---
  declarations: [
    AdminDashboardComponent,
    AddDoctorComponent,
    EditDoctorComponent,
    ViewDoctorComponent,
    AddPatientComponent,
    EditPatientComponent,
    PatientHistoryComponent,
    AddConsultationComponent,

  ],
  // --- 4. IMPORT THE NEEDED MODULES ---
  imports: [
    CommonModule,
    AdminRoutingModule, // <-- Add it here
    FormsModule,
    ReactiveFormsModule
  ]
})
export class AdminModule { }
