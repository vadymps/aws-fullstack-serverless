import { Injectable, signal } from '@angular/core';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';
import { AppConfigService } from './app-config.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  isAuthenticated = signal(false);
  private initPromise: Promise<void> | null = null;
  private configured = false;
  private authConfig: AuthConfig | null = null;

  constructor(
    private readonly oauthService: OAuthService,
    private readonly appConfig: AppConfigService
  ) {
  }

  async init(): Promise<void> {
    if (this.initPromise) {
      // Even if we have a cached promise, re-check authentication state
      await this.initPromise;
      this.isAuthenticated.set(this.oauthService.hasValidAccessToken());
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        if (!this.configured) {
          const config = this.appConfig.get();
          const authConfig: AuthConfig = {
            issuer: config.auth.issuer,
            clientId: config.auth.clientId,
            redirectUri: config.auth.redirectUri,
            postLogoutRedirectUri: config.auth.postLogoutRedirectUri,
            responseType: 'code',
            scope: config.auth.scope,
            showDebugInformation: !config.production,
            strictDiscoveryDocumentValidation: false,
            requireHttps: config.auth.requireHttps,
          };

          this.oauthService.configure(authConfig);
          this.oauthService.setupAutomaticSilentRefresh();
          this.configured = true;
          this.authConfig = authConfig;
        }

        console.log('Attempting to load the discovery document...');
        await this.oauthService.loadDiscoveryDocumentAndTryLogin();
        this.isAuthenticated.set(this.oauthService.hasValidAccessToken());
      } catch (err) {
        console.error('CRITICAL ERROR: ', err);
        // Even if there's an error loading discovery document, set authenticated to false
        this.isAuthenticated.set(false);
      }
    })();

    return this.initPromise;
  }

  async login(): Promise<void> {
    await this.init();
    this.oauthService.initCodeFlow();
  }

  async logout(): Promise<void> {
    await this.init();
    const clientId = this.authConfig?.clientId;
    const logoutUri = this.authConfig?.postLogoutRedirectUri;

    if (clientId && logoutUri) {
      this.oauthService.logOut({ client_id: clientId, logout_uri: logoutUri });
    } else {
      this.oauthService.logOut();
    }

    this.isAuthenticated.set(false);
  }

  getAccessToken(): string {
    return this.oauthService.getAccessToken();
  }

  getIdTokenClaims(): Record<string, unknown> | null {
    return this.oauthService.getIdentityClaims() as Record<string, unknown> | null;
  }

  getUserDisplayName(): string {
    const claims = this.oauthService.getIdentityClaims() as Record<string, unknown> | null;
    if (!claims) {
      return 'Guest';
    }

    const name = `${claims['given_name']} ${claims['family_name']}`.trim();
    const email = `${claims['email']}`.trim();

    return name || email || 'User';
  }

  getUserEmail(): string {
    const claims = this.oauthService.getIdentityClaims() as Record<string, unknown> | null;
    if (!claims) {
      return '';
    }

    const raw = claims['email'];
    return typeof raw === 'string' ? raw : '';
  }

  getUserInitials(): string {
    const name = this.getUserDisplayName();
    const email = this.getUserEmail();
    const base = name !== 'Guest' && name !== 'User' ? name : email;
    const cleaned = base.trim();

    if (!cleaned) {
      return '??';
    }

    const parts = cleaned.split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
}
