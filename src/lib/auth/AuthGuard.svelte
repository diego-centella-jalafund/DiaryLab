<script lang="ts">
    import { onMount } from 'svelte';
    import { Registry } from './Registry';
    import type { User } from './User';

    let forceLogin = false;
    let manual = false;
    let user: User | null = null;
    export { forceLogin, manual };

    onMount(() => {
        console.log('AuthGuard mounted, checking params...');
        Registry.auth.checkParams();
        Registry.auth.getUser().subscribe((data: User) => {
            user = data;
            console.log('AuthGuard user updated:', user);
            if (!user && forceLogin) {
                console.log('AuthGuard: Forcing login...');
                Registry.auth.login({ redirectUri: location.href });
            }
        });
    });
</script>

{#if user && manual}
    <slot name="authed" {user} />
{:else if !user && manual}
    <slot name="not_authed" />
{:else if user && !manual}
    <slot />
{:else}
    <p>Loading...</p>
{/if}