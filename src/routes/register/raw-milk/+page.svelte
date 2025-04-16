<script lang="ts">
    import { onMount } from 'svelte';
    import { Registry } from '$lib/auth/Registry';
    import AuthGuard from '$lib/auth/AuthGuard.svelte';
    import type { User } from '$lib/auth/User';

    let user: User | null = null;

    let fecha = '';
    let fechaAnalisis = '';
    let nMuestraTarde = '';
    let nMuestraMadrugrada = '';
    let nMuestraGmp2 = '';
    let horaMuestreoTarde = '';
    let horaMuestreoMadrugrada = '';
    let horaMuestreoGmp2 = '';
    let tempMuestreoTarde = '';
    let tempMuestreoMadrugrada = '';
    let tempMuestreoGmp2 = '';

    let ph20CTarde = '';
    let ph20CMadrugrada = '';
    let ph20CGmp2 = '';
    let temperaturaTarde = '';
    let temperaturaMadrugrada = '';
    let temperaturaGmp2 = '';
    let acidezTituableTarde = '';
    let acidezTituableMadrugrada = '';
    let acidezTituableGmp2 = '';
    let densidad20CTarde = '';
    let densidad20CMadrugrada = '';
    let densidad20CGmp2 = '';
    let materiaGrasaTarde = '';
    let materiaGrasaMadrugrada = '';
    let materiaGrasaGmp2 = '';
    let solidosNoGrasosTarde = '';
    let solidosNoGrasosMadrugrada = '';
    let solidosNoGrasosGmp2 = '';
    let alcoholimetriaTarde = '';
    let alcoholimetriaMadrugrada = '';
    let alcoholimetriaGmp2 = '';
    let tramTarde = '';
    let tramMadrugrada = '';
    let tramGmp2 = '';

    onMount(() => {
        console.log('+page.svelte (Leche Cruda) mounted, checking params...');
        Registry.auth.checkParams();
        Registry.auth.getUser().subscribe((data: User) => {
            user = data;
            console.log('User in +page.svelte (Leche Cruda):', user);
        });
    });

    async function saveForm() {
        const formData = {
            fecha,
            fechaAnalisis,
            nMuestra: {
                tarde: nMuestraTarde,
                madrugrada: nMuestraMadrugrada,
                gmp2: nMuestraGmp2
            },
            horaMuestreo: {
                tarde: horaMuestreoTarde,
                madrugrada: horaMuestreoMadrugrada,
                gmp2: horaMuestreoGmp2
            },
            tempMuestreo: {
                tarde: tempMuestreoTarde,
                madrugrada: tempMuestreoMadrugrada,
                gmp2: tempMuestreoGmp2
            },
            ph20C: {
                tarde: ph20CTarde,
                madrugrada: ph20CMadrugrada,
                gmp2: ph20CGmp2
            },
            temperatura: {
                tarde: temperaturaTarde,
                madrugrada: temperaturaMadrugrada,
                gmp2: temperaturaGmp2
            },
            acidezTituable: {
                tarde: acidezTituableTarde,
                madrugrada: acidezTituableMadrugrada,
                gmp2: acidezTituableGmp2
            },
            densidad20C: {
                tarde: densidad20CTarde,
                madrugrada: densidad20CMadrugrada,
                gmp2: densidad20CGmp2
            },
            materiaGrasa: {
                tarde: materiaGrasaTarde,
                madrugrada: materiaGrasaMadrugrada,
                gmp2: materiaGrasaGmp2
            },
            solidosNoGrasos: {
                tarde: solidosNoGrasosTarde,
                madrugrada: solidosNoGrasosMadrugrada,
                gmp2: solidosNoGrasosGmp2
            },
            alcoholimetria: {
                tarde: alcoholimetriaTarde,
                madrugrada: alcoholimetriaMadrugrada,
                gmp2: alcoholimetriaGmp2
            },
            tram: {
                tarde: tramTarde,
                madrugrada: tramMadrugrada,
                gmp2: tramGmp2
            }
        };

        try {
            const response = await fetch('/api/raw-milk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert('Datos guardados exitosamente');
            } else {
                alert('Error al guardar los datos');
            }
        } catch (error) {
            console.error('Error saving form data:', error);
            alert('Error al guardar los datos');
        }
    }
</script>

