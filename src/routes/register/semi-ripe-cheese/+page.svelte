<script lang="ts">
    import { onMount } from 'svelte';
    import { Auth } from '$lib/auth/Auth';
    import AuthGuard from '$lib/auth/AuthGuard.svelte';
    import type { User } from '$lib/auth/User';
    import { Registry } from '$lib/auth/Registry';
    import { writable } from 'svelte/store';
    import { goto } from '$app/navigation';

    export let data: { id: string };

    let user: User | null = null;

    let startDate: string = '2025-01-01';
    let endDate: string = '2025-06-29'; 
    let reports: any[] = [];
    let error: string | null = null;
    let loading: boolean = false;

    let date = '2025-01-01';
    let analysisDate = '2025-01-01';
    let sampleNumber = 500;
    let productionLot = 501;
    let productionDate = '2025-02-02';
    let expirationDate = '2025-03-03';
    let temperature = 15;
    let coldChamber = 3;
    let netContent = 250;
    let fatContent = 26;
    let phAcidity = 4.79; 
    let phTemperature = 17; 
    let color = 'blanquecino';
    let taste = 'check';
    let appearance = 'check';
    let samplingTime = '';
    let responsibleAnalyst = 'Diego c';
    let odor = 'cjecl';
    let bacteriologicalQuality = '1,8x10^4';
    let totalMesophilicCount = '2,0x10^4';
    let totalColiformCount = '1,3x10^1';
    let fecalColiformCount = '1,0x10^1';
    let sporeFormingBacteria = 'ausencia';
    let escherichiaColi = false;
    let salmonellaDetection = false;

    onMount(async () => {
        Registry.auth.checkParams();
        Registry.auth.getUser().subscribe((data: User) => {
            user = data;
            if (user) {
                console.log('Authenticated user:', user.userId);
            } else {
                console.log('No user authenticated, initiating login...');
                Registry.auth.login({ redirectUri: window.location.href }).catch((error) => {
                    console.error('Login initiation failed:', error);
                });
            }
        });
    });

    async function saveForm(retryCount = 0) {
        let token = Registry.auth.getToken();
        if (!token) {
            console.warn('No token found in localStorage, redirecting to login...');
            alert('No authentication token available. Redirecting to login...');
            await Registry.auth.login({ redirectUri: window.location.href });
            return;
        }

        console.log('Token before refresh:', token);

        try {
            const refreshed = await Registry.auth.refreshToken();
            if (!refreshed) {
                console.warn('Token refresh failed, possibly due to expired refresh token');
                if (retryCount < 1) {
                    const refreshedAgain = await Registry.auth.refreshToken();
                    if (refreshedAgain) {
                        token = Registry.auth.getToken();
                        console.log('Token after second refresh:', token);
                    }
                }
            }
            token = Registry.auth.getToken();
            if (!token) {
                console.error('No token available after refresh attempt');
                throw new Error('Failed to obtain token after refresh');
            }
            console.log('Token after refresh:', token);
        } catch (error) {
            console.error('Error during token refresh:', error.message || error);
            alert('Authentication error: Redirecting to login...');
            await Registry.auth.login({ redirectUri: window.location.href });
            return;
        }
        try {
            const response = await fetch('/api/semi-cheese', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    date,
                    analysisDate,
                    samplingTime,
                    responsibleAnalyst,
                    sampleNumber,
                    productionLot,
                    productionDate,
                    expirationDate,
                    temperature,
                    coldChamber,
                    netContent,
                    fatContent,
                    phAcidity,
                    phTemperature,
                    color,
                    odor,
                    taste,
                    appearance,
                    bacteriologicalQuality,
                    totalMesophilicCount,
                    totalColiformCount,
                    fecalColiformCount,
                    sporeFormingBacteria,
                    escherichiaColi,
                    salmonellaDetection
                })
            });

            if (response.ok) {
                const result = await response.json();
                alert('Data uploaded successfully: ' + (result.id ? `ID ${result.id}` : ''));
            } else {
                const result = await response.json();
                console.error('API response:', result);
                if (response.status === 401 && result.reason === 'token_invalid' && retryCount < 1) {
                    const refreshed = await Registry.auth.refreshToken();
                    if (refreshed) {
                        return saveForm(retryCount + 1);
                    } else {
                        console.warn('Token refresh failed on retry');
                        alert('Session expired. Redirecting to login...');
                        await Registry.auth.login({ redirectUri: window.location.href });
                        return;
                    }
                }
                throw new Error(
                    `Failed to upload data: ${response.status} - ${result.message || result.error || response.statusText}`
                );
            }
        } catch (err) {
            console.error('Save error:', err);
            error = `Error saving analysis: ${err.message}`;
        }
    }

    async function fetchReports() {
        if (!user) return;

        loading = true;
        error = null;

        let token = Registry.auth.getToken();
        if (!token) {
            error = 'No authentication token available.';
            loading = false;
            return;
        }
        try {
            const response = await fetch(`/api/semi-cheese?startDate=${startDate}&endDate=${endDate}`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const result = await response.json();
                reports = result.reports || [];
            } else {
                const result = await response.json();
                error = result.error || 'Failed to fetch reports';
            }
        } catch (err) {
            error = `Error fetching reports: ${err.message}`;
        } finally {
            loading = false;
        }
    }

    function viewReport(reportId: string) {
        if (!reportId || isNaN(parseInt(reportId))) {
            error = 'Invalid report ID';
            return;
        }

        const token = Registry.auth.getToken();
        if (!token) {
            error = 'No authentication token available.';
            loading = false;
            return;
        }

        console.log('Navigating to report with ID:', reportId, 'Token:', token);
        goto(`/reports-form/report-semi-cheese/${reportId}`);
    }
