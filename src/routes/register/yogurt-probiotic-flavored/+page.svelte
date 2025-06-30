<script lang="ts">
	import { onMount } from 'svelte';
	import { Auth } from '$lib/auth/Auth';
	import AuthGuard from '$lib/auth/AuthGuard.svelte';
	import type { User } from '$lib/auth/User';
	import { writable } from 'svelte/store';
	import { goto } from '$app/navigation';
	import { Registry } from '$lib/auth/Registry';

	export let data: { id: string };

	let user: User | null = null;

	let date = '';
	let analysisDate = '';
	let sampleNumber1 = '';
	let lot1 = '';
	let flavor1 = '';
	let productionDate1 = '';
	let expirationDate1 = '';
	let productionTemperature1 = '';
	let coldChamberTemperature1 = '';
	let samplingTime1 = '';
	let netContent1 = '';
	let sampleNumber2 = '';
	let lot2 = '';
	let flavor2 = '';
	let productionDate2 = '';
	let expirationDate2 = '';
	let productionTemperature2 = '';
	let coldChamberTemperature2 = '';
	let samplingTime2 = '';
	let netContent2 = '';
	let sampleNumber3 = '';
	let lot3 = '';
	let flavor3 = '';
	let productionDate3 = '';
	let expirationDate3 = '';
	let productionTemperature3 = '';
	let coldChamberTemperature3 = '';
	let samplingTime3 = '';
	let netContent3 = '';
	let fatContentM1 = '';
	let fatContentM2 = '';
	let fatContentM3 = '';
	let fatContentObservation = '';
	let sngM1 = '';
	let sngM2 = '';
	let sngM3 = '';
	let sngObservation = '';
	let titratableAcidityM1 = '';
	let titratableAcidityM2 = '';
	let titratableAcidityM3 = '';
	let titratableAcidityObservation = '';
	let phM1 = '';
	let phM2 = '';
	let phM3 = '';
	let phObservation = '';
	let phTemperatureM1 = '';
	let phTemperatureM2 = '';
	let phTemperatureM3 = '';
	let phTemperatureObservation = '';
	let colorM1 = '';
	let colorM2 = '';
	let colorM3 = '';
	let colorObservation = '';
	let smellM1 = '';
	let smellM2 = '';
	let smellM3 = '';
	let smellObservation = '';
	let tasteM1 = '';
	let tasteM2 = '';
	let tasteM3 = '';
	let tasteObservation = '';
	let appearanceM1 = '';
	let appearanceM2 = '';
	let appearanceM3 = '';
	let appearanceObservation = '';
	let probioticCountM1 = '';
	let probioticCountM2 = '';
	let probioticCountM3 = '';
	let coliformCountM1 = '';
	let coliformCountM2 = '';
	let coliformCountM3 = '';
	let fecalColiformCountM1 = '';
	let fecalColiformCountM2 = '';
	let fecalColiformCountM3 = '';
	let eColiPresenceM1 = '';
	let eColiPresenceM2 = '';
	let eColiPresenceM3 = '';
	let moldYeastCountM1 = '';
	let moldYeastCountM2 = '';
	let moldYeastCountM3 = '';
	let analysisTime = '';

	let startDate: string = '2025-01-01';
	let endDate: string = '2025-06-01';
	let reports: any[] = [];
	let error: string | null = null;
	let loading: boolean = false;

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
		const formData = {
			date,
			analysisDate,
			sampleNumber1,
			lot1,
			flavor1,
			productionDate1,
			expirationDate1,
			productionTemperature1,
			coldChamberTemperature1,
			samplingTime1,
			netContent1,
			sampleNumber2,
			lot2,
			flavor2,
			productionDate2,
			expirationDate2,
			productionTemperature2,
			coldChamberTemperature2,
			samplingTime2,
			netContent2,
			sampleNumber3,
			lot3,
			flavor3,
			productionDate3,
			expirationDate3,
			productionTemperature3,
			coldChamberTemperature3,
			samplingTime3,
			netContent3,
			fatContentM1,
			fatContentM2,
			fatContentM3,
			fatContentObservation,
			sngM1,
			sngM2,
			sngM3,
			sngObservation,
			titratableAcidityM1,
			titratableAcidityM2,
			titratableAcidityM3,
			titratableAcidityObservation,
			phM1,
			phM2,
			phM3,
			phObservation,
			phTemperatureM1,
			phTemperatureM2,
			phTemperatureM3,
			phTemperatureObservation,
			colorM1,
			colorM2,
			colorM3,
			colorObservation,
			smellM1,
			smellM2,
			smellM3,
			smellObservation,
			tasteM1,
			tasteM2,
			tasteM3,
			tasteObservation,
			appearanceM1,
			appearanceM2,
			appearanceM3,
			appearanceObservation,
			probioticCountM1,
			probioticCountM2,
			probioticCountM3,
			coliformCountM1,
			coliformCountM2,
			coliformCountM3,
			fecalColiformCountM1,
			fecalColiformCountM2,
			fecalColiformCountM3,
			eColiPresenceM1,
			eColiPresenceM2,
			eColiPresenceM3,
			moldYeastCountM1,
			moldYeastCountM2,
			moldYeastCountM3,
			analysisTime
		};
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
			const response = await fetch('/api/probiotic-yogurt', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(formData)
			});

			if (response.ok) {
				const result = await response.json();
				alert('Data subida exitosamente: ' + (result.id ? `ID ${result.id}` : ''));
			} else {
				const result = await response.json();
				console.error('API response:', result);
				if (response.status === 401 && result.reason === 'token_invalid' && retryCount < 1) {
					const refreshed = await Registry.auth.refreshToken();
					if (refreshed) {
						return saveForm(retryCount + 1);
					} else {
						console.warn('Token refresh failed on retry');
						alert('Sesion expirada. Recargando la pagina...');
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
			const response = await fetch(`/api/probiotic-yogurt?startDate=${startDate}&endDate=${endDate}`, {
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
		goto(`/reports-form/report-probiotic/${reportId}`);
	}
</script>

<AuthGuard manual={true} forceLogin={true}>
	<div slot="authed" let:user>
		<section class="form-section">
			<h1>Informe de Yogurt Probiótico y/o Saborizado</h1>
			<form on:submit|preventDefault={() => saveForm()}>
				<div class="date-section">
					<div class="form-row">
						<label>Fecha:</label>
						<input type="date" bind:value={date} />
					</div>
					<div class="form-row">
						<label>Fecha de analisis:</label>
						<input type="date" bind:value={analysisDate} />
					</div>
				</div>

				<div class="section">
					<h2>Informacion general</h2>
					<table class="info-general-table">
						<thead>
							<tr>
								<th>N° de Muestra</th>
								<th>Lote</th>
								<th>Sabor</th>
								<th>Fecha de Elaboración</th>
								<th>Fecha de Vencimiento</th>
								<th>Temperatura de Producción (°C)</th>
								<th>Cámara Fría (°C)</th>
								<th>Hora muestreo</th>
								<th>Contenido Neto (g)</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td><input type="text" bind:value={sampleNumber1} /></td>
								<td><input type="text" bind:value={lot1} /></td>
								<td><input type="text" bind:value={flavor1} /></td>
								<td><input type="date" bind:value={productionDate1} /></td>
								<td><input type="date" bind:value={expirationDate1} /></td>
								<td><input type="number" step="0.1" bind:value={productionTemperature1} /></td>
								<td><input type="number" step="0.1" bind:value={coldChamberTemperature1} /></td>
								<td><input type="time" bind:value={samplingTime1} /></td>
								<td><input type="number" step="0.1" bind:value={netContent1} /></td>
							</tr>
							<tr>
								<td><input type="text" bind:value={sampleNumber2} /></td>
								<td><input type="text" bind:value={lot2} /></td>
								<td><input type="text" bind:value={flavor2} /></td>
								<td><input type="date" bind:value={productionDate2} /></td>
								<td><input type="date" bind:value={expirationDate2} /></td>
								<td><input type="number" step="0.1" bind:value={productionTemperature2} /></td>
								<td><input type="number" step="0.1" bind:value={coldChamberTemperature2} /></td>
								<td><input type="time" bind:value={samplingTime2} /></td>
								<td><input type="number" step="0.1" bind:value={netContent2} /></td>
							</tr>
							<tr>
								<td><input type="text" bind:value={sampleNumber3} /></td>
								<td><input type="text" bind:value={lot3} /></td>
								<td><input type="text" bind:value={flavor3} /></td>
								<td><input type="date" bind:value={productionDate3} /></td>
								<td><input type="date" bind:value={expirationDate3} /></td>
								<td><input type="number" step="0.1" bind:value={productionTemperature3} /></td>
								<td><input type="number" step="0.1" bind:value={coldChamberTemperature3} /></td>
								<td><input type="time" bind:value={samplingTime3} /></td>
								<td><input type="number" step="0.1" bind:value={netContent3} /></td>
							</tr>
						</tbody>
					</table>
				</div>

				<div class="section">
					<h2>Analisis Fisicoquimica</h2>
					<table class="results-table">
						<thead>
							<tr>
								<th>Parametro</th>
								<th>Unidad</th>
								<th>M1:</th>
								<th>M2:</th>
								<th>M3:</th>
								<th>Rango de aceptacion</th>
								<th>Observaciones</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>Materia Grasa (%)</td>
								<td>%</td>
								<td><input type="number" step="0.1" bind:value={fatContentM1} /></td>
								<td><input type="number" step="0.1" bind:value={fatContentM2} /></td>
								<td><input type="number" step="0.1" bind:value={fatContentM3} /></td>
								<td>min 2.5</td>
								<td><input type="text" bind:value={fatContentObservation} /></td>
							</tr>
							<tr>
								<td>SNG (%)</td>
								<td>%</td>
								<td><input type="number" step="0.1" bind:value={sngM1} /></td>
								<td><input type="number" step="0.1" bind:value={sngM2} /></td>
								<td><input type="number" step="0.1" bind:value={sngM3} /></td>
								<td>8.0 - 14.0</td>
								<td><input type="text" bind:value={sngObservation} /></td>
							</tr>
							<tr>
								<td>Acidez Titulable (%)</td>
								<td>%</td>
								<td><input type="number" step="0.01" bind:value={titratableAcidityM1} /></td>
								<td><input type="number" step="0.01" bind:value={titratableAcidityM2} /></td>
								<td><input type="number" step="0.01" bind:value={titratableAcidityM3} /></td>
								<td>0.6 - 1.5</td>
								<td><input type="text" bind:value={titratableAcidityObservation} /></td>
							</tr>
							<tr>
								<td>Acidez (pH)</td>
								<td>pH</td>
								<td><input type="number" step="0.01" bind:value={phM1} /></td>
								<td><input type="number" step="0.01" bind:value={phM2} /></td>
								<td><input type="number" step="0.01" bind:value={phM3} /></td>
								<td>4.00 - 4.60</td>
								<td><input type="text" bind:value={phObservation} /></td>
							</tr>
							<tr>
								<td>Temperatura pH (°C)</td>
								<td>°C</td>
								<td><input type="number" step="0.1" bind:value={phTemperatureM1} /></td>
								<td><input type="number" step="0.1" bind:value={phTemperatureM2} /></td>
								<td><input type="number" step="0.1" bind:value={phTemperatureM3} /></td>

								<td>25°C</td>
								<td><input type="text" bind:value={phTemperatureObservation} /></td>
							</tr>
						</tbody>
					</table>
				</div>

				<div class="section">
					<h2>Analisis organolepticos</h2>
					<table class="results-table">
						<thead>
							<tr>
								<th>Parametro</th>
								<th>Descripcion</th>
								<th>M1:</th>
								<th>M2:</th>
								<th>M3:</th>
								<th>Observaciones</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>Color</td>
								<td>Blanqueo o propio al sabor</td>
								<td><input type="text" bind:value={colorM1} /></td>
								<td><input type="text" bind:value={colorM2} /></td>
								<td><input type="text" bind:value={colorM3} /></td>

								<td><input type="text" bind:value={colorObservation} /></td>
							</tr>
							<tr>
								<td>Olor</td>
								<td>Agradable, característico al Yogurt</td>
								<td><input type="text" bind:value={smellM1} /></td>
								<td><input type="text" bind:value={smellM2} /></td>
								<td><input type="text" bind:value={smellM3} /></td>
								<td><input type="text" bind:value={smellObservation} /></td>
							</tr>
							<tr>
								<td>Sabor</td>
								<td>Fresco, característico al Yogurt</td>
								<td><input type="text" bind:value={tasteM1} /></td>
								<td><input type="text" bind:value={tasteM2} /></td>
								<td><input type="text" bind:value={tasteM3} /></td>
								<td><input type="text" bind:value={tasteObservation} /></td>
							</tr>
							<tr>
								<td>Aspecto</td>
								<td>Agadable, lig. Ácido</td>
								<td><input type="text" bind:value={appearanceM1} /></td>
								<td><input type="text" bind:value={appearanceM2} /></td>
								<td><input type="text" bind:value={appearanceM3} /></td>
								<td><input type="text" bind:value={appearanceObservation} /></td>
							</tr>
						</tbody>
					</table>
				</div>

				<div class="section">
					<h2>Analisis microbiologico</h2>
					<table class="results-table">
						<thead>
							<tr>
								<th>Hora de análisis</th>
								<th>Requisito</th>
								<th>Method</th>
								<th>M1:</th>
								<th>M2:</th>
								<th>M3:</th>
								<th>Criterio de aceptacion</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td><input type="time" bind:value={analysisTime} /></td>
								<td>Recuento de Probióticos (UFC/g)</td>
								<td>Rcto. en placa</td>
								<td><input type="number" bind:value={probioticCountM1} /></td>
								<td><input type="number" bind:value={probioticCountM2} /></td>
								<td><input type="number" bind:value={probioticCountM3} /></td>
								<td>min 10^6</td>
							</tr>
							<tr>
								<td rowspan="4"></td>
								<td>Recuento Coliformes Totales</td>
								<td>Rcto. en placa</td>
								<td><input type="number" bind:value={coliformCountM1} /></td>
								<td><input type="number" bind:value={coliformCountM2} /></td>
								<td><input type="number" bind:value={coliformCountM3} /></td>
								<td>n=5, m=10, M=100, c=2</td>
							</tr>
							<tr>
								<td>Recuento de Coliformes Fecales</td>
								<td>Rcto. en placa</td>
								<td><input type="number" bind:value={fecalColiformCountM1} /></td>
								<td><input type="number" bind:value={fecalColiformCountM2} /></td>
								<td><input type="number" bind:value={fecalColiformCountM3} /></td>
								<td>n=5, m=0, M=0, c=0</td>
							</tr>
							<tr>
								<td>Presencia Escherichia coli</td>
								<td>Ec. Medio</td>
								<td><input type="text" bind:value={eColiPresenceM1} /></td>
								<td><input type="text" bind:value={eColiPresenceM2} /></td>
								<td><input type="text" bind:value={eColiPresenceM3} /></td>

								<td>ausencia</td>
							</tr>
							<tr>
								<td>Recuento de Mohos y Levaduras</td>
								<td>Rcto. en placa</td>
								<td><input type="number" bind:value={moldYeastCountM1} /></td>
								<td><input type="number" bind:value={moldYeastCountM2} /></td>
								<td><input type="number" bind:value={moldYeastCountM3} /></td>
								<td>n=5, m=1, M=10, c=1</td>
							</tr>
						</tbody>
					</table>
				</div>

				<div class="form-actions">
					<button type="submit">Guardar</button>
				</div>
			</form>

			<div class="mt-6">
				<h2 class="text-xl font-semibold mb-2">Ver reportes historicos</h2>
				<div class="flex gap-4 mb-4">
					<div>
						<label for="startDate" class="block text-lg font-medium">Fecha de inicio:</label>
						<input
							type="date"
							id="startDate"
							bind:value={startDate}
							on:change={fetchReports}
							class="mt-1 block border rounded p-2"
						/>
					</div>
					<div>
						<label for="endDate" class="block text-lg font-medium">Fecha final:</label>
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
					<p>No se han encontrado reportes</p>
				{:else}
					<table class="w-full border-collapse">
						<thead>
							<tr>
								<th class="border p-2">N muestra</th>
								<th class="border p-2">Fecha</th>
								<th class="border p-2">Usuario</th>
								<th class="border p-2">Accion</th>
							</tr>
						</thead>
						<tbody>
							{#each reports as report}
								<tr>
									<td class="border p-2">
										{#if report.sampleNumber1}Muestra: {report.sampleNumber1}{/if}
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
		<p>Log in for join to DiaryLab</p>
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