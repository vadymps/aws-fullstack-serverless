import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Favorite, FavoritesResponse } from '../../models/favorite.model';
import { FavoritesService } from '../../services/favorites.service';

@Component({
  imports: [CommonModule, RouterModule],
  templateUrl: './favorites.page.html',
  styleUrls: ['./favorites.page.css'],
  standalone: true
})
export class FavoritesPageComponent implements OnInit {
  title = 'Favorites';
  loading = signal(true);
  error = signal('');
  favorites = signal<Favorite[]>([]);
  page = signal(1);
  pageSize = signal(10);
  total = signal(0);
  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  private favoritesService = inject(FavoritesService);

  ngOnInit(): void {
    this.loadFavorites(1);
  }

  loadFavorites(page: number): void {
    this.loading.set(true);
    this.error.set('');

    this.favoritesService.getFavorites(page).subscribe({
        next: (res) => {
          if (!res?.ok) {
            this.error.set(res?.error || 'Failed to fetch favorites.');
            this.loading.set(false);
            return;
          }
          this.favorites.set(Array.isArray(res.data) ? res.data : []);
          this.page.set(typeof res.page === 'number' ? res.page : page);
          this.pageSize.set(typeof res.page_size === 'number' ? res.page_size : 10);
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
      this.loadFavorites(this.page() - 1);
    }
  }

  nextPage(): void {
    if (this.page() < this.totalPages() && !this.loading()) {
      this.loadFavorites(this.page() + 1);
    }
  }

  removeFavorite(movieId: string): void {
    this.favoritesService.removeFavorite(movieId).subscribe({
      next: (res) => {
        if (!res?.ok) {
          this.error.set(res?.error || 'Failed to remove favorite.');
          return;
        }
        const updated = this.favorites().filter((fav) => fav.movie_id !== movieId);
        this.favorites.set(updated);
        this.total.set(Math.max(0, this.total() - 1));
      },
      error: (err) => {
        const message = err?.message ? String(err.message) : 'Request failed';
        this.error.set(`Backend request failed: ${message}`);
      }
    });
  }
}
