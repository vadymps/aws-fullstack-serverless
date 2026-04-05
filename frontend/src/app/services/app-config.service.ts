import { Injectable } from '@angular/core';
import { AppConfig } from '../models/app-config.model';

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private config: AppConfig = {
    production: false,
    apiUrl: "/api",
    auth: {}
  };

  async load(): Promise<void> {
    try {
      const response = await fetch('/assets/config.json', { cache: 'no-store' });
      if (response.ok) {
        this.config = await response.json();
      } else {
        console.error("Failed to load config.");
      }
    } catch (error) {
      console.error("Failed to load config:", error);
    }
  }

  get(): AppConfig {
    return this.config;
  }
}
