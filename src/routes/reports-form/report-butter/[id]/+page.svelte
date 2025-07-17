<script lang="ts">
    import { onMount } from 'svelte';
    import { Auth } from '$lib/auth/Auth';
    import AuthGuard from '$lib/auth/AuthGuard.svelte';
    import type { User } from '$lib/auth/User';
    import { writable } from 'svelte/store';
    import { goto } from '$app/navigation';

    export let data: any;

    let user: User | null = null;
    const report = writable<any>(null);
    const error = writable<string | null>(null);
    let errorMessage: string | null = null;
    let authInstance: Auth | null = null;
    let loginInitiated: boolean = false;
    const loading = writable<boolean>(true);

    let date = '';
    let analysisDate = '';
    let samplingTime = '';
    let responsibleAnalyst = '';
    let sampleNumber = '';
    let productionLot = '';
    let productionDate = '';
    let expirationDate = '';
    let temperature = '';
    let coldChamber = '';
    let netContent = '';
    let fatContent = '';
    let acidityPercent = '';
    let phAcidity = '';
    let phTemperature = '';
    let meltingPoint = '';
    let color = '';
    let odor = '';
    let taste = '';
    let texture = '';
    let bacteriologicalQuality = '';
    let totalMesophilicCount = '';
    let totalColiformCount = '';
    let moldYeastCount = '';
    let escherichiaColi = '';
    let salmonellaDetection = '';

    onMount(async () => {
        const auth = new Auth({
            url: 'https://keycloak-24-0-1-z3qr.onrender.com',
            realm: 'diarylab',
            clientId: 'sveltekit'
        });

        authInstance = auth;

        try {
            await auth.inBrowserInit();
            await fetchReport();
        } catch (error) {
            errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('Error initializing authentication or fetching data:', error);
        }
    });

    function formatDateForInput(isoDate: string): string {
        if (!isoDate) return '';
        return new Date(isoDate).toISOString().split('T')[0];
    }

    function formatTimeForInput(timeStr: string): string {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        return `${hours}:${minutes}`;
    }

    async function fetchReport(retryCount = 0) {
        if (!authInstance) {
            error.set('Authentication not initialized');
            loading.set(false);
            return;
        }

        let token: string | null;
        try {
            const refreshed = await authInstance.refreshToken();
            token = authInstance.getToken();
            if (!refreshed && !token && retryCount === 0) {
                if (!loginInitiated) {
                    loginInitiated = true;
                    await authInstance.login({ redirectUri: window.location.href });
                }
                return;
            }
        } catch (err) {
            console.error('Token refresh error:', err);
            error.set('Authentication error');
            if (!loginInitiated) {
                loginInitiated = true;
                await authInstance.login({ redirectUri: window.location.href });
            }
            loading.set(false);
            return;
        }

        if (!token) {
            error.set('No authentication token');
            if (!loginInitiated) {
                loginInitiated = true;
                await authInstance.login({ redirectUri: window.location.href });
            }
            loading.set(false);
            return;
        }

        try {
            const response = await fetch(`/api/butter/${data.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
                const result = await response.text();
                if (response.status === 401 && retryCount < 1) {
                    const refreshed = await authInstance.refreshToken();
                    if (refreshed) {
                        return fetchReport(retryCount + 1);
                    }
                }
                if (response.status === 404) {
                    error.set('Report not found');
                    return;
                }
                throw new Error(`Failed to fetch data: ${response.status} - ${result.data}`);
            }

            const result = await response.json();
            console.log(result);
            report.set(result.data);
            if (result.data) {
                date = formatDateForInput(result.data.samplingDate || '');
                analysisDate = formatDateForInput(result.data.analysisDate || '');
                samplingTime = formatTimeForInput(result.data.samplingTime || '');
                responsibleAnalyst = result.data.responsibleAnalyst || '';
                sampleNumber = result.data.sampleNumber || '';
                productionLot = result.data.production.batch || '';
                productionDate = formatDateForInput(result.data.production.date || '');
                expirationDate = formatDateForInput(result.data.production.expirationDate || '');
                temperature = result.data.production.temperature || '';
                coldChamber = result.data.production.coldChamberTemperature || '';
                netContent = result.data.production.netContent || '';
                fatContent = result.data.measurements.fatContent || '';
                acidityPercent = result.data.measurements.acidityPercent || '';
                phAcidity = result.data.measurements.phAcidity || '';
                phTemperature = result.data.measurements.phTemperature || '';
                meltingPoint = result.data.measurements.meltingPoint || '';
                color = result.data.measurements.color || '';
                odor = result.data.measurements.odor || '';
                taste = result.data.measurements.flavor || '';
                texture = result.data.measurements.texture || '';
                bacteriologicalQuality = result.data.bacteriological.quality || '';
                totalMesophilicCount = result.data.bacteriological.totalMesophilicCount || '';
                totalColiformCount = result.data.bacteriological.totalColiformCount || '';
                moldYeastCount = result.data.bacteriological.moldYeastCount || '';
                escherichiaColi = result.data.bacteriological.escherichiaColi ? '1' : '0';
                salmonellaDetection = result.data.bacteriological.salmonellaDetection ? '1' : '0';
            }
        } catch (err) {
            console.error('Fetch error:', err);
            error.set(`Error fetching report: ${err.message}`);
        } finally {
            loading.set(false);
        }
    }

    async function saveForm(retryCount = 0) {
        if (!authInstance) {
            console.warn('Authentication instance not initialized');
            error.set('Authentication not initialized');
            return;
        }

        let token = authInstance.getToken();
        if (!token) {
            console.warn('No token found, redirecting to login...');
            alert('No authentication token available. Redirecting to login...');
            await authInstance.login({ redirectUri: window.location.href });
            return;
        }

        try {
            const refreshed = await authInstance.refreshToken();
            if (!refreshed) {
                if (retryCount < 1) {
                    const refreshedAgain = await authInstance.refreshToken();
                    if (refreshedAgain) {
                        token = authInstance.getToken();
                    }
                } else {
                    throw new Error('Token refresh failed after retry');
                }
            }
            token = authInstance.getToken();
            if (!token) {
                throw new Error('Failed to obtain token after refresh');
            }
        } catch (error) {
            console.error('Error during token refresh:', error.message || error);
            alert('Authentication error. Redirecting to login...');
            await authInstance.login({ redirectUri: window.location.href });
            return;
        }

        const formData = {
            date,
            analysisDate,
            samplingTime,
            responsibleAnalyst,
            sampleNumber,
            productionLot,
            productionDate,
            expirationDate,
            temperature: parseFloat(temperature) || 0,
            coldChamber: parseFloat(coldChamber) || 0,
            netContent: parseFloat(netContent) || 0,
            fatContent: parseFloat(fatContent) || 0,
            acidityPercent: parseFloat(acidityPercent) || 0,
            phAcidity: parseFloat(phAcidity) || 0,
            phTemperature: parseFloat(phTemperature) || 0,
            meltingPoint: parseFloat(meltingPoint) || 0,
            color,
            odor,
            taste,
            texture,
            bacteriologicalQuality,
            totalMesophilicCount: parseFloat(totalMesophilicCount) || 0,
            totalColiformCount: parseFloat(totalColiformCount) || 0,
            moldYeastCount: parseFloat(moldYeastCount) || 0,
            escherichiaColi: parseInt(escherichiaColi) || 0,
            salmonellaDetection: parseInt(salmonellaDetection) || 0
        };

        try {
            const response = await fetch(`/api/butter/${data.id}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Data updated successfully:', result.data);
                alert(`Reporte actualizado con éxito!${result.data.data?.id ? ` ID ${result.data.data.id}` : ''}`);
                await fetchReport();
            } else {
                const result = await response.json();
                if (response.status === 401 && result.data.reason === 'token_invalid' && retryCount < 1) {
                    const refreshed = await authInstance.refreshToken();
                    if (refreshed) {
                        return saveForm(retryCount + 1);
                    }
                }
                throw new Error(
                    `Fallo al actualizar datos: ${response.status} - ${result.data.message || result.data.error || response.statusText}`
                );
            }
        } catch (err) {
            console.error('Save error:', err);
            error.set(`Error al guardar reporte: ${err.message}`);
        }
    }

    async function deleteReport(retryCount = 0) {
        if (!authInstance) {
            error.set('Authentication not initialized');
            loading.set(false);
            return;
        }

        let token: string | null;
        try {
            const refreshed = await authInstance.refreshToken();
            token = authInstance.getToken();
            if (!refreshed && !token && retryCount === 0) {
                if (!loginInitiated) {
                    loginInitiated = true;
                    await authInstance.login({ redirectUri: window.location.href });
                }
                return;
            }
        } catch (err) {
            console.error('Token refresh error:', err);
            error.set('Authentication error');
            if (!loginInitiated) {
                loginInitiated = true;
                await authInstance.login({ redirectUri: window.location.href });
            }
            loading.set(false);
            return;
        }

        if (!token) {
            error.set('No authentication token');
            if (!loginInitiated) {
                loginInitiated = true;
                await authInstance.login({ redirectUri: window.location.href });
            }
            loading.set(false);
            return;
        }

        try {
            const response = await fetch(`/api/butter/${data.id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                alert('Reporte eliminado con éxito!');
                goto('/register/butter');
            } else {
                const result = await response.json();
                if (response.status === 401 && result.data.reason === 'token_invalid' && retryCount < 1) {
                    const refreshed = await authInstance.refreshToken();
                    if (refreshed) {
                        return deleteReport(retryCount + 1);
                    }
                }
                throw new Error(
                    `Fallo al eliminar el reporte: ${response.status} - ${result.data.message || result.data.error || response.statusText}`
                );
            }
        } catch (err) {
            console.error('Delete error:', err);
            error.set(`Error al eliminar reporte: ${err.message}`);
        } finally {
            loading.set(false);
        }
    }
</script>

<AuthGuard manual={true} forceLogin={true}>
    <div slot="authed" let:user>
        <section class="form-section">
            <h1>Informe de Mantequilla (ID: {data.id})</h1>
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
                    <div class="form-row">
                        <label>Hora de muestreo:</label>
                        <input type="time" bind:value={samplingTime} />
                    </div>
                    <div class="form-row">
                        <label>Analista responsable:</label>
                        <input type="text" bind:value={responsibleAnalyst} />
                    </div>
                    <div class="form-row">
                        <label>N° de muestra:</label>
                        <input type="text" bind:value={sampleNumber} />
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
                    <table class="result.datas-table">
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
                                <td>min 80%</td>
                                <td>Mét. Gerber</td>
                            </tr>
                            <tr>
                                <td>Acidez (%)</td>
                                <td>%</td>
                                <td><input type="number" step="0.01" bind:value={acidityPercent} /></td>
                                <td>0.1 - 0.3</td>
                                <td>Titulación</td>
                            </tr>
                            <tr>
                                <td>Acidez (pH)</td>
                                <td>pH Unidad</td>
                                <td><input type="number" step="0.01" bind:value={phAcidity} /></td>
                                <td>4.5 - 6.0</td>
                                <td>Potenciómetro</td>
                            </tr>
                            <tr>
                                <td>Temperatura pH</td>
                                <td>°C</td>
                                <td><input type="number" step="0.1" bind:value={phTemperature} /></td>
                                <td>10 - 20</td>
                                <td>Termómetro</td>
                            </tr>
                            <tr>
                                <td>Punto Fusión</td>
                                <td>°C</td>
                                <td><input type="number" step="0.1" bind:value={meltingPoint} /></td>
                                <td>32 - 35</td>
                                <td>Mét. Capilar</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="section">
                    <h2>Análisis Organoléptico</h2>
                    <table class="result.datas-table">
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
                                <td>Textura</td>
                                <td><input type="text" bind:value={texture} /></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="section">
                    <h2>Análisis Microbiológico</h2>
                    <table class="result.datas-table">
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
                                <td>Mohos y Levaduras</td>
                                <td>UFC/g</td>
                                <td><input type="number" bind:value={moldYeastCount} /></td>
                                <td>n = 5 m = 10 M = 100 c = 2</td>
                                <td>Recuento en placa</td>
                            </tr>
                            <tr>
                                <td>Presencia Escherichia coli</td>
                                <td></td>
                                <td><input type="number" bind:value={escherichiaColi} /></td>
                                <td>Ausencia</td>
                                <td>Prueba cualitativa</td>
                            </tr>
                            <tr>
                                <td>Detección Salmonella spp.</td>
                                <td></td>
                                <td><input type="number" bind:value={salmonellaDetection} /></td>
                                <td>Ausencia</td>
                                <td>Prueba cualitativa</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="form-actions">
                    <button type="submit">Guardar</button>
                    <button type="button" on:click={() => goto('/register/butter')}>Regresar</button>
                    <button type="button" on:click={deleteReport} class="delete-btn">Eliminar Reporte</button>
                </div>
            </form>
        </section>
    </div>

    <div slot="not_authed">
        <p>Iniciar sesión para ingresar a DiaryLab</p>
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
    th,
    td {
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
</style>