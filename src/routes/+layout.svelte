<script lang="ts">
    import { onMount } from 'svelte';
    import { Registry } from '$lib/auth/Registry';
    import type { User } from '$lib/auth/User';
    import { Auth } from '$lib/auth/Auth';

    let user: User | null = null;
    let isRegisterMenuOpen = false;
    onMount(async () => {
    Registry.auth.inBrowserInit();
        Registry.auth.checkParams();
        Registry.auth.getUser().subscribe((data: User) => {
            user = data;
            if (!user) {
                Registry.auth.login({ redirectUri: location.href });
            }
        });
  });

    function logout() {
        Registry.auth.logout();
        user = null;
    }

    function menuRegisterOption() {
        isRegisterMenuOpen = !isRegisterMenuOpen;
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
                <button class="menu-btn" on:click={menuRegisterOption}>
                    Registro <span class="arrow">▼</span>
                </button>
                {#if isRegisterMenuOpen}
                    <ul class="dropdown-menu">
                        <li><a href="/register/raw-milk" on:click={menuRegisterOption}>Leche Cruda</a></li>
                        <li><a href="/register/yogurt-probiotic-flavored" on:click={menuRegisterOption}>Yogurt probiotico</a></li>
                        <li><a href="/register/yogurt-no-sugar" on:click={menuRegisterOption}>Yogurt sin azucar</a></li>
                        <li><a href="/register/yogurt-fruity" on:click={menuRegisterOption}>Yogurt frutado</a></li>
                        <li><a href="/register/semi-ripe-cheese" on:click={menuRegisterOption}>Queso semimaduro</a></li>
                        <li><a href="/register/butter" on:click={menuRegisterOption}>Mantequilla</a></li>
                    </ul>
                {/if}
            </div>
            <a href="/import-file" class="nav-link-1">Importar Archivo</a>
            <a href="/evaluation" class="nav-link-2">Evaluacion</a>
            <a href="/report-samples" class="nav-link-3">Reporte de Muestras</a>
            <a href="/reports-prediction" class="nav-link-4">Reporte de prediccion</a>
        </div>
        <button class="logout-btn" on:click={logout}>Cerrar Sesion</button>
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
    .nav-link-1 {
        color: #dbd6d6; 
        font-size: 1rem;
        font-weight: 500;
        text-transform: uppercase;
        text-decoration: none;
    }
    .nav-link-2 {
        color: #dbd6d6; 
        font-size: 1rem;
        font-weight: 500;
        text-transform: uppercase;
        text-decoration: none; 
    }
    .nav-link-3 {
        font-size: 1rem;
        font-weight: 500;
        text-transform: uppercase;
        text-decoration: none;
        color: #cccccc; 
    }
    .nav-link-4 {
        color: #dbd6d6; 
        font-size: 1rem;
        font-weight: 500;
        text-transform: uppercase;
        text-decoration: none;
    }
    .nav-link-1:hover {
        color: #463e3e;
    }
    .nav-link-2:hover {
        color: #5a4e4e;
    }
    .nav-link-4:hover {
        color: #5c5050;
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
        color: #554646;
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