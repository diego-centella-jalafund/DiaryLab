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
	let startDate: string = '2025-01-01';
	let endDate: string = '2025-06-01';
	let reports: any[] = [];
	let error: string | null = null;
	let loading: boolean = false;

	let date = '';
	let analysisDate = '';
	let sampleNumber1 = '';
	let productionDate1 = '';
	let expirationDate1 = '';
	let samplingTime1 = '';
	let productTemperature1 = '';
	let coldChamberTemperature1 = '';
	let netContent1 = '';
	let sampleNumber2 = '';
	let productionDate2 = '';
	let expirationDate2 = '';
	let samplingTime2 = '';
	let productTemperature2 = '';
	let coldChamberTemperature2 = '';
	let netContent2 = '';
	let sampleNumber3 = '';
	let productionDate3 = '';
	let expirationDate3 = '';
	let samplingTime3 = '';
	let productTemperature3 = '';
	let coldChamberTemperature3 = '';
	let netContent3 = '';
	let sampleNumber4 = '';
	let productionDate4 = '';
	let expirationDate4 = '';
	let samplingTime4 = '';
	let productTemperature4 = '';
	let coldChamberTemperature4 = '';
	let netContent4 = '';
	let sampleNumber5 = '';
	let productionDate5 = '';
	let expirationDate5 = '';
	let samplingTime5 = '';
	let productTemperature5 = '';
	let coldChamberTemperature5 = '';
	let netContent5 = '';
	let fatContentM1 = '';
	let fatContentM2 = '';
	let fatContentM3 = '';
	let fatContentM4 = '';
	let fatContentM5 = '';
	let fatContentObservation = '';
	let sngM1 = '';
	let sngM2 = '';
	let sngM3 = '';
	let sngM4 = '';
	let sngM5 = '';
	let sngObservation = '';
	let titratableAcidityM1 = '';
	let titratableAcidityM2 = '';
	let titratableAcidityM3 = '';
	let titratableAcidityM4 = '';
	let titratableAcidityM5 = '';
	let titratableAcidityObservation = '';
	let phM1 = '';
	let phM2 = '';
	let phM3 = '';
	let phM4 = '';
	let phM5 = '';
	let phObservation = '';
	let phTemperatureM1 = '';
	let phTemperatureM2 = '';
	let phTemperatureM3 = '';
	let phTemperatureM4 = '';
	let phTemperatureM5 = '';
	let phTemperatureObservation = '';
	let colorM1 = '';
	let colorM2 = '';
	let colorM3 = '';
	let colorM4 = '';
	let colorM5 = '';
	let colorObservation = '';
	let smellM1 = '';
	let smellM2 = '';
	let smellM3 = '';
	let smellM4 = '';
	let smellM5 = '';
	let smellObservation = '';
	let tasteM1 = '';
	let tasteM2 = '';
	let tasteM3 = '';
	let tasteM4 = '';
	let tasteM5 = '';
	let tasteObservation = '';
	let appearanceM1 = '';
	let appearanceM2 = '';
	let appearanceM3 = '';
	let appearanceM4 = '';
	let appearanceM5 = '';
	let appearanceObservation = '';
	let bacteriologicalQualityM1 = '';
	let bacteriologicalQualityM2 = '';
	let bacteriologicalQualityM3 = '';
	let bacteriologicalQualityM4 = '';
	let bacteriologicalQualityM5 = '';
	let coliformCountM1 = '';
	let coliformCountM2 = '';
	let coliformCountM3 = '';
	let coliformCountM4 = '';
	let coliformCountM5 = '';
	let fecalColiformCountM1 = '';
	let fecalColiformCountM2 = '';
	let fecalColiformCountM3 = '';
	let fecalColiformCountM4 = '';
	let fecalColiformCountM5 = '';
	let eColiPresenceM1 = '';
	let eColiPresenceM2 = '';
	let eColiPresenceM3 = '';
	let eColiPresenceM4 = '';
	let eColiPresenceM5 = '';
	let moldYeastCountM1 = '';
	let moldYeastCountM2 = '';
	let moldYeastCountM3 = '';
	let moldYeastCountM4 = '';
	let moldYeastCountM5 = '';

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
		const formData = {
			date,
			analysisDate,
			sampleNumber1,
			productionDate1,
			expirationDate1,
			samplingTime1,
			productTemperature1,
			coldChamberTemperature1,
			netContent1,
			sampleNumber2,
			productionDate2,
			expirationDate2,
			samplingTime2,
			productTemperature2,
			coldChamberTemperature2,
			netContent2,
			sampleNumber3,
			productionDate3,
			expirationDate3,
			samplingTime3,
			productTemperature3,
			coldChamberTemperature3,
			netContent3,
			sampleNumber4,
			productionDate4,
			expirationDate4,
			samplingTime4,
			productTemperature4,
			coldChamberTemperature4,
			netContent4,
			sampleNumber5,
			productionDate5,
			expirationDate5,
			samplingTime5,
			productTemperature5,
			coldChamberTemperature5,
			netContent5,
			fatContentM1,
			fatContentM2,
			fatContentM3,
			fatContentM4,
			fatContentM5,
			fatContentObservation,
			sngM1,
			sngM2,
			sngM3,
			sngM4,
			sngM5,
			sngObservation,
			titratableAcidityM1,
			titratableAcidityM2,
			titratableAcidityM3,
			titratableAcidityM4,
			titratableAcidityM5,
			titratableAcidityObservation,
			phM1,
			phM2,
			phM3,
			phM4,
			phM5,
			phObservation,
			phTemperatureM1,
			phTemperatureM2,
			phTemperatureM3,
			phTemperatureM4,
			phTemperatureM5,
			phTemperatureObservation,
			colorM1,
			colorM2,
			colorM3,
			colorM4,
			colorM5,
			colorObservation,
			smellM1,
			smellM2,
			smellM3,
			smellM4,
			smellM5,
			smellObservation,
			tasteM1,
			tasteM2,
			tasteM3,
			tasteM4,
			tasteM5,
			tasteObservation,
			appearanceM1,
			appearanceM2,
			appearanceM3,
			appearanceM4,
			appearanceM5,
			appearanceObservation,
			bacteriologicalQualityM1,
			bacteriologicalQualityM2,
			bacteriologicalQualityM3,
			bacteriologicalQualityM4,
			bacteriologicalQualityM5,
			coliformCountM1,
			coliformCountM2,
			coliformCountM3,
			coliformCountM4,
			coliformCountM5,
			fecalColiformCountM1,
			fecalColiformCountM2,
			fecalColiformCountM3,
			fecalColiformCountM4,
			fecalColiformCountM5,
			eColiPresenceM1,
			eColiPresenceM2,
			eColiPresenceM3,
			eColiPresenceM4,
			eColiPresenceM5,
			moldYeastCountM1,
			moldYeastCountM2,
			moldYeastCountM3,
			moldYeastCountM4,
			moldYeastCountM5
		};

		try {
			const response = await fetch(`/api/yogurt-fruited`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(formData)
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
			const response = await fetch(`/api/yogurt-fruited?startDate=${startDate}&endDate=${endDate}`, {
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
			error.set('Invalid report ID');
			return;
		}

		const token = Registry.auth.getToken();
		if (!token) {
			error = 'No authentication token available.';
			loading = false;
			return;
		}

		console.log('Navigating to report with ID:', reportId, 'Token:', token);
		goto(`/reports-form/report-fruited/${reportId}`);

	}
</script>

<AuthGuard manual={true} forceLogin={true}>
	<div slot="authed" let:user>
		<section class="form-section">
			<h1>Informe de Yogurt Frutado</h1>
			<form on:submit|preventDefault={() => saveForm()}>
				<div class="date-section">
					<div class="form-row">
						<label>Fecha:</label>
						<input type="date" bind:value={date} />
					</div>
					<div class="form-row">
						<label>Fecha de analisis :</label>
						<input type="date" bind:value={analysisDate} />
					</div>
				</div>

				<div class="section">
					<h2>Informacion general</h2>
					<table class="info-general-table">
						<thead>
							<tr>
								<th>N° de Muestra</th>
								<th>Lote de Producción</th>
								<th>Fecha de Elaboración</th>
								<th>Fecha de Vencimiento</th>
								<th>Hora muestreo</th>
								<th>Temperatura del Producto (°C)</th>
								<th>Temperatura Cámara Fría (°C)</th>
								<th>Contenido Neto (g)</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td><input type="text" bind:value={sampleNumber1} /></td>
								<td>Frutilla</td>
								<td><input type="date" bind:value={productionDate1} /></td>
								<td><input type="date" bind:value={expirationDate1} /></td>
								<td><input type="time" bind:value={samplingTime1} /></td>
								<td><input type="number" step="0.1" bind:value={productTemperature1} /></td>
								<td><input type="number" step="0.1" bind:value={coldChamberTemperature1} /></td>
								<td><input type="number" step="0.1" bind:value={netContent1} /></td>
							</tr>
							<tr>
								<td><input type="text" bind:value={sampleNumber2} /></td>
								<td>Durazno</td>
								<td><input type="date" bind:value={productionDate2} /></td>
								<td><input type="date" bind:value={expirationDate2} /></td>
								<td><input type="time" bind:value={samplingTime2} /></td>
								<td><input type="number" step="0.1" bind:value={productTemperature2} /></td>
								<td><input type="number" step="0.1" bind:value={coldChamberTemperature2} /></td>
								<td><input type="number" step="0.1" bind:value={netContent2} /></td>
							</tr>
							<tr>
								<td><input type="text" bind:value={sampleNumber3} /></td>
								<td>Piña</td>
								<td><input type="date" bind:value={productionDate3} /></td>
								<td><input type="date" bind:value={expirationDate3} /></td>
								<td><input type="time" bind:value={samplingTime3} /></td>
								<td><input type="number" step="0.1" bind:value={productTemperature3} /></td>
								<td><input type="number" step="0.1" bind:value={coldChamberTemperature3} /></td>
								<td><input type="number" step="0.1" bind:value={netContent3} /></td>
							</tr>
							<tr>
								<td><input type="text" bind:value={sampleNumber4} /></td>
								<td>Manzana</td>
								<td><input type="date" bind:value={productionDate4} /></td>
								<td><input type="date" bind:value={expirationDate4} /></td>
								<td><input type="time" bind:value={samplingTime4} /></td>
								<td><input type="number" step="0.1" bind:value={productTemperature4} /></td>
								<td><input type="number" step="0.1" bind:value={coldChamberTemperature4} /></td>
								<td><input type="number" step="0.1" bind:value={netContent4} /></td>
							</tr>
							<tr>
								<td><input type="text" bind:value={sampleNumber5} /></td>
								<td>Coco</td>
								<td><input type="date" bind:value={productionDate5} /></td>
								<td><input type="date" bind:value={expirationDate5} /></td>
								<td><input type="time" bind:value={samplingTime5} /></td>
								<td><input type="number" step="0.1" bind:value={productTemperature5} /></td>
								<td><input type="number" step="0.1" bind:value={coldChamberTemperature5} /></td>
								<td><input type="number" step="0.1" bind:value={netContent5} /></td>
							</tr>
						</tbody>
					</table>
				</div>

				<div class="section">
					<h2>Analisis fisicoquimica </h2>
					<table class="results-table">
						<thead>
							<tr>
								<th>Parametro</th>
								<th>Unidad</th>
								<th>M:</th>
								<th>M:</th>
								<th>M:</th>
								<th>M:</th>
								<th>M:</th>
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
								<td><input type="number" step="0.1" bind:value={fatContentM4} /></td>
								<td><input type="number" step="0.1" bind:value={fatContentM5} /></td>
								<td>min 2.5</td>
								<td><input type="text" bind:value={fatContentObservation} /></td>
							</tr>
							<tr>
								<td>S.N.G. (%)</td>
								<td>%</td>
								<td><input type="number" step="0.1" bind:value={sngM1} /></td>
								<td><input type="number" step="0.1" bind:value={sngM2} /></td>
								<td><input type="number" step="0.1" bind:value={sngM3} /></td>
								<td><input type="number" step="0.1" bind:value={sngM4} /></td>
								<td><input type="number" step="0.1" bind:value={sngM5} /></td>
								<td>8.0 - 14.0</td>
								<td><input type="text" bind:value={sngObservation} /></td>
							</tr>
							<tr>
								<td>Acidez Titulable (%)</td>
								<td>%</td>
								<td><input type="number" step="0.01" bind:value={titratableAcidityM1} /></td>
								<td><input type="number" step="0.01" bind:value={titratableAcidityM2} /></td>
								<td><input type="number" step="0.01" bind:value={titratableAcidityM3} /></td>
								<td><input type="number" step="0.01" bind:value={titratableAcidityM4} /></td>
								<td><input type="number" step="0.01" bind:value={titratableAcidityM5} /></td>
								<td>0.6 - 1.5</td>
								<td><input type="text" bind:value={titratableAcidityObservation} /></td>
							</tr>
							<tr>
								<td>Acidez (pH)</td>
								<td>pH</td>
								<td><input type="number" step="0.01" bind:value={phM1} /></td>
								<td><input type="number" step="0.01" bind:value={phM2} /></td>
								<td><input type="number" step="0.01" bind:value={phM3} /></td>
								<td><input type="number" step="0.01" bind:value={phM4} /></td>
								<td><input type="number" step="0.01" bind:value={phM5} /></td>
								<td>4.00 - 4.60</td>
								<td><input type="text" bind:value={phObservation} /></td>
							</tr>
							<tr>
								<td>Temperatura pH (°C)</td>
								<td>°C</td>
								<td><input type="number" step="0.1" bind:value={phTemperatureM1} /></td>
								<td><input type="number" step="0.1" bind:value={phTemperatureM2} /></td>
								<td><input type="number" step="0.1" bind:value={phTemperatureM3} /></td>
								<td><input type="number" step="0.1" bind:value={phTemperatureM4} /></td>
								<td><input type="number" step="0.1" bind:value={phTemperatureM5} /></td>
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
								<th>M:</th>
								<th>M:</th>
								<th>M:</th>
								<th>M:</th>
								<th>M:</th>
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
								<td><input type="text" bind:value={colorM4} /></td>
								<td><input type="text" bind:value={colorM5} /></td>
								<td><input type="text" bind:value={colorObservation} /></td>
							</tr>
							<tr>
								<td>Olor</td>
								<td>Agradable, característico al Yogurt</td>
								<td><input type="text" bind:value={smellM1} /></td>
								<td><input type="text" bind:value={smellM2} /></td>
								<td><input type="text" bind:value={smellM3} /></td>
								<td><input type="text" bind:value={smellM4} /></td>
								<td><input type="text" bind:value={smellM5} /></td>
								<td><input type="text" bind:value={smellObservation} /></td>
							</tr>
							<tr>
								<td>Sabor</td>
								<td>Fresco, característico al Yogurt</td>
								<td><input type="text" bind:value={tasteM1} /></td>
								<td><input type="text" bind:value={tasteM2} /></td>
								<td><input type="text" bind:value={tasteM3} /></td>
								<td><input type="text" bind:value={tasteM4} /></td>
								<td><input type="text" bind:value={tasteM5} /></td>
								<td><input type="text" bind:value={tasteObservation} /></td>
							</tr>
							<tr>
								<td>Aspecto</td>
								<td>Agradable, lig. Ácido</td>
								<td><input type="text" bind:value={appearanceM1} /></td>
								<td><input type="text" bind:value={appearanceM2} /></td>
								<td><input type="text" bind:value={appearanceM3} /></td>
								<td><input type="text" bind:value={appearanceM4} /></td>
								<td><input type="text" bind:value={appearanceM5} /></td>
								<td><input type="text" bind:value={appearanceObservation} /></td>
							</tr>
						</tbody>
					</table>
				</div>

				<div class="section">
					<h2>Analisis microbiologico </h2>
					<table class="results-table">
						<thead>
							<tr>
								<th>Requisito</th>
								<th>Metodo</th>
								<th>M:</th>
								<th>M:</th>
								<th>M:</th>
								<th>M:</th>
								<th>M:</th>
								<th>Criterio de aceptacion</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>Calidad Bacteriológica</td>
								<td>Análisis</td>
								<td><input type="text" bind:value={bacteriologicalQualityM1} /></td>
								<td><input type="text" bind:value={bacteriologicalQualityM2} /></td>
								<td><input type="text" bind:value={bacteriologicalQualityM3} /></td>
								<td><input type="text" bind:value={bacteriologicalQualityM4} /></td>
								<td><input type="text" bind:value={bacteriologicalQualityM5} /></td>
								<td>S/Contam - Acept</td>
							</tr>
							<tr>
								<td>Recuento Coliformes Totales</td>
								<td>Rcto. en placa</td>
								<td><input type="number" bind:value={coliformCountM1} /></td>
								<td><input type="number" bind:value={coliformCountM2} /></td>
								<td><input type="number" bind:value={coliformCountM3} /></td>
								<td><input type="number" bind:value={coliformCountM4} /></td>
								<td><input type="number" bind:value={coliformCountM5} /></td>
								<td>n=5, m=10, M=100, c=2</td>
							</tr>
							<tr>
								<td>Recuento Coliformes Fecales</td>
								<td>Rcto. en placa</td>
								<td><input type="number" bind:value={fecalColiformCountM1} /></td>
								<td><input type="number" bind:value={fecalColiformCountM2} /></td>
								<td><input type="number" bind:value={fecalColiformCountM3} /></td>
								<td><input type="number" bind:value={fecalColiformCountM4} /></td>
								<td><input type="number" bind:value={fecalColiformCountM5} /></td>
								<td>n=5, m=1, M=10, c=1</td>
							</tr>
							<tr>
								<td>Presencia Escherichia coli</td>
								<td>Ec. Medio</td>
								<td><input type="text" bind:value={eColiPresenceM1} /></td>
								<td><input type="text" bind:value={eColiPresenceM2} /></td>
								<td><input type="text" bind:value={eColiPresenceM3} /></td>
								<td><input type="text" bind:value={eColiPresenceM4} /></td>
								<td><input type="text" bind:value={eColiPresenceM5} /></td>
								<td>ausencia</td>
							</tr>
							<tr>
								<td>Recuento de Mohos y Levaduras</td>
								<td>Rcto. en placa</td>
								<td><input type="number" bind:value={moldYeastCountM1} /></td>
								<td><input type="number" bind:value={moldYeastCountM2} /></td>
								<td><input type="number" bind:value={moldYeastCountM3} /></td>
								<td><input type="number" bind:value={moldYeastCountM4} /></td>
								<td><input type="number" bind:value={moldYeastCountM5} /></td>
								<td>n=5, m=200, M=500, c=2</td>
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
						<label for="startDate" class="block text-lg font-medium">Fecha inicial:</label>
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
					<p>No se encontraron reportes en el rango de fechas.</p>
				{:else}
					<table class="w-full border-collapse">
						<thead>
							<tr>
								<th class="border p-2">N Muestra</th>
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
		<p>Iniciar sesion para ingresar a Diarylab</p>
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
		white-space: nowrap; /* Prevent text wrapping in headers */
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
