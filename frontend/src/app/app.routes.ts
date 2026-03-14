import { Routes } from '@angular/router';
import { MoviesPageComponent } from './pages/movies/movies.page';
import { LoginPageComponent } from './pages/login/login.page';
import { ProtectedRouteComponent } from './components/protected-route/protected-route.component';
import { ProfilePageComponent } from './pages/profile/profile.page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'movies' },
  { path: 'login', component: LoginPageComponent },
  { path: 'movies', component: MoviesPageComponent },
  {
    path: 'profile',
    component: ProtectedRouteComponent,
    data: { redirectDelayMs: 600 },
    children: [{ path: '', component: ProfilePageComponent }]
  },
  { path: '**', redirectTo: 'movies' }
];
