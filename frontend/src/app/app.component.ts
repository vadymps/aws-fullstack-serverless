import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

type Movie = {
  _id: string;
  title?: string;
  year?: number;
  genres?: string[];
  runtime?: number;
};

type MoviesResponse = {
  ok: boolean;
  page: number;
  page_size: number;
  total: number;
  data: Movie[];
  error?: string;
  details?: string;
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Movies';
  loading = signal(true);
  error = signal('');
  movies = signal<Movie[]>([]);
  page = signal(1);
  pageSize = signal(10);
  total = signal(0);
  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  private http = inject(HttpClient);
  private apiBaseUrl = environment.apiUrl.trim().replace(/\/+$/, '');

  constructor() {
    if (!this.apiBaseUrl) {
      this.loading.set(false);
      this.error.set('Set environment.apiUrl to your backend URL.');
      return;
    }
    this.loadMovies(1);
  }

  loadMovies(page: number): void {
    this.loading.set(true);
    this.error.set('');

    this.http
      .get<MoviesResponse>(`${this.apiBaseUrl}/movies`, { params: { page } })
      .subscribe({
        next: (res) => {
          if (!res?.ok) {
            this.error.set(res?.error || 'Failed to fetch movies.');
            this.loading.set(false);
            return;
          }
          this.movies.set(Array.isArray(res.data) ? res.data : []);
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
      this.loadMovies(this.page() - 1);
    }
  }

  nextPage(): void {
    if (this.page() < this.totalPages() && !this.loading()) {
      this.loadMovies(this.page() + 1);
    }
  }
}
