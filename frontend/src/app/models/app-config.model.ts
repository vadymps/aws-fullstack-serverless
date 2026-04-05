export interface AuthConfig {
  issuer?: string;
  clientId?: string;
  redirectUri?: string;
  postLogoutRedirectUri?: string;
  scope?: string;
  requireHttps?: boolean;
}

export interface AppConfig {
  production: boolean;
  apiUrl: string;
  auth: AuthConfig;
}
