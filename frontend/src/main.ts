import { bootstrapApplication } from '@angular/platform-browser';
import { ɵprovideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [ɵprovideZonelessChangeDetection(), provideHttpClient()]
}).catch((err) => console.error(err));
