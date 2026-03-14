import { Injectable, signal } from '@angular/core';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';
import { AppConfigService } from './app-config.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  isAuthenticated = signal(false);
  private initPromise: Promise<void> | null = null;

  constructor(
    private readonly oauthService: OAuthService,
    private readonly appConfig: AppConfigService
  ) {
    const config = this.appConfig.get();
    const authConfig: AuthConfig = {
      issuer: config.auth.issuer,
      clientId: config.auth.clientId,
      redirectUri: config.auth.redirectUri,
      postLogoutRedirectUri: config.auth.postLogoutRedirectUri,
      responseType: 'code',
      scope: config.auth.scope,
      showDebugInformation: !config.production,
      strictDiscoveryDocumentValidation: false
    };
    
    this.oauthService.configure(authConfig);
    this.oauthService.setupAutomaticSilentRefresh();
  }

  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        console.log('Attempting to load the discovery document...');
        await this.oauthService.loadDiscoveryDocumentAndTryLogin();
        this.isAuthenticated.set(this.oauthService.hasValidAccessToken());
      } catch (err) {
        console.error('CRITICAL ERROR: Cognito is not responding or the URL is incorrect!', err);
      }
    })();

    return this.initPromise;
  }

  login(): void {
    this.oauthService.initCodeFlow();
  }

  logout(): void {
    this.oauthService.logOut();
    this.isAuthenticated.set(false);
  }

  getAccessToken(): string {
    return this.oauthService.getAccessToken();
  }

  getUserDisplayName(): string {
    const claims = this.oauthService.getIdentityClaims() as Record<string, unknown> | null;
    if (!claims) {
      return 'Guest';
    }

    const raw =
      claims['name'] ??
      claims['preferred_username'] ??
      claims['email'] ??
      claims['cognito:username'];

    if (typeof raw === 'string' && raw.trim().length > 0) {
      return raw.trim();
    }

    return 'User';
  }
}
