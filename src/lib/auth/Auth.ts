import { Observable } from '$lib/observer/Observable';
import type { User } from 'src/lib/auth/User';
import Keycloak, { type KeycloakConfig } from 'keycloak-js';

export class Auth {
    #keycloak!: Keycloak;
    #observable: Observable<User>;
    #user: User | null;
    #initInProgress = false;
    #options: KeycloakConfig;

    public constructor(options: KeycloakConfig) {
        this.#observable = new Observable<User>();
        this.#options = options;
        this.#user = null;
        this.#keycloak = new Keycloak(this.#options);
        console.log('Keycloak initialized in constructor with options:', this.#options);
    }

    public inBrowserInit() {
        this.#user = null;
        if (localStorage.getItem('access_token') !== null) {
            console.log('Found existing token, attempting refresh');
            this.init(this.buildInitParams());
        } else {
            console.log('No existing token found');
            this.#observable.next(null);
        }
    }

    private init(params?: any) {
        this.#initInProgress = true;
        console.log('Initializing Keycloak with params:', params);
        this.#keycloak.init(params).then((authenticated) => {
            console.log('Keycloak init success, authenticated:', authenticated);
            if (this.storeCredentialsAndBuildUser(authenticated)) {
                console.log('User built and stored, emitting to observable...');
                this.#observable.next(this.#user!);
                this.#keycloak.onTokenExpired = () => {
                    this.#keycloak.updateToken(5).then((refreshed) => {
                        this.storeCredentialsAndBuildUser(refreshed);
                        this.#observable.next(this.#user!);
                    }).catch((error) => {
                        console.error('Token refresh failed:', error);
                    });
                };
            } else {
                console.log('Not authenticated, clearing user state');
                this.#user = null;
                this.#observable.next(null);
            }
            this.#initInProgress = false;
        }).catch((error) => {
            console.error('Keycloak init failed:', error);
            this.#user = null;
            this.#observable.next(null);
            this.#initInProgress = false;
        });
    }

    private storeCredentialsAndBuildUser(authenticated: boolean): boolean {
        if (
            authenticated &&
            this.#keycloak.token &&
            this.#keycloak.refreshToken &&
            this.#keycloak.tokenParsed?.exp
        ) {
            console.log('Storing credentials and building user...');
            localStorage.setItem('access_token', this.#keycloak.token);
            localStorage.setItem('refresh_token', this.#keycloak.refreshToken);
            localStorage.setItem('exp', String(this.#keycloak.tokenParsed.exp));
            this.buildUser();
            return true;
        }
        console.log('Not authenticated or missing token data');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('exp');
        return false;
    }

    private buildUser() {
        const parsed = this.#keycloak.tokenParsed;
        if (!parsed) {
            throw new Error('Token parsed is not defined');
        }
        this.#user = {
            userId: parsed['sub'],
            username: parsed['preferred_username'],
            firstname: parsed['given_name'],
            lastname: parsed['family_name'],
            roles: parsed['realm_access']?.['roles'] || []
        };
        console.log('User built:', this.#user);
    }

    private buildInitParams() {
        return {
            token: localStorage.getItem('access_token'),
            refreshToken: localStorage.getItem('refresh_token')
        };
    }

    public getUser(): Observable<User> {
        return this.#observable;
    }

    public login(options: { redirectUri: string }) {
        if (this.#initInProgress) {
            console.log('Login skipped: initialization in progress');
            return;
        }
        console.log('Initiating Keycloak login with options:', options);
        this.#keycloak.init({ onLoad: 'login-required' }).then(() => {
            console.log('Keycloak initialized for login');
            this.#keycloak.login(options);
        }).catch((error) => {
            console.error('Keycloak init failed during login:', error);
        });
    }

    public logout() {
        console.log('Logging out...');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('exp');
        this.#keycloak.logout({ redirectUri: 'http://localhost:5173' });
        this.#user = null;
        this.#observable.next(null);
    }

    public checkParams() {
        const params = new URL(document.location.href.replace('#', '?')).searchParams;
        console.log('Checking params:', params.toString());
        if (params.get('state') && params.get('session_state') && params.get('code')) {
            console.log('Found Keycloak redirect params, initializing session...');
            this.#keycloak.init({
                onLoad: 'check-sso',
                redirectUri: window.location.href.split('#')[0]
            }).then((authenticated) => {
                console.log('Manual init after redirect, authenticated:', authenticated);
                if (this.storeCredentialsAndBuildUser(authenticated)) {
                    this.#observable.next(this.#user!);
                } else {
                    this.#user = null;
                    this.#observable.next(null);
                    this.login({ redirectUri: window.location.href });
                }
            }).catch((error) => {
                console.error('Manual init failed:', error);
                this.login({ redirectUri: window.location.href });
            });
        } else {
            console.log('No Keycloak redirect params found');
            if (!this.#user) {
                console.log('No user after checking params, forcing login...');
                this.login({ redirectUri: window.location.href });
            }
        }
    }
}