</script>

<AuthGuard manual={true} forceLogin={true}>
    <div slot="authed" let:user>
        <section class="form-section">
            <h1>Informe de Queso Semimaduro</h1>
            <form on:submit|preventDefault={() => saveForm()}>
                <div class="date-section">
                    <div class="form-row">
                        <label>Fecha:</label>
                        <input type="date" bind:value={date} />
                    </div>
                    <div class="form-row">
                        <label>Fecha de análisis:</label>
                        <input type="date" bind:value={analysisDate} />
                    </div>
                </div>

                <div class="section">
                    <h2>Información general</h2>
                    <table class="info-general-table">
                        <thead>
                            <tr>
                                <th>N° de Muestra</th>
                                <th>Lote</th>
                                <th>Fecha de Elaboración</th>
                                <th>Fecha de Vencimiento</th>
                                <th>Temperatura de Producción (°C)</th>
                                <th>Cámara Fría (°C)</th>
                                <th>Contenido Neto (g)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><input type="text" bind:value={sampleNumber} /></td>
                                <td><input type="text" bind:value={productionLot} /></td>
                                <td><input type="date" bind:value={productionDate} /></td>
                                <td><input type="date" bind:value={expirationDate} /></td>
                                <td><input type="number" step="0.1" bind:value={temperature} /></td>
                                <td><input type="number" step="0.1" bind:value={coldChamber} /></td>
                                <td><input type="number" step="0.1" bind:value={netContent} /></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="section">
                    <h2>Análisis Físicoquímico</h2>
                    <table class="results-table">
                        <thead>
                            <tr>
                                <th>Parámetro</th>
                                <th>Unidad</th>
                                <th>Valor</th>
                                <th>Rango</th>
                                <th>Método de ensayo</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Materia Grasa</td>
                                <td>%</td>
                                <td><input type="number" step="0.1" bind:value={fatContent} /></td>
                                <td>min 25</td>
                                <td>Mét. Gerber</td>
                            </tr>
                            <tr>
                                <td>Acidez (pH)</td>
                                <td>pH Unidad</td>
                                <td><input type="number" step="0.01" bind:value={phAcidity} /></td>
                                <td>5.0 - 6.0</td>
                                <td>Potenciómetro</td>
                            </tr>
                            <tr>
                                <td>Temperatura (pH)</td>
                                <td>°C</td>
                                <td><input type="number" step="0.1" bind:value={phTemperature} /></td>
                                <td>2 - 8</td>
                                <td>Termómetro</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="section">
                    <h2>Análisis Organoléptico</h2>
                    <table class="results-table">
                        <thead>
                            <tr>
                                <th>Parámetro</th>
                                <th>Descripción</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Color</td>
                                <td><input type="text" bind:value={color} /></td>
                            </tr>
                            <tr>
                                <td>Olor</td>
                                <td><input type="text" bind:value={odor} /></td>
                            </tr>
                            <tr>
                                <td>Sabor</td>
                                <td><input type="text" bind:value={taste} /></td>
                            </tr>
                            <tr>
                                <td>Aspecto</td>
                                <td><input type="text" bind:value={appearance} /></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="section">
                    <h2>Análisis Microbiológico</h2>
                    <table class="results-table">
                        <thead>
                            <tr>
                                <th>Parámetro</th>
                                <th>Unidad</th>
                                <th>Valor</th>
                                <th>Criterio</th>
                                <th>Método de ensayo</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Calidad Bacteriológica</td>
                                <td></td>
                                <td><input type="text" bind:value={bacteriologicalQuality} /></td>
                                <td>Aceptable</td>
                                <td>Evaluación</td>
                            </tr>
                            <tr>
                                <td>Recuento Total Aerobios Mesófilos</td>
                                <td>UFC/g</td>
                                <td><input type="number" bind:value={totalMesophilicCount} /></td>
                                <td>n = 5 m = 10^5 M = 10^6 c = 2</td>
                                <td>Recuento en placa</td>
                            </tr>
                            <tr>
                                <td>Recuento Coliformes Totales</td>
                                <td>UFC/g</td>
                                <td><input type="number" bind:value={totalColiformCount} /></td>
                                <td>n = 5 m = 10 M = 100 c = 2</td>
                                <td>Recuento en placa</td>
                            </tr>
                            <tr>
                                <td>Recuento Coliformes Fecales</td>
                                <td>UFC/g</td>
                                <td><input type="number" bind:value={fecalColiformCount} /></td>
                                <td>n = 5 m = 1 M = 10 c = 1</td>
                                <td>Recuento en placa</td>
                            </tr>
                            <tr>
                                <td>Bacterias Esporuladas</td>
                                <td>UFC/g</td>
                                <td><input type="number" bind:value={sporeFormingBacteria} /></td>
                                <td>n = 5 m = 10^2 M = 10^3 c = 2</td>
                                <td>Recuento en placa</td>
                            </tr>
                            <tr>
                                <td>Presencia Escherichia coli</td>
                                <td></td>
                                <td><input type="checkbox" bind:checked={escherichiaColi} /></td>
                                <td>Ausencia</td>
                                <td>Prueba cualitativa</td>
                            </tr>
                            <tr>
                                <td>Detección Salmonella spp.</td>
                                <td></td>
                                <td><input type="checkbox" bind:checked={salmonellaDetection} /></td>
                                <td>Ausencia</td>
                                <td>Prueba cualitativa</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="form-actions">
                    <button type="submit">Guardar</button>
                </div>
            </form>

            <div class="mt-6">
                <h2 class="text-xl font-semibold mb-2">Ver reportes históricos</h2>
                <div class="flex gap-4 mb-4">
                    <div>
                        <label for="startDate" class="block text-lg font-medium">Fecha Inicio:</label>
                        <input
                            type="date"
                            id="startDate"
                            bind:value={startDate}
                            on:change={fetchReports}
                            class="mt-1 block border rounded p-2"
                        />
                    </div>
                    <div>
                        <label for="endDate" class="block text-lg font-medium">Fecha Fin:</label>
                        <input
                            type="date"
                            id="endDate"
                            bind:value={endDate}
                            on:change={fetchReports}
                            class="mt-1 block border rounded p-2"
                        />
                    </div>
                </div>

                {#if loading}
                    <p>Loading reports...</p>
                {:else if error}
                    <p class="text-red-600">{error}</p>
                {:else if reports.length === 0}
                    <p>No se encontraron reportes en las fechas seleccionadas</p>
                {:else}
                    <table class="w-full border-collapse">
                        <thead>
                            <tr>
                                <th class="border p-2">N° Muestra</th>
                                <th class="border p-2">Fecha</th>
                                <th class="border p-2">Usuario</th>
                                <th class="border p-2">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each reports as report}
                                <tr>
                                    <td class="border p-2">
                                        {#if report.sampleNumber}Muestra: {report.sampleNumber}{/if}
                                    </td>
                                    <td class="border p-2">{report.date}</td>
                                    <td class="border p-2">{report.userId}</td>
                                    <td class="border p-2">
                                        <button
                                            on:click={() => viewReport(report.id)}
                                            class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                        >
                                            Ver
                                        </button>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                {/if}
            </div>
        </section>
    </div>

    <div slot="not_authed">
        <p>Iniciar sesión para ingresar a diarylab</p>
    </div>
</AuthGuard>

<style>
    .form-section {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
    }
    h1 {
        color: #ff0000;
        font-size: 2rem;
        text-align: center;
        margin-bottom: 2rem;
    }
    .section {
        margin-bottom: 2rem;
    }
    h2 {
        background-color: #f5e5c9;
        padding: 0.5rem;
        font-size: 1.2rem;
        font-weight: bold;
        margin-bottom: 1rem;
        text-align: center;
    }
    .date-section {
        margin-bottom: 1rem;
    }
    .form-row {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }
    .form-row label {
        width: 200px;
        font-weight: bold;
    }
    .form-row input {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid #000;
        border-radius: 4px;
    }
    table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 1rem;
    }
    th, td {
        border: 1px solid #000;
        padding: 0.5rem;
        text-align: center;
    }
    th {
        background-color: #f5e5c9;
        font-weight: bold;
    }
    td input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #000;
        border-radius: 4px;
        box-sizing: border-box;
    }
    .info-general-table {
        margin-bottom: 1rem;
    }
    .info-general-table td:first-child {
        text-align: left;
        font-weight: bold;
        background-color: #f9f9f9;
    }
    .results-table tbody tr:nth-child(even) {
        background-color: #f9f9f9;
    }
    .form-actions {
        text-align: center;
    }
    button {
        background-color: #007bff;
        color: white;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        transition: background-color 0.3s;
    }
    button:hover {
        background-color: #5b9ce3;
    }
    .flex {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
    }
</style>