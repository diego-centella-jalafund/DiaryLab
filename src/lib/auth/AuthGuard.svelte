<script lang="ts">
    import { onMount } from 'svelte';
    import { Registry } from './Registry';
    import type { User } from './User';

    let forceLogin = false;
    let manual = false;
    let user: User | null = null;
    export { forceLogin, manual };

    onMount(() => {
        Registry.auth.checkParams();
        Registry.auth.getUser().subscribe((data: User) => {
            user = data;
            if (!user && forceLogin) {
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