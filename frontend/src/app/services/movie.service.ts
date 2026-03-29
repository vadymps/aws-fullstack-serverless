import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { MovieDetailResponse, MoviesResponse } from '../models/movie.model';

@Injectable({ providedIn: 'root' })
export class MovieService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private apiBaseUrl = this.config.get().apiUrl.trim().replace(/\/+$/, '');

  getMovies(page = 1): Observable<MoviesResponse> {
    return this.http.get<MoviesResponse>(`${this.apiBaseUrl}/movies`, {
      params: new HttpParams().set('page', page)
    });
  }

  searchMovies(query: string, page = 1): Observable<MoviesResponse> {
    let params = new HttpParams().set('page', page);
    const trimmed = query.trim();
    if (trimmed) {
      params = params.set('q', trimmed);
    }
    return this.http.get<MoviesResponse>(`${this.apiBaseUrl}/movies`, { params });
  }

  getMovieById(id: string): Observable<MovieDetailResponse> {
    return this.http.get<MovieDetailResponse>(`${this.apiBaseUrl}/movies/${id}`);
  }
}
