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

  public constructor(options: KeycloakConfig) {
    this.#observable = new Observable<User>();
    this.#options = options;
    this.#user = null;
    if (typeof window !== 'undefined') {
      this.#keycloak = new Keycloak(this.#options);
    }
  }

  public async inBrowserInit(): Promise<void> {
    if (typeof window === 'undefined') return;

    this.#user = null;
    const storedToken = localStorage.getItem('access_token');
    const storedRefreshToken = localStorage.getItem('refresh_token');
    if (storedToken) {
      await this.init({
        token: storedToken,
        refreshToken: storedRefreshToken || undefined,
      });
    } else {
      this.#observable.next(null);
    }
  }

  private async init(params?: any): Promise<void> {
    if (typeof window === 'undefined' || this.#isInitialized) return;

    this.#initInProgress = true;
    try {
      const authenticated = await this.#keycloak.init(params);
      this.#isInitialized = true;
      if (authenticated && this.#keycloak.tokenParsed) {
        localStorage.setItem('access_token', this.#keycloak.token || '');
        localStorage.setItem('refresh_token', this.#keycloak.refreshToken || '');
        this.buildUser();
        this.#observable.next(this.#user!);
        this.#keycloak.onTokenExpired = () => {
          this.#keycloak
            .updateToken(5)
            .then((refreshed) => {
              if (refreshed) {
                localStorage.setItem('access_token', this.#keycloak.token || '');
                localStorage.setItem('refresh_token', this.#keycloak.refreshToken || '');
                this.buildUser();
                this.#observable.next(this.#user!);
              }
            })
            .catch((error) => console.error('Token refresh failed:', error));
        };
      } else {
        this.#user = null;
        this.#observable.next(null);
      }
    } catch (error) {
      this.#user = null;
      this.#observable.next(null);
      console.error('Keycloak init failed:', error);
    } finally {
      this.#initInProgress = false;
    }
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
    };
  }

  public getUser(): Observable<User> {
    return this.#observable;
  }

  public async login(options: { redirectUri: string }): Promise<void> {
    if (typeof window === 'undefined' || this.#initInProgress || this.#isInitialized) return;

    try {
      await this.#keycloak.init({ onLoad: 'login-required' });
      this.#keycloak.login(options);
    } catch (error) {
      console.error('Login failed:', error);
    }
  }

  public logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('exp'); 
    this.#keycloak.logout({ redirectUri: 'http://localhost:5173' });
    this.#user = null;
    this.#observable.next(null);
  }

  public async checkParams(): Promise<void> {
    if (typeof window === 'undefined') return;

    const params = new URL(window.location.href.replace('#', '?')).searchParams;
    if (params.get('state') && params.get('session_state') && params.get('code')) {
      try {
        const authenticated = await this.#keycloak.init({
          onLoad: 'check-sso',
          redirectUri: window.location.href.split('#')[0],
        });
        if (authenticated && this.#keycloak.tokenParsed) {
          localStorage.setItem('access_token', this.#keycloak.token || '');
          localStorage.setItem('refresh_token', this.#keycloak.refreshToken || '');
          this.buildUser();
          this.#observable.next(this.#user!);
        } else {
          this.#user = null;
          this.#observable.next(null);
          this.login({ redirectUri: window.location.href });
        }
      } catch (error) {
        this.login({ redirectUri: window.location.href });
      }
    } else if (!this.#user) {
      this.login({ redirectUri: window.location.href });
    }
  }

  public getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }
}