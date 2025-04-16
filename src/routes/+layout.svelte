<script lang="ts">
    import { onMount } from 'svelte';
    import { Registry } from '$lib/auth/Registry';
    import type { User } from '$lib/auth/User';

    let user: User | null = null;
    let isRegistroMenuOpen = false;

    onMount(() => {
        console.log('Layout mounted, initializing Keycloak...');
        Registry.auth.inBrowserInit();
        Registry.auth.checkParams();
        Registry.auth.getUser().subscribe((data: User) => {
            user = data;
            console.log('User in layout:', user);
            if (!user) {
                console.log('No user, forcing Keycloak login...');
                Registry.auth.login({ redirectUri: location.href });
            }
        });
    });

    function logout() {
        console.log('Logging out...');
        Registry.auth.logout();
        user = null;
    }

    function toggleRegistroMenu() {
        isRegistroMenuOpen = !isRegistroMenuOpen;
        console.log('Registro menu toggled:', isRegistroMenuOpen);
    }
</script>

<nav class="navbar">
    <div class="nav-container">
        <div class="logo">
            <a href="/" class="logo-link">
                <h1>DiaryLab</h1>
            </a>
        </div>
        <div class="nav-links">
            <div class="dropdown">
                <button class="menu-btn" on:click={toggleRegistroMenu}>
                    Registro <span class="arrow">▼</span>
                </button>
                {#if isRegistroMenuOpen}
                    <ul class="dropdown-menu">
                        <li><a href="/register/raw-milk" on:click={toggleRegistroMenu}>Leche Cruda</a></li>
                        <li><a href="/register/yogurt-probiotico" on:click={toggleRegistroMenu}>Yogurt Probiótico</a></li>
                        <li><a href="/register/yogurt-saborizado" on:click={toggleRegistroMenu}>Yogurt Saborizado</a></li>
                        <li><a href="/register/yogurt-sin-azucar" on:click={toggleRegistroMenu}>Yogurt Sin Azúcar</a></li>
                        <li><a href="/register/yogurt-frutado" on:click={toggleRegistroMenu}>Yogurt Frutado</a></li>
                        <li><a href="/register/queso-semimaduro" on:click={toggleRegistroMenu}>Queso Semimaduro</a></li>
                        <li><a href="/register/mantequilla" on:click={toggleRegistroMenu}>Mantequilla</a></li>
                    </ul>
                {/if}
            </div>
            <a href="/evaluation" class="nav-link">Evaluación</a>
            <a href="/reports-samples" class="nav-link">Reportes Muestras</a>
            <a href="/reports-prediction" class="nav-link">Reportes Predicción</a>
        </div>
        <button class="logout-btn" on:click={logout}>Cerrar sesión</button>
    </div>
</nav>

<main>
    <slot />
</main>

<style>
    .navbar {
        background-color: #2a2e35; 
        color: white;
        padding: 1rem 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    }
    .nav-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
    }
    .logo-link {
        text-decoration: none !important; 
        color: inherit; 
    }
    .logo-link:hover {
        text-decoration: none !important; 
    }
    .logo h1 {
        font-size: 1.5rem;
        font-weight: bold;
        margin: 0;
        color: #ffffff;
    }
    .cloud-icon {
        font-size: 1.5rem;
    }
    .nav-links {
        display: flex;
        gap: 2rem;
        align-items: center;
    }
    .nav-link {
        color: #cccccc;
        font-size: 1rem;
        font-weight: 500;
        text-transform: uppercase;
        text-decoration: none;
    }
    .nav-link:hover {
        color: #ffffff;
    }
    .dropdown {
        position: relative;
    }
    .menu-btn {
        background: none;
        border: none;
        color: #cccccc;
        font-size: 1rem;
        font-weight: 500;
        text-transform: uppercase;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.3rem;
    }
    .menu-btn:hover {
        color: #ffffff;
    }
    .arrow {
        font-size: 0.8rem;
    }
    .dropdown-menu {
        position: absolute;
        top: 100%;
        left: 0;
        background-color: #3a3f47;
        list-style: none;
        margin: 0;
        padding: 0;
        border-radius: 4px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        z-index: 1000;
    }
    .dropdown-menu li {
        padding: 0;
    }
    .dropdown-menu a {
        display: block;
        padding: 0.5rem 1rem;
        color: #cccccc;
        text-decoration: none;
        font-size: 0.9rem;
        text-transform: uppercase;
    }
    .dropdown-menu a:hover {
        background-color: #4a5059;
        color: #ffffff;
    }
    .logout-btn {
        background-color: #007bff;
        border: none;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        font-size: 1rem;
        font-weight: 500;
        text-transform: uppercase;
        cursor: pointer;
        transition: background-color 0.3s;
    }
    .logout-btn:hover {
        background-color: #0056b3;
    }
    main {
        padding: 2rem;
    }
</style>