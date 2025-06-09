import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DoctorDashboardComponent } from './doctor-dashboard/doctor-dashboard.component';
import { DoctorListComponent } from './doctor-list/doctor-list.component';
import { DoctorDetailComponent } from './doctor-detail/doctor-detail.component';
import { ConsultationHistoryComponent } from '../patient/consultation-history/consultation-history.component';
const routes: Routes = [
  {
    path: '',
    component: DoctorDashboardComponent
  },
  {
    path: 'list',
    component: DoctorListComponent
  },
  {
    path: ':id',
    component: DoctorDetailComponent
  },
  {
    path: 'consultations-history',
    component: ConsultationHistoryComponent
  },
];

@NgModule({
  declarations: [
    DoctorDashboardComponent,
    DoctorListComponent,
    DoctorDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ]
})
export class DoctorModule { }
