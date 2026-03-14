import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AppConfigService } from '../../services/app-config.service';
import { Movie, MoviesResponse } from '../../models/movie.model';

@Component({
  selector: 'app-movies-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './movies.page.html',
  styleUrls: ['./movies.page.css']
})
export class MoviesPageComponent implements OnInit {
  title = 'Movies';
  loading = signal(true);
  error = signal('');
  movies = signal<Movie[]>([]);
  page = signal(1);
  pageSize = signal(10);
  total = signal(0);
  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private apiBaseUrl = this.config.get().apiUrl.trim().replace(/\/+$/, '');

  ngOnInit(): void {
    this.loadMovies(1);
  }

  loadMovies(page: number): void {
    this.loading.set(true);
    this.error.set('');

    this.http
      .get<MoviesResponse>(`${this.apiBaseUrl}/movies`, {
        params: { page }
      })
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
