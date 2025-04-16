import { PUBLIC_OIDC_CLIENT_ID, PUBLIC_OIDC_REALM, PUBLIC_OIDC_URL } from '$env/static/public';
import { Auth } from './Auth';

export class Registry {
    public static auth: Auth = new Auth({
        url: PUBLIC_OIDC_URL,
        realm: PUBLIC_OIDC_REALM,
        clientId: PUBLIC_OIDC_CLIENT_ID
    });
}