import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MovieService } from '../../services/movie.service';
import { MovieDetail } from '../../models/movie.model';
import { FavoritesService } from '../../services/favorites.service';
import { AuthService } from '../../services/auth.service';

@Component({
  imports: [CommonModule, RouterModule],
  templateUrl: './movie.page.html',
  styleUrls: ['./movie.page.css'],
  standalone: true
})
export class MoviePageComponent implements OnInit {
  loading = signal(true);
  error = signal('');
  movie = signal<MovieDetail | null>(null);
  isFavorite = signal(false);
  backLink = signal('/movies');
  backLabel = signal('Back to Movies');

  private route = inject(ActivatedRoute);
  private movieService = inject(MovieService);
  private favoritesService = inject(FavoritesService);
  private auth = inject(AuthService);

  ngOnInit(): void {
    const origin = this.route.snapshot.queryParamMap.get('from') || 'movies';
    if (origin === 'favorites') {
      this.backLink.set('/favorites');
      this.backLabel.set('Back to Favorites');
    } else {
      this.backLink.set('/movies');
      this.backLabel.set('Back to Movies');
    }
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Movie id not found.');
      this.loading.set(false);
      return;
    }
    this.loadMovie(id);
    this.auth.init().then(() => {
      if (this.auth.isAuthenticated()) {
        this.loadFavoriteState(id);
      }
    });
  }

  loadMovie(id: string): void {
    this.loading.set(true);
    this.error.set('');

    this.movieService.getMovieById(id).subscribe({
      next: (res) => {
        if (!res?.ok) {
          this.error.set(res?.error || 'Failed to fetch movie.');
          this.loading.set(false);
          return;
        }
        this.movie.set(res.data ?? null);
        this.loading.set(false);
      },
      error: (err) => {
        const message = err?.message ? String(err.message) : 'Request failed';
        this.error.set(`Backend request failed: ${message}`);
        this.loading.set(false);
      }
    });
  }

  onPosterError(event: Event): void {
    const target = event.target as HTMLImageElement | null;
    if (!target) {
      return;
    }
    target.src = 'assets/poster-placeholder.svg';
    target.onerror = null;
  }

  loadFavoriteState(movieId: string): void {
    this.favoritesService.getFavoriteIds().subscribe({
      next: (res) => {
        if (!res?.ok) {
          return;
        }
        this.isFavorite.set((res.data ?? []).includes(movieId));
      }
    });
  }

  toggleFavorite(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const currentMovie = this.movie();
    if (!currentMovie) {
      return;
    }

    if (!this.auth.isAuthenticated()) {
      const shouldLogin = window.confirm('Sign in to save favorites?');
      if (shouldLogin) {
        void this.auth.login();
      }
      return;
    }

    const movieId = currentMovie._id;
    if (this.isFavorite()) {
      this.favoritesService.removeFavorite(movieId).subscribe({
        next: (res) => {
          if (!res?.ok) {
            return;
          }
          this.isFavorite.set(false);
        }
      });
      return;
    }

    this.favoritesService.addFavorite(movieId).subscribe({
      next: (res) => {
        if (!res?.ok) {
          return;
        }
        this.isFavorite.set(true);
      }
    });
  }
}
