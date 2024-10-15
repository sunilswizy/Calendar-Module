import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CalendarComponent } from './components/calendar/calendar.component';
import { ButtonModule } from 'primeng/button';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ColorPickerModule } from 'primeng/colorpicker';
import { AutoFocusModule } from 'primeng/autofocus';


@NgModule({
  declarations: [
    AppComponent,
    CalendarComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ButtonModule,
    OverlayPanelModule,
    CalendarModule,
    DropdownModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    BrowserAnimationsModule,
    InputTextModule,
    ToastModule,
    ColorPickerModule,
    AutoFocusModule
  ],
  providers: [MessageService],
  bootstrap: [AppComponent]
})
export class AppModule { }