<AuthGuard manual={true} forceLogin={true}>
    <div slot="authed" let:user>
        <section class="form-section">
            <h1>Informe de Análisis Leche Cruda</h1>
            <form on:submit|preventDefault={saveForm}>
                <div class="date-section">
                    <div class="form-row">
                        <label>Fecha:</label>
                        <input type="date" bind:value={fecha} />
                    </div>
                    <div class="form-row">
                        <label>Fecha de Análisis:</label>
                        <input type="date" bind:value={fechaAnalisis} />
                    </div>
                </div>

                <div class="section">
                    <h2>Información General</h2>
                    <table class="info-general-table">
                        <thead>
                            <tr>
                                <th></th>
                                <th>TARDE</th>
                                <th>MADRUgada</th>
                                <th>GMP 2</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>N° Muestra</td>
                                <td><input type="text" bind:value={nMuestraTarde} /></td>
                                <td><input type="text" bind:value={nMuestraMadrugrada} /></td>
                                <td><input type="text" bind:value={nMuestraGmp2} /></td>
                            </tr>
                            <tr>
                                <td>Hora de muestreo</td>
                                <td><input type="time" bind:value={horaMuestreoTarde} /></td>
                                <td><input type="time" bind:value={horaMuestreoMadrugrada} /></td>
                                <td><input type="time" bind:value={horaMuestreoGmp2} /></td>
                            </tr>
                            <tr>
                                <td>Temp. muestreo °C</td>
                                <td><input type="number" step="0.1" bind:value={tempMuestreoTarde} /></td>
                                <td><input type="number" step="0.1" bind:value={tempMuestreoMadrugrada} /></td>
                                <td><input type="number" step="0.1" bind:value={tempMuestreoGmp2} /></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="section">
                    <h2>Información Fisicoquímica</h2>
                    <table class="results-table">
                        <thead>
                            <tr>
                                <th>PARÁMETRO</th>
                                <th>UNID.</th>
                                <th>TARDE</th>
                                <th>MADRUgada</th>
                                <th>GMP 2</th>
                                <th>RANGO (*)</th>
                                <th>MÉTODO DE ENSAYO</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>pH a 20°C</td>
                                <td>Unid. de pH</td>
                                <td><input type="number" step="0.01" bind:value={ph20CTarde} /></td>
                                <td><input type="number" step="0.01" bind:value={ph20CMadrugrada} /></td>
                                <td><input type="number" step="0.01" bind:value={ph20CGmp2} /></td>
                                <td>6.60 a 6.80</td>
                                <td>Potenciométrico</td>
                            </tr>
                            <tr>
                                <td>Temperatura</td>
                                <td>°C</td>
                                <td><input type="number" step="0.1" bind:value={temperaturaTarde} /></td>
                                <td><input type="number" step="0.1" bind:value={temperaturaMadrugrada} /></td>
                                <td><input type="number" step="0.1" bind:value={temperaturaGmp2} /></td>
                                <td>15 a 25</td>
                                <td>Termómetro</td>
                            </tr>
                            <tr>
                                <td>Acidez Titulable</td>
                                <td>% Ác. Láctico</td>
                                <td><input type="number" step="0.01" bind:value={acidezTituableTarde} /></td>
                                <td><input type="number" step="0.01" bind:value={acidezTituableMadrugrada} /></td>
                                <td><input type="number" step="0.01" bind:value={acidezTituableGmp2} /></td>
                                <td>0.13 a 0.18</td>
                                <td>Método volumétrico</td>
                            </tr>
                            <tr>
                                <td>Densidad a 20°C</td>
                                <td>g/cm³</td>
                                <td><input type="number" step="0.001" bind:value={densidad20CTarde} /></td>
                                <td><input type="number" step="0.001" bind:value={densidad20CMadrugrada} /></td>
                                <td><input type="number" step="0.001" bind:value={densidad20CGmp2} /></td>
                                <td>1.028 a 1.034</td>
                                <td>Lactodensímetro</td>
                            </tr>
                            <tr>
                                <td>Materia Grasa</td>
                                <td>%</td>
                                <td><input type="number" step="0.1" bind:value={materiaGrasaTarde} /></td>
                                <td><input type="number" step="0.1" bind:value={materiaGrasaMadrugrada} /></td>
                                <td><input type="number" step="0.1" bind:value={materiaGrasaGmp2} /></td>
                                <td>Min. 3.00</td>
                                <td>Método Gerber</td>
                            </tr>
                            <tr>
                                <td>Sólidos no Grasos</td>
                                <td>%</td>
                                <td><input type="number" step="0.1" bind:value={solidosNoGrasosTarde} /></td>
                                <td><input type="number" step="0.1" bind:value={solidosNoGrasosMadrugrada} /></td>
                                <td><input type="number" step="0.1" bind:value={solidosNoGrasosGmp2} /></td>
                                <td>Min. 8.2</td>
                                <td>Lactómetro de Bucziki</td>
                            </tr>
                            <tr>
                                <td>Alcoholimetría</td>
                                <td>-</td>
                                <td><input type="text" bind:value={alcoholimetriaTarde} /></td>
                                <td><input type="text" bind:value={alcoholimetriaMadrugrada} /></td>
                                <td><input type="text" bind:value={alcoholimetriaGmp2} /></td>
                                <td>Negativa</td>
                                <td>Prueba de Alcohol al 79%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>


                <div class="section">
                    <h2>Información Microbiológica</h2>
                    <table class="results-table">
                        <thead>
                            <tr>
                                <th>PARÁMETRO</th>
                                <th>UNID.</th>
                                <th>TARDE</th>
                                <th>MADRUgada</th>
                                <th>GMP 2</th>
                                <th>RANGO (*)</th>
                                <th>MÉTODO DE ENSAYO</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>TRAM (Tiempo de reducción de metileno)</td>
                                <td>h</td>
                                <td><input type="text" bind:value={tramTarde} /></td>
                                <td><input type="text" bind:value={tramMadrugrada} /></td>
                                <td><input type="text" bind:value={tramGmp2} /></td>
                                <td>> 1h</td>
                                <td>Prueba de reductasa</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="form-actions">
                    <button type="submit">Guardar</button>
                </div>
            </form>
        </section>
    </div>
    <div slot="not_authed">
        <p>Por favor, inicia sesión para acceder a DiaryLab</p>
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
        background-color: #0056b3;
    }
</style>