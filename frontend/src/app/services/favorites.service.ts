import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import {
  Favorite,
  FavoriteIdsResponse,
  FavoritesResponse,
  FavoriteMutationResponse
} from '../models/favorite.model';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private apiBaseUrl = this.config.get().apiUrl.trim().replace(/\/+$/, '');

  getFavorites(page = 1): Observable<FavoritesResponse> {
    return this.http.get<FavoritesResponse>(`${this.apiBaseUrl}/favorites`, {
      params: new HttpParams().set('page', page)
    });
  }

  getFavoriteIds(): Observable<FavoriteIdsResponse> {
    return this.http.get<FavoriteIdsResponse>(`${this.apiBaseUrl}/favorites/ids`);
  }

  addFavorite(movieId: string): Observable<FavoriteMutationResponse> {
    return this.http.post<FavoriteMutationResponse>(`${this.apiBaseUrl}/favorites`, {
      movie_id: movieId
    });
  }

  removeFavorite(movieId: string): Observable<FavoriteMutationResponse> {
    return this.http.delete<FavoriteMutationResponse>(
      `${this.apiBaseUrl}/favorites/${encodeURIComponent(movieId)}`
    );
  }
}
