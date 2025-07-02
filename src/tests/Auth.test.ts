import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Auth } from '../lib/auth/Auth';
import type { User } from '../lib/auth/User';
import Keycloak from 'keycloak-js';
import { Observable } from '$lib/observer/Observable';
import { keycloakMock } from '../../vitest.setup';

const mockSearchParams = new Map<string, string>();
const mockURL = {
  searchParams: {
    get: vi.fn((key: string) => mockSearchParams.get(key) || null),
  },
};
vi.stubGlobal('URL', vi.fn(() => mockURL));

describe('Auth', () => {
  const keycloakConfig = {
    url: 'http://auth-server/auth',
    realm: 'my-realm',
    clientId: 'my-client',
  };
  let auth: Auth;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockSearchParams.clear();
    keycloakMock.init.mockImplementation(() => Promise.resolve(true));
    keycloakMock.login.mockImplementation(() => {});
    keycloakMock.logout.mockImplementation(() => {});
    keycloakMock.updateToken.mockImplementation(() => Promise.resolve(true));
    keycloakMock.onTokenExpired = undefined;
    keycloakMock.token = 'mocked-token';
    keycloakMock.refreshToken = 'mocked-refresh-token';
    keycloakMock.tokenParsed = {
      sub: 'user-id',
      preferred_username: 'testuser',
      given_name: 'Test',
      family_name: 'User',
      realm_access: { roles: ['user', 'admin'] },
      exp: 1234567890,
    };
    auth = new Auth(keycloakConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize correctly with Keycloak config', () => {
    expect(auth).toBeInstanceOf(Auth);
    expect(Keycloak).toHaveBeenCalledWith(keycloakConfig);
  });

  it('inBrowserInit should initialize with stored token', async () => {
    localStorage.setItem('access_token', 'stored-token');
    localStorage.setItem('refresh_token', 'stored-refresh-token');

    const initSpy = vi.spyOn(keycloakMock, 'init');
    const observerSpy = vi.fn();
    auth.getUser().subscribe(observerSpy);

    await auth.inBrowserInit();

    expect(initSpy).toHaveBeenCalledWith({
      token: 'stored-token',
      refreshToken: 'stored-refresh-token',
    });

    await vi.waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('access_token', 'mocked-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('refresh_token', 'mocked-refresh-token');
      expect(observerSpy).toHaveBeenCalledWith({
        userId: 'user-id',
        username: 'testuser',
        firstname: 'Test',
        lastname: 'User',
        roles: ['user', 'admin'],
      });
    });
  });

  it('inBrowserInit should emit null if no token is stored', () => {
    const observerSpy = vi.fn();
    auth.getUser().subscribe(observerSpy);

    auth.inBrowserInit();

    expect(observerSpy).toHaveBeenCalledWith(null);
  });

  it('login should call Keycloak login with correct options', async () => {
    const initSpy = vi.spyOn(keycloakMock, 'init');
    const loginSpy = vi.spyOn(keycloakMock, 'login');

    const redirectUri = 'http://localhost:5173/callback';
    await auth.login({ redirectUri });

    expect(initSpy).toHaveBeenCalledWith({ onLoad: 'login-required' });
    expect(loginSpy).toHaveBeenCalledWith({ redirectUri });
  });

  it('logout should clear localStorage and call Keycloak logout', () => {
    const logoutSpy = vi.spyOn(keycloakMock, 'logout');
    const observerSpy = vi.fn();
    auth.getUser().subscribe(observerSpy);

    auth.logout();

    expect(localStorage.removeItem).toHaveBeenCalledWith('access_token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('refresh_token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('exp');
    expect(logoutSpy).toHaveBeenCalledWith({ redirectUri: 'http://localhost:5173' });
    expect(observerSpy).toHaveBeenCalledWith(null);
  });

  it('checkParams should handle successful authentication', async () => {
    mockSearchParams.set('state', 'state-123');
    mockSearchParams.set('session_state', 'session-123');
    mockSearchParams.set('code', 'code-123');

    const initSpy = vi.spyOn(keycloakMock, 'init');
    const observerSpy = vi.fn();
    auth.getUser().subscribe(observerSpy);

    await auth.checkParams();

    expect(initSpy).toHaveBeenCalledWith({
      onLoad: 'check-sso',
      redirectUri: 'http://localhost:5173',
    });

    await vi.waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('access_token', 'mocked-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('refresh_token', 'mocked-refresh-token');
      expect(observerSpy).toHaveBeenCalledWith({
        userId: 'user-id',
        username: 'testuser',
        firstname: 'Test',
        lastname: 'User',
        roles: ['user', 'admin'],
      });
    });
  });

  it('checkParams should redirect to login if no parameters are present', async () => {
    const loginSpy = vi.spyOn(auth, 'login');

    await auth.checkParams();

    expect(loginSpy).toHaveBeenCalledWith({ redirectUri: 'http://localhost:5173' });
  });

  it('getUser should return an Observable', () => {
    const userObservable = auth.getUser();
    expect(userObservable).toBeInstanceOf(Observable);
  });

  it('should handle token expiration and refresh', async () => {
    localStorage.setItem('access_token', 'stored-token');
    localStorage.setItem('refresh_token', 'stored-refresh-token');

    const initSpy = vi.spyOn(keycloakMock, 'init');
    const updateTokenSpy = vi.spyOn(keycloakMock, 'updateToken');
    const observerSpy = vi.fn();
    auth.getUser().subscribe(observerSpy);

    await auth.inBrowserInit();

    await vi.waitFor(() => {
      expect(observerSpy).toHaveBeenCalledWith({
        userId: 'user-id',
        username: 'testuser',
        firstname: 'Test',
        lastname: 'User',
        roles: ['user', 'admin'],
      });
    });

    keycloakMock.onTokenExpired = () => {
      keycloakMock.updateToken(5).then(() => {
        observerSpy({
          userId: 'user-id',
          username: 'testuser',
          firstname: 'Test',
          lastname: 'User',
          roles: ['user', 'admin'],
        });
      });
    };
    keycloakMock.onTokenExpired();

    expect(updateTokenSpy).toHaveBeenCalledWith(5);

    await vi.waitFor(() => {
      expect(observerSpy).toHaveBeenCalledTimes(2);
      expect(observerSpy).toHaveBeenCalledWith({
        userId: 'user-id',
        username: 'testuser',
        firstname: 'Test',
        lastname: 'User',
        roles: ['user', 'admin'],
      });
    });
  });
});