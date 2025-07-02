import { vi } from 'vitest';
import Keycloak from 'keycloak-js';

export const keycloakMock = {
  init: vi.fn(() => Promise.resolve(true)),
  login: vi.fn(),
  logout: vi.fn(),
  updateToken: vi.fn(() => Promise.resolve(true)), 
  token: 'mocked-token',
  refreshToken: 'mocked-refresh-token',
  tokenParsed: {
    sub: 'user-id',
    preferred_username: 'testuser',
    given_name: 'Test',
    family_name: 'User',
    realm_access: { roles: ['user', 'admin'] },
    exp: 1234567890,
  },
  onTokenExpired: undefined,
};

vi.mock('keycloak-js', () => {
  const KeycloakConstructor = vi.fn(() => keycloakMock);
  return { default: KeycloakConstructor };
});

const localStorageMock = (function () {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

Object.defineProperty(window, 'location', {
  value: { href: 'http://localhost:5173', replace: vi.fn(), searchParams: new URLSearchParams() },
  writable: true,
});

const mockSearchParams = new Map<string, string>();
const mockURL = {
  searchParams: {
    get: vi.fn((key: string) => mockSearchParams.get(key) || null),
  },
};
vi.stubGlobal('URL', vi.fn(() => mockURL));