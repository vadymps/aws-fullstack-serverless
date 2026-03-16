import { Routes } from '@angular/router';
import { MoviesPageComponent } from './pages/movies/movies.page';
import { ProfilePageComponent } from './pages/profile/profile.page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'movies' },
  { path: 'movies', component: MoviesPageComponent },
  { path: 'profile', component: ProfilePageComponent },
  { path: '**', redirectTo: 'movies' }
];
