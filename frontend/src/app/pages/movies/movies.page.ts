import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MovieService } from '../../services/movie.service';
import { Movie } from '../../models/movie.model';
import { FavoritesService } from '../../services/favorites.service';
import { AuthService } from '../../services/auth.service';

@Component({
  imports: [CommonModule, RouterModule],
  templateUrl: './movies.page.html',
  styleUrls: ['./movies.page.css'],
  standalone: true
})
export class MoviesPageComponent implements OnInit {
  loading = signal(true);
  error = signal('');
  movies = signal<Movie[]>([]);
  page = signal(1);
  pageSize = signal(12);
  total = signal(0);
  query = signal('');
  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  favoriteIds = signal<Set<string>>(new Set());

  private movieService = inject(MovieService);
  private favoritesService = inject(FavoritesService);
  private auth = inject(AuthService);

  ngOnInit(): void {
    this.loadMovies(1);
    this.auth.init().then(() => {
      if (this.auth.isAuthenticated()) {
        this.loadFavoriteIds();
      }
    });
  }

  loadMovies(page: number, queryOverride?: string): void {
    this.loading.set(true);
    this.error.set('');

    const query = queryOverride ?? this.query();
    const request$ = query ? this.movieService.searchMovies(query, page) : this.movieService.getMovies(page);

    request$.subscribe({
      next: (res) => {
        if (!res?.ok) {
          this.error.set(res?.error || 'Failed to fetch movies.');
          this.loading.set(false);
          return;
        }
        this.movies.set(Array.isArray(res.data) ? res.data : []);
        this.page.set(typeof res.page === 'number' ? res.page : page);
        this.pageSize.set(typeof res.page_size === 'number' ? res.page_size : 12);
        this.total.set(typeof res.total === 'number' ? res.total : 0);
        this.loading.set(false);
      },
      error: (err) => {
        const message = err?.message ? String(err.message) : 'Request failed';
        this.error.set(`Backend request failed: ${message}`);
        this.loading.set(false);
      }
    });
  }

  prevPage(): void {
    if (this.page() > 1 && !this.loading()) {
      this.loadMovies(this.page() - 1);
    }
  }

  nextPage(): void {
    if (this.page() < this.totalPages() && !this.loading()) {
      this.loadMovies(this.page() + 1);
    }
  }

  onSearchInput(value: string): void {
    const trimmed = (value ?? '').trim();
    this.query.set(trimmed);
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => {
      this.loadMovies(1, trimmed);
    }, 300);
  }

  onPosterError(event: Event): void {
    const target = event.target as HTMLImageElement | null;
    if (!target) {
      return;
    }
    target.src = 'assets/poster-placeholder.svg';
    target.onerror = null;
  }

  loadFavoriteIds(): void {
    this.favoritesService.getFavoriteIds().subscribe({
      next: (res) => {
        if (!res?.ok) {
          return;
        }
        this.favoriteIds.set(new Set(res.data ?? []));
      }
    });
  }

  isFavorite(movieId: string): boolean {
    return this.favoriteIds().has(movieId);
  }

  toggleFavorite(event: Event, movie: Movie): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.auth.isAuthenticated()) {
      const shouldLogin = window.confirm('Sign in to save favorites?');
      if (shouldLogin) {
        void this.auth.login();
      }
      return;
    }

    const movieId = movie._id;
    if (this.isFavorite(movieId)) {
      this.favoritesService.removeFavorite(movieId).subscribe({
        next: (res) => {
          if (!res?.ok) {
            return;
          }
          const updated = new Set(this.favoriteIds());
          updated.delete(movieId);
          this.favoriteIds.set(updated);
        }
      });
      return;
    }

    this.favoritesService.addFavorite(movieId).subscribe({
      next: (res) => {
        if (!res?.ok) {
          return;
        }
        const updated = new Set(this.favoriteIds());
        updated.add(movieId);
        this.favoriteIds.set(updated);
      }
    });
  }
}
