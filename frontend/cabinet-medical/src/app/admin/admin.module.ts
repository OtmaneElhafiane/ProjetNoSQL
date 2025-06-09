import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import {PatientDetailComponent} from "../patient/patient-detail/patient-detail.component";
import {PatientListComponent} from "../patient/patient-list/patient-list.component";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";

const routes: Routes = [
  {
    path: '',
    component: AdminDashboardComponent
  },

];

@NgModule({
  declarations: [
    AdminDashboardComponent,
    PatientDetailComponent,
    PatientListComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    FormsModule
  ]
})
export class AdminModule { }
