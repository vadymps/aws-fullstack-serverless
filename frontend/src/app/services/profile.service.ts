import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppConfigService } from './app-config.service';
import { ProfileResponse } from '../models/profile.model';

export interface ProfileNameUpdatePayload {
  given_name?: string;
  family_name?: string;
  email?: string;
}

export interface ProfilePictureUpdatePayload {
  picture_base64?: string;
  picture_name?: string;
  picture_type?: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private apiBaseUrl = this.config.get().apiUrl.trim().replace(/\/+$/, '');

  getProfile() {
    return this.http.get<ProfileResponse>(`${this.apiBaseUrl}/profile`);
  }

  updateProfile(payload: ProfileNameUpdatePayload) {
    return this.http.post<ProfileResponse>(`${this.apiBaseUrl}/profile`, payload);
  }

  updateProfilePicture(payload: ProfilePictureUpdatePayload) {
    return this.http.post<ProfileResponse>(`${this.apiBaseUrl}/profile/picture`, payload);
  }
}
