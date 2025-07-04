import { Observable } from '$lib/observer/Observable';
import type { User } from 'src/lib/auth/User';
import Keycloak, { type KeycloakConfig } from 'keycloak-js';

export class Auth {
  #keycloak!: Keycloak;
  #observable: Observable<User>;
  #user: User | null;
  #initInProgress = false;
  #options: KeycloakConfig;
  #isInitialized = false;
  #initPromise: Promise<void> | null = null;

  public constructor(options: KeycloakConfig) {
    this.#observable = new Observable<User>();
    this.#options = options;
    this.#user = null;
    if (typeof window !== 'undefined') {
      this.#keycloak = new Keycloak({
        ...this.#options,
        responseMode: 'query', 
      });
    }
  }

  public async inBrowserInit(): Promise<void> {
    if (typeof window === 'undefined') return;

    this.#user = null;
    const storedToken = localStorage.getItem('access_token');
    const storedRefreshToken = localStorage.getItem('refresh_token');
    console.log('Stored tokens on init:', { storedToken, storedRefreshToken });
    if (storedToken && storedRefreshToken) {
      await this.init({
        token: storedToken,
        refreshToken: storedRefreshToken,
        responseMode: 'query', 
      });
    } else {
      this.#observable.next(null);
      await this.login({ redirectUri: window.location.href });
    }
  }

  private async init(params?: any): Promise<void> {
    if (typeof window === 'undefined') return;

    if (this.#initInProgress) {
      console.log('Initialization already in progress, waiting...');
      if (this.#initPromise) {
        await this.#initPromise;
      }
      return;
    }

    if (this.#isInitialized) {
      console.log('Keycloak already initialized, skipping init');
      return;
    }

    this.#initInProgress = true;
    this.#initPromise = (async () => {
      try {
        const authenticated = await this.#keycloak.init({
          ...params,
          onLoad: 'login-required',
          responseMode: 'query', 
        });
        this.#isInitialized = true;
        if (authenticated && this.#keycloak.tokenParsed) {
          localStorage.setItem('access_token', this.#keycloak.token || '');
          localStorage.setItem('refresh_token', this.#keycloak.refreshToken || '');
          this.buildUser();
          this.#observable.next(this.#user!);
          console.log('Initialized with token:', this.#keycloak.tokenParsed);
          console.log('Refresh token after init:', this.#keycloak.refreshToken);
          this.#keycloak.onTokenExpired = () => {
            this.refreshToken().catch((error) => {
              console.error('Token refresh failed in onTokenExpired:', error);
              this.logout();
            });
          };
        } else {
          this.#user = null;
          this.#observable.next(null);
          await this.login({ redirectUri: window.location.href });
        }
      } catch (error) {
        this.#user = null;
        this.#observable.next(null);
        console.error('Keycloak init failed:', error.message || error);
        await this.login({ redirectUri: window.location.href });
      } finally {
        this.#initInProgress = false;
        this.#initPromise = null;
      }
    })();

    await this.#initPromise;
  }

  private buildUser(): void {
    if (typeof window === 'undefined') return;

    const parsed = this.#keycloak.tokenParsed;
    if (!parsed) throw new Error('Token parsed is not defined');
    this.#user = {
      userId: parsed['sub'],
      username: parsed['preferred_username'],
      firstname: parsed['given_name'],
      lastname: parsed['family_name'],
      roles: parsed['realm_access']?.['roles'] || [],
    };
  }

  private buildInitParams(): any {
    if (typeof window === 'undefined') return {};
    return {
      token: localStorage.getItem('access_token'),
      refreshToken: localStorage.getItem('refresh_token'),
      responseMode: 'query', 
    };
  }

  public getUser(): Observable<User> {
    return this.#observable;
  }

  async refreshToken(): Promise<boolean> {
    if (!this.#keycloak) throw new Error('Keycloak not initialized');
    if (!this.#isInitialized) {
      console.error('Keycloak not initialized, cannot refresh token');
      return false;
    }
    const storedRefreshToken = localStorage.getItem('refresh_token');
    if (!storedRefreshToken) {
      console.error('No refresh token available in localStorage');
      return false;
    }
    if (!this.#keycloak.refreshToken) {
      console.error('Keycloak refresh token not set, using stored refresh token');
      this.#keycloak.refreshToken = storedRefreshToken;
    }
    console.log('Attempting to refresh token, current refresh token:', storedRefreshToken);
    console.log('Access token expiration:', this.#keycloak.tokenParsed?.exp);
    console.log('Current time:', Math.floor(Date.now() / 1000));
    try {
      const refreshed = await this.#keycloak.updateToken(60);
      if (refreshed) {
        localStorage.setItem('access_token', this.#keycloak.token || '');
        localStorage.setItem('refresh_token', this.#keycloak.refreshToken || '');
        this.buildUser();
        this.#observable.next(this.#user!);
        console.log('Token refreshed successfully');
        console.log('New access token:', this.#keycloak.token);
        console.log('New refresh token:', this.#keycloak.refreshToken);
        console.log('New token expiration:', this.#keycloak.tokenParsed?.exp);
      } else {
        console.warn('Token refresh did not update the token');
        console.log('Current token expiration:', this.#keycloak.tokenParsed?.exp);
        console.log('Current time:', Math.floor(Date.now() / 1000));
        console.log('Keycloak token state:', {
          token: this.#keycloak.token,
          refreshToken: this.#keycloak.refreshToken,
        });
      }
      return refreshed;
    } catch (error) {
      console.error('Failed to refresh token:', error.message || error);
      console.log('Keycloak refresh token state:', this.#keycloak.refreshToken);
      return false;
    }
  }

  public async login(options: { redirectUri: string }): Promise<void> {
    if (typeof window === 'undefined' || this.#initInProgress) return;

    try {
      if (!this.#isInitialized) {
        console.log('Initializing Keycloak for login');
        await this.init({ onLoad: 'login-required', redirectUri: options.redirectUri, responseMode: 'query' });
      }
      console.log('Redirecting to Keycloak login with redirectUri:', options.redirectUri);
      await this.#keycloak.login({ ...options, responseMode: 'query' });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  public logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('exp');
    this.#keycloak.logout({ redirectUri: 'https://diary-lab-diego-centella-jalafunds-projects.vercel.app' }); 
    this.#user = null;
    this.#observable.next(null);
  }

  public async checkParams(): Promise<void> {
    if (typeof window === 'undefined') return;

    const params = new URL(window.location.href.replace('#', '?')).searchParams;
    if (params.get('state') && params.get('session_state') && params.get('code')) {
      try {
        if (!this.#isInitialized) {
          await this.init({
            onLoad: 'check-sso',
            redirectUri: window.location.href.split('#')[0],
            responseMode: 'query', 
          });
        }
      } catch (error) {
        console.error('Check params failed:', error);
        await this.login({ redirectUri: window.location.href });
      }
    } else if (!this.#user) {
      await this.login({ redirectUri: window.location.href });
    }
  }

  public getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }
}