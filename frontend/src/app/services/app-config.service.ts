import { Injectable } from '@angular/core';

type AuthConfig = {
  issuer?: string;
  clientId?: string;
  redirectUri?: string;
  postLogoutRedirectUri?: string;
  scope?: string;
};

export type AppConfig = {
  production: boolean;
  apiUrl: string;
  auth: AuthConfig;
};

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private config: AppConfig | null = null;

  async load(): Promise<void> {
    const response = await fetch('/assets/config.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load config.json: ${response.status} ${response.statusText}`);
    }
    const data = (await response.json()) as AppConfig;
    this.config = data;
  }

  get(): AppConfig {
    if (!this.config) {
      throw new Error('App config not loaded.');
    }
    return this.config;
  }
}
