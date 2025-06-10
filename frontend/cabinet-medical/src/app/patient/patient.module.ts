import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PatientDashboardComponent } from './patient-dashboard/patient-dashboard.component';
import { PatientListComponent } from './patient-list/patient-list.component';
import { PatientDetailComponent } from './patient-detail/patient-detail.component';
import {ConsultationHistoryComponent} from "./consultation-history/consultation-history.component";

const routes: Routes = [
  {
    path: '',
    component: PatientDashboardComponent
  },
  {
    path: 'consultations',
    component: ConsultationHistoryComponent
  },
];

@NgModule({
  declarations: [
    PatientDashboardComponent,
    ConsultationHistoryComponent,
    PatientListComponent,
    PatientDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ]
})
export class PatientModule { }
