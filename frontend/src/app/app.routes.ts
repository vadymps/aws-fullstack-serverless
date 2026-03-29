import { Routes } from '@angular/router';
import { MoviesPageComponent } from './pages/movies/movies.page';
import { MoviePageComponent } from './pages/movie/movie.page';
import { ProfilePageComponent } from './pages/profile/profile.page';
import { FavoritesPageComponent } from './pages/favorites/favorites.page';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'movies' },
  { path: 'movies', component: MoviesPageComponent },
  { path: 'movies/:id', component: MoviePageComponent },
  { path: 'favorites', component: FavoritesPageComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfilePageComponent },
  { path: '**', redirectTo: 'movies' }
];
