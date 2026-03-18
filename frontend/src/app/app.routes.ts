import { Routes } from '@angular/router';
import { MoviesPageComponent } from './pages/movies/movies.page';
import { ProfilePageComponent } from './pages/profile/profile.page';
import { UsersPageComponent } from './pages/users/users.page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'movies' },
  { path: 'movies', component: MoviesPageComponent },
  { path: 'users', component: UsersPageComponent },
  { path: 'profile', component: ProfilePageComponent },
  { path: '**', redirectTo: 'movies' }
];
