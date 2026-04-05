import { AuthService } from './auth.service';

describe('AuthService', () => {
  const createService = (claims: Record<string, unknown> | null) => {
    const oauthService = {
      getIdentityClaims: () => claims
    } as unknown as {
      getIdentityClaims: () => Record<string, unknown> | null;
    };

    const appConfig = {} as unknown as { get: () => unknown };

    return new AuthService(oauthService as any, appConfig as any);
  };

  it('returns initials from given and family name claims', () => {
    const service = createService({ given_name: 'Ada', family_name: 'Lovelace' });
    expect(service.getUserInitials()).toBe('AL');
  });

  it('falls back to email when name claims are empty', () => {
    const service = createService({
      given_name: '',
      family_name: '',
      email: 'jane@example.com'
    });
    expect(service.getUserInitials()).toBe('JA');
  });

  it('returns ?? when no claims are available', () => {
    const service = createService(null);
    expect(service.getUserInitials()).toBe('??');
  });
});
