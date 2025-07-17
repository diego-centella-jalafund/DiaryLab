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
	let sample1 = { number: '', productionDate: '', expirationDate: '', samplingTime: '', productTemperature: '', coldChamberTemperature: '', netContent: '' };
	let sample2 = { number: '', productionDate: '', expirationDate: '', samplingTime: '', productTemperature: '', coldChamberTemperature: '', netContent: '' };
	let sample3 = { number: '', productionDate: '', expirationDate: '', samplingTime: '', productTemperature: '', coldChamberTemperature: '', netContent: '' };
	let sample4 = { number: '', productionDate: '', expirationDate: '', samplingTime: '', productTemperature: '', coldChamberTemperature: '', netContent: '' };
	let sample5 = { number: '', productionDate: '', expirationDate: '', samplingTime: '', productTemperature: '', coldChamberTemperature: '', netContent: '' };
	let fatContent = { m1: '', m2: '', m3: '', m4: '', m5: '', observation: '' };
	let sng = { m1: '', m2: '', m3: '', m4: '', m5: '', observation: '' };
	let titratableAcidity = { m1: '', m2: '', m3: '', m4: '', m5: '', observation: '' };
	let ph = { m1: '', m2: '', m3: '', m4: '', m5: '', observation: '' };
	let phTemperature = { m1: '', m2: '', m3: '', m4: '', m5: '', observation: '' };
	let color = { m1: '', m2: '', m3: '', m4: '', m5: '', observation: '' };
	let smell = { m1: '', m2: '', m3: '', m4: '', m5: '', observation: '' };
	let taste = { m1: '', m2: '', m3: '', m4: '', m5: '', observation: '' };
	let appearance = { m1: '', m2: '', m3: '', m4: '', m5: '', observation: '' };
	let bacteriologicalQuality = { m1: '', m2: '', m3: '', m4: '', m5: '' };
	let coliformCount = { m1: '', m2: '', m3: '', m4: '', m5: '' };
	let fecalColiformCount = { m1: '', m2: '', m3: '', m4: '', m5: '' };
	let eColiPresence = { m1: '', m2: '', m3: '', m4: '', m5: '' };
	let moldYeastCount = { m1: '', m2: '', m3: '', m4: '', m5: '' };

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
			const response = await fetch(`/api/yogurt-fruited/${data.id}`, {
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
			report.set(result.data);
			if (result.data) {
				date = formatDateForInput(result.data.samplingDate || '');
				analysisDate = formatDateForInput(result.data.analysisDate || '');
				sample1 = {
					number: result.data.samples.sample1.sampleNumber || '',
					productionDate: formatDateForInput(result.data.samples.sample1.productionDate || ''),
					expirationDate: formatDateForInput(result.data.samples.sample1.expirationDate || ''),
					samplingTime: formatTimeForInput(result.data.samples.sample1.samplingTime || ''),
					productTemperature: result.data.samples.sample1.productTemperature || '',
					coldChamberTemperature: result.data.samples.sample1.coldChamberTemperature || '',
					netContent: result.data.samples.sample1.netContent || ''
				};
				sample2 = {
					number: result.data.samples.sample2.sampleNumber || '',
					productionDate: formatDateForInput(result.data.samples.sample2.productionDate || ''),
					expirationDate: formatDateForInput(result.data.samples.sample2.expirationDate || ''),
					samplingTime: formatTimeForInput(result.data.samples.sample2.samplingTime || ''),
					productTemperature: result.data.samples.sample2.productTemperature || '',
					coldChamberTemperature: result.data.samples.sample2.coldChamberTemperature || '',
					netContent: result.data.samples.sample2.netContent || ''
				};
				sample3 = {
					number: result.data.samples.sample3.sampleNumber || '',
					productionDate: formatDateForInput(result.data.samples.sample3.productionDate || ''),
					expirationDate: formatDateForInput(result.data.samples.sample3.expirationDate || ''),
					samplingTime: formatTimeForInput(result.data.samples.sample3.samplingTime || ''),
					productTemperature: result.data.samples.sample3.productTemperature || '',
					coldChamberTemperature: result.data.samples.sample3.coldChamberTemperature || '',
					netContent: result.data.samples.sample3.netContent || ''
				};
				sample4 = {
					number: result.data.samples.sample4.sampleNumber || '',
					productionDate: formatDateForInput(result.data.samples.sample4.productionDate || ''),
					expirationDate: formatDateForInput(result.data.samples.sample4.expirationDate || ''),
					samplingTime: formatTimeForInput(result.data.samples.sample4.samplingTime || ''),
					productTemperature: result.data.samples.sample4.productTemperature || '',
					coldChamberTemperature: result.data.samples.sample4.coldChamberTemperature || '',
					netContent: result.data.samples.sample4.netContent || ''
				};
				sample5 = {
					number: result.data.samples.sample5.sampleNumber || '',
					productionDate: formatDateForInput(result.data.samples.sample5.productionDate || ''),
					expirationDate: formatDateForInput(result.data.samples.sample5.expirationDate || ''),
					samplingTime: formatTimeForInput(result.data.samples.sample5.samplingTime || ''),
					productTemperature: result.data.samples.sample5.productTemperature || '',
					coldChamberTemperature: result.data.samples.sample5.coldChamberTemperature || '',
					netContent: result.data.samples.sample5.netContent || ''
				};
				fatContent = {
					m1: result.data.measurements.fatContent.m1 || '',
					m2: result.data.measurements.fatContent.m2 || '',
					m3: result.data.measurements.fatContent.m3 || '',
					m4: result.data.measurements.fatContent.m4 || '',
					m5: result.data.measurements.fatContent.m5 || '',
					observation: result.data.measurements.fatContent.observation || ''
				};
				sng = {
					m1: result.data.measurements.sng.m1 || '',
					m2: result.data.measurements.sng.m2 || '',
					m3: result.data.measurements.sng.m3 || '',
					m4: result.data.measurements.sng.m4 || '',
					m5: result.data.measurements.sng.m5 || '',
					observation: result.data.measurements.sng.observation || ''
				};
				titratableAcidity = {
					m1: result.data.measurements.titratableAcidity.m1 || '',
					m2: result.data.measurements.titratableAcidity.m2 || '',
					m3: result.data.measurements.titratableAcidity.m3 || '',
					m4: result.data.measurements.titratableAcidity.m4 || '',
					m5: result.data.measurements.titratableAcidity.m5 || '',
					observation: result.data.measurements.titratableAcidity.observation || ''
				};
				ph = {
					m1: result.data.measurements.ph.m1 || '',
					m2: result.data.measurements.ph.m2 || '',
					m3: result.data.measurements.ph.m3 || '',
					m4: result.data.measurements.ph.m4 || '',
					m5: result.data.measurements.ph.m5 || '',
					observation: result.data.measurements.ph.observation || ''
				};
				phTemperature = {
					m1: result.data.measurements.phTemperature.m1 || '',
					m2: result.data.measurements.phTemperature.m2 || '',
					m3: result.data.measurements.phTemperature.m3 || '',
					m4: result.data.measurements.phTemperature.m4 || '',
					m5: result.data.measurements.phTemperature.m5 || '',
					observation: result.data.measurements.phTemperature.observation || ''
				};
				color = {
					m1: result.data.measurements.color.m1 || '',
					m2: result.data.measurements.color.m2 || '',
					m3: result.data.measurements.color.m3 || '',
					m4: result.data.measurements.color.m4 || '',
					m5: result.data.measurements.color.m5 || '',
					observation: result.data.measurements.color.observation || ''
				};
				smell = {
					m1: result.data.measurements.smell.m1 || '',
					m2: result.data.measurements.smell.m2 || '',
					m3: result.data.measurements.smell.m3 || '',
					m4: result.data.measurements.smell.m4 || '',
					m5: result.data.measurements.smell.m5 || '',
					observation: result.data.measurements.smell.observation || ''
				};
				taste = {
					m1: result.data.measurements.taste.m1 || '',
					m2: result.data.measurements.taste.m2 || '',
					m3: result.data.measurements.taste.m3 || '',
					m4: result.data.measurements.taste.m4 || '',
					m5: result.data.measurements.taste.m5 || '',
					observation: result.data.measurements.taste.observation || ''
				};
				appearance = {
					m1: result.data.measurements.appearance.m1 || '',
					m2: result.data.measurements.appearance.m2 || '',
					m3: result.data.measurements.appearance.m3 || '',
					m4: result.data.measurements.appearance.m4 || '',
					m5: result.data.measurements.appearance.m5 || '',
					observation: result.data.measurements.appearance.observation || ''
				};
				bacteriologicalQuality = {
					m1: result.data.measurements.bacteriologicalQuality.m1 || '',
					m2: result.data.measurements.bacteriologicalQuality.m2 || '',
					m3: result.data.measurements.bacteriologicalQuality.m3 || '',
					m4: result.data.measurements.bacteriologicalQuality.m4 || '',
					m5: result.data.measurements.bacteriologicalQuality.m5 || ''
				};
				coliformCount = {
					m1: result.data.measurements.coliformCount.m1 || '',
					m2: result.data.measurements.coliformCount.m2 || '',
					m3: result.data.measurements.coliformCount.m3 || '',
					m4: result.data.measurements.coliformCount.m4 || '',
					m5: result.data.measurements.coliformCount.m5 || ''
				};
				fecalColiformCount = {
					m1: result.data.measurements.fecalColiformCount.m1 || '',
					m2: result.data.measurements.fecalColiformCount.m2 || '',
					m3: result.data.measurements.fecalColiformCount.m3 || '',
					m4: result.data.measurements.fecalColiformCount.m4 || '',
					m5: result.data.measurements.fecalColiformCount.m5 || ''
				};
				eColiPresence = {
					m1: result.data.measurements.eColiPresence.m1 || '',
					m2: result.data.measurements.eColiPresence.m2 || '',
					m3: result.data.measurements.eColiPresence.m3 || '',
					m4: result.data.measurements.eColiPresence.m4 || '',
					m5: result.data.measurements.eColiPresence.m5 || ''
				};
				moldYeastCount = {
					m1: result.data.measurements.moldYeastCount.m1 || '',
					m2: result.data.measurements.moldYeastCount.m2 || '',
					m3: result.data.measurements.moldYeastCount.m3 || '',
					m4: result.data.measurements.moldYeastCount.m4 || '',
					m5: result.data.measurements.moldYeastCount.m5 || ''
				};
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
			sampleNumber1: sample1.number,
			productionDate1: sample1.productionDate,
			expirationDate1: sample1.expirationDate,
			samplingTime1: sample1.samplingTime,
			productTemperature1: parseFloat(sample1.productTemperature) || 0,
			coldChamberTemperature1: parseFloat(sample1.coldChamberTemperature) || 0,
			netContent1: parseFloat(sample1.netContent) || 0,
			sampleNumber2: sample2.number,
			productionDate2: sample2.productionDate,
			expirationDate2: sample2.expirationDate,
			samplingTime2: sample2.samplingTime,
			productTemperature2: parseFloat(sample2.productTemperature) || 0,
			coldChamberTemperature2: parseFloat(sample2.coldChamberTemperature) || 0,
			netContent2: parseFloat(sample2.netContent) || 0,
			sampleNumber3: sample3.number,
			productionDate3: sample3.productionDate,
			expirationDate3: sample3.expirationDate,
			samplingTime3: sample3.samplingTime,
			productTemperature3: parseFloat(sample3.productTemperature) || 0,
			coldChamberTemperature3: parseFloat(sample3.coldChamberTemperature) || 0,
			netContent3: parseFloat(sample3.netContent) || 0,
			sampleNumber4: sample4.number,
			productionDate4: sample4.productionDate,
			expirationDate4: sample4.expirationDate,
			samplingTime4: sample4.samplingTime,
			productTemperature4: parseFloat(sample4.productTemperature) || 0,
			coldChamberTemperature4: parseFloat(sample4.coldChamberTemperature) || 0,
			netContent4: parseFloat(sample4.netContent) || 0,
			sampleNumber5: sample5.number,
			productionDate5: sample5.productionDate,
			expirationDate5: sample5.expirationDate,
			samplingTime5: sample5.samplingTime,
			productTemperature5: parseFloat(sample5.productTemperature) || 0,
			coldChamberTemperature5: parseFloat(sample5.coldChamberTemperature) || 0,
			netContent5: parseFloat(sample5.netContent) || 0,
			fatContentM1: parseFloat(fatContent.m1) || 0,
			fatContentM2: parseFloat(fatContent.m2) || 0,
			fatContentM3: parseFloat(fatContent.m3) || 0,
			fatContentM4: parseFloat(fatContent.m4) || 0,
			fatContentM5: parseFloat(fatContent.m5) || 0,
			fatContentObservation: fatContent.observation || '',
			sngM1: parseFloat(sng.m1) || 0,
			sngM2: parseFloat(sng.m2) || 0,
			sngM3: parseFloat(sng.m3) || 0,
			sngM4: parseFloat(sng.m4) || 0,
			sngM5: parseFloat(sng.m5) || 0,
			sngObservation: sng.observation || '',
			titratableAcidityM1: parseFloat(titratableAcidity.m1) || 0,
			titratableAcidityM2: parseFloat(titratableAcidity.m2) || 0,
			titratableAcidityM3: parseFloat(titratableAcidity.m3) || 0,
			titratableAcidityM4: parseFloat(titratableAcidity.m4) || 0,
			titratableAcidityM5: parseFloat(titratableAcidity.m5) || 0,
			titratableAcidityObservation: titratableAcidity.observation || '',
			phM1: parseFloat(ph.m1) || 0,
			phM2: parseFloat(ph.m2) || 0,
			phM3: parseFloat(ph.m3) || 0,
			phM4: parseFloat(ph.m4) || 0,
			phM5: parseFloat(ph.m5) || 0,
			phObservation: ph.observation || '',
			phTemperatureM1: parseFloat(phTemperature.m1) || 0,
			phTemperatureM2: parseFloat(phTemperature.m2) || 0,
			phTemperatureM3: parseFloat(phTemperature.m3) || 0,
			phTemperatureM4: parseFloat(phTemperature.m4) || 0,
			phTemperatureM5: parseFloat(phTemperature.m5) || 0,
			phTemperatureObservation: phTemperature.observation || '',
			colorM1: color.m1 || '',
			colorM2: color.m2 || '',
			colorM3: color.m3 || '',
			colorM4: color.m4 || '',
			colorM5: color.m5 || '',
			colorObservation: color.observation || '',
			smellM1: smell.m1 || '',
			smellM2: smell.m2 || '',
			smellM3: smell.m3 || '',
			smellM4: smell.m4 || '',
			smellM5: smell.m5 || '',
			smellObservation: smell.observation || '',
			tasteM1: taste.m1 || '',
			tasteM2: taste.m2 || '',
			tasteM3: taste.m3 || '',
			tasteM4: taste.m4 || '',
			tasteM5: taste.m5 || '',
			tasteObservation: taste.observation || '',
			appearanceM1: appearance.m1 || '',
			appearanceM2: appearance.m2 || '',
			appearanceM3: appearance.m3 || '',
			appearanceM4: appearance.m4 || '',
			appearanceM5: appearance.m5 || '',
			appearanceObservation: appearance.observation || '',
			bacteriologicalQualityM1: bacteriologicalQuality.m1 || '',
			bacteriologicalQualityM2: bacteriologicalQuality.m2 || '',
			bacteriologicalQualityM3: bacteriologicalQuality.m3 || '',
			bacteriologicalQualityM4: bacteriologicalQuality.m4 || '',
			bacteriologicalQualityM5: bacteriologicalQuality.m5 || '',
			coliformCountM1: parseFloat(coliformCount.m1) || 0,
			coliformCountM2: parseFloat(coliformCount.m2) || 0,
			coliformCountM3: parseFloat(coliformCount.m3) || 0,
			coliformCountM4: parseFloat(coliformCount.m4) || 0,
			coliformCountM5: parseFloat(coliformCount.m5) || 0,
			fecalColiformCountM1: parseFloat(fecalColiformCount.m1) || 0,
			fecalColiformCountM2: parseFloat(fecalColiformCount.m2) || 0,
			fecalColiformCountM3: parseFloat(fecalColiformCount.m3) || 0,
			fecalColiformCountM4: parseFloat(fecalColiformCount.m4) || 0,
			fecalColiformCountM5: parseFloat(fecalColiformCount.m5) || 0,
			eColiPresenceM1: eColiPresence.m1 || '',
			eColiPresenceM2: eColiPresence.m2 || '',
			eColiPresenceM3: eColiPresence.m3 || '',
			eColiPresenceM4: eColiPresence.m4 || '',
			eColiPresenceM5: eColiPresence.m5 || '',
			moldYeastCountM1: parseFloat(moldYeastCount.m1) || 0,
			moldYeastCountM2: parseFloat(moldYeastCount.m2) || 0,
			moldYeastCountM3: parseFloat(moldYeastCount.m3) || 0,
			moldYeastCountM4: parseFloat(moldYeastCount.m4) || 0,
			moldYeastCountM5: parseFloat(moldYeastCount.m5) || 0
		};

		try {
			const response = await fetch(`/api/yogurt-fruited/${data.id}`, {
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

		async function deleteReport(retryCount=0) {
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
			const response = await fetch(`/api/yogurt-fruited/${data.id}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			});

			if (response.ok) {
				alert('Reporte eliminado con éxito!');
				goto('/register/yogurt-fruity');
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
			<h1>Informe de Yogur Frutado (ID: {data.id})</h1>
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
								<th>Muestra</th>
								<th>N° de Muestra</th>
								<th>Fecha de Elaboración</th>
								<th>Fecha de Vencimiento</th>
								<th>Hora de Muestreo</th>
								<th>Temperatura de Producto (°C)</th>
								<th>Cámara Fría (°C)</th>
								<th>Contenido Neto (g)</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>Muestra 1</td>
								<td><input type="text" bind:value={sample1.number} /></td>
								<td><input type="date" bind:value={sample1.productionDate} /></td>
								<td><input type="date" bind:value={sample1.expirationDate} /></td>
								<td><input type="time" bind:value={sample1.samplingTime} /></td>
								<td><input type="number" step="0.1" bind:value={sample1.productTemperature} /></td>
								<td><input type="number" step="0.1" bind:value={sample1.coldChamberTemperature} /></td>
								<td><input type="number" step="0.1" bind:value={sample1.netContent} /></td>
							</tr>
							<tr>
								<td>Muestra 2</td>
								<td><input type="text" bind:value={sample2.number} /></td>
								<td><input type="date" bind:value={sample2.productionDate} /></td>
								<td><input type="date" bind:value={sample2.expirationDate} /></td>
								<td><input type="time" bind:value={sample2.samplingTime} /></td>
								<td><input type="number" step="0.1" bind:value={sample2.productTemperature} /></td>
								<td><input type="number" step="0.1" bind:value={sample2.coldChamberTemperature} /></td>
								<td><input type="number" step="0.1" bind:value={sample2.netContent} /></td>
							</tr>
							<tr>
								<td>Muestra 3</td>
								<td><input type="text" bind:value={sample3.number} /></td>
								<td><input type="date" bind:value={sample3.productionDate} /></td>
								<td><input type="date" bind:value={sample3.expirationDate} /></td>
								<td><input type="time" bind:value={sample3.samplingTime} /></td>
								<td><input type="number" step="0.1" bind:value={sample3.productTemperature} /></td>
								<td><input type="number" step="0.1" bind:value={sample3.coldChamberTemperature} /></td>
								<td><input type="number" step="0.1" bind:value={sample3.netContent} /></td>
							</tr>
							<tr>
								<td>Muestra 4</td>
								<td><input type="text" bind:value={sample4.number} /></td>
								<td><input type="date" bind:value={sample4.productionDate} /></td>
								<td><input type="date" bind:value={sample4.expirationDate} /></td>
								<td><input type="time" bind:value={sample4.samplingTime} /></td>
								<td><input type="number" step="0.1" bind:value={sample4.productTemperature} /></td>
								<td><input type="number" step="0.1" bind:value={sample4.coldChamberTemperature} /></td>
								<td><input type="number" step="0.1" bind:value={sample4.netContent} /></td>
							</tr>
							<tr>
								<td>Muestra 5</td>
								<td><input type="text" bind:value={sample5.number} /></td>
								<td><input type="date" bind:value={sample5.productionDate} /></td>
								<td><input type="date" bind:value={sample5.expirationDate} /></td>
								<td><input type="time" bind:value={sample5.samplingTime} /></td>
								<td><input type="number" step="0.1" bind:value={sample5.productTemperature} /></td>
								<td><input type="number" step="0.1" bind:value={sample5.coldChamberTemperature} /></td>
								<td><input type="number" step="0.1" bind:value={sample5.netContent} /></td>
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
								<th>Muestra 1</th>
								<th>Muestra 2</th>
								<th>Muestra 3</th>
								<th>Muestra 4</th>
								<th>Muestra 5</th>
								<th>Observación</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>Materia Grasa (%)</td>
								<td>%</td>
								<td><input type="number" step="0.01" bind:value={fatContent.m1} /></td>
								<td><input type="number" step="0.01" bind:value={fatContent.m2} /></td>
								<td><input type="number" step="0.01" bind:value={fatContent.m3} /></td>
								<td><input type="number" step="0.01" bind:value={fatContent.m4} /></td>
								<td><input type="number" step="0.01" bind:value={fatContent.m5} /></td>
								<td><input type="text" bind:value={fatContent.observation} /></td>
							</tr>
							<tr>
								<td>SNG (%)</td>
								<td>%</td>
								<td><input type="number" step="0.01" bind:value={sng.m1} /></td>
								<td><input type="number" step="0.01" bind:value={sng.m2} /></td>
								<td><input type="number" step="0.01" bind:value={sng.m3} /></td>
								<td><input type="number" step="0.01" bind:value={sng.m4} /></td>
								<td><input type="number" step="0.01" bind:value={sng.m5} /></td>
								<td><input type="text" bind:value={sng.observation} /></td>
							</tr>
							<tr>
								<td>Acidez Titulable</td>
								<td>%</td>
								<td><input type="number" step="0.01" bind:value={titratableAcidity.m1} /></td>
								<td><input type="number" step="0.01" bind:value={titratableAcidity.m2} /></td>
								<td><input type="number" step="0.01" bind:value={titratableAcidity.m3} /></td>
								<td><input type="number" step="0.01" bind:value={titratableAcidity.m4} /></td>
								<td><input type="number" step="0.01" bind:value={titratableAcidity.m5} /></td>
								<td><input type="text" bind:value={titratableAcidity.observation} /></td>
							</tr>
							<tr>
								<td>pH</td>
								<td>pH</td>
								<td><input type="number" step="0.01" bind:value={ph.m1} /></td>
								<td><input type="number" step="0.01" bind:value={ph.m2} /></td>
								<td><input type="number" step="0.01" bind:value={ph.m3} /></td>
								<td><input type="number" step="0.01" bind:value={ph.m4} /></td>
								<td><input type="number" step="0.01" bind:value={ph.m5} /></td>
								<td><input type="text" bind:value={ph.observation} /></td>
							</tr>
							<tr>
								<td>Temperatura pH (°C)</td>
								<td>°C</td>
								<td><input type="number" step="0.01" bind:value={phTemperature.m1} /></td>
								<td><input type="number" step="0.01" bind:value={phTemperature.m2} /></td>
								<td><input type="number" step="0.01" bind:value={phTemperature.m3} /></td>
								<td><input type="number" step="0.01" bind:value={phTemperature.m4} /></td>
								<td><input type="number" step="0.01" bind:value={phTemperature.m5} /></td>
								<td><input type="text" bind:value={phTemperature.observation} /></td>
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
								<th>Muestra 1</th>
								<th>Muestra 2</th>
								<th>Muestra 3</th>
								<th>Muestra 4</th>
								<th>Muestra 5</th>
								<th>Observación</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>Color</td>
								<td><input type="text" bind:value={color.m1} /></td>
								<td><input type="text" bind:value={color.m2} /></td>
								<td><input type="text" bind:value={color.m3} /></td>
								<td><input type="text" bind:value={color.m4} /></td>
								<td><input type="text" bind:value={color.m5} /></td>
								<td><input type="text" bind:value={color.observation} /></td>
							</tr>
							<tr>
								<td>Olor</td>
								<td><input type="text" bind:value={smell.m1} /></td>
								<td><input type="text" bind:value={smell.m2} /></td>
								<td><input type="text" bind:value={smell.m3} /></td>
								<td><input type="text" bind:value={smell.m4} /></td>
								<td><input type="text" bind:value={smell.m5} /></td>
								<td><input type="text" bind:value={smell.observation} /></td>
							</tr>
							<tr>
								<td>Sabor</td>
								<td><input type="text" bind:value={taste.m1} /></td>
								<td><input type="text" bind:value={taste.m2} /></td>
								<td><input type="text" bind:value={taste.m3} /></td>
								<td><input type="text" bind:value={taste.m4} /></td>
								<td><input type="text" bind:value={taste.m5} /></td>
								<td><input type="text" bind:value={taste.observation} /></td>
							</tr>
							<tr>
								<td>Aspecto</td>
								<td><input type="text" bind:value={appearance.m1} /></td>
								<td><input type="text" bind:value={appearance.m2} /></td>
								<td><input type="text" bind:value={appearance.m3} /></td>
								<td><input type="text" bind:value={appearance.m4} /></td>
								<td><input type="text" bind:value={appearance.m5} /></td>
								<td><input type="text" bind:value={appearance.observation} /></td>
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
								<th>Muestra 1</th>
								<th>Muestra 2</th>
								<th>Muestra 3</th>
								<th>Muestra 4</th>
								<th>Muestra 5</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>Calidad Bacteriológica</td>
								<td><input type="text" bind:value={bacteriologicalQuality.m1} /></td>
								<td><input type="text" bind:value={bacteriologicalQuality.m2} /></td>
								<td><input type="text" bind:value={bacteriologicalQuality.m3} /></td>
								<td><input type="text" bind:value={bacteriologicalQuality.m4} /></td>
								<td><input type="text" bind:value={bacteriologicalQuality.m5} /></td>
							</tr>
							<tr>
								<td>Recuento de Coliformes (UFC/g)</td>
								<td><input type="number" bind:value={coliformCount.m1} /></td>
								<td><input type="number" bind:value={coliformCount.m2} /></td>
								<td><input type="number" bind:value={coliformCount.m3} /></td>
								<td><input type="number" bind:value={coliformCount.m4} /></td>
								<td><input type="number" bind:value={coliformCount.m5} /></td>
							</tr>
							<tr>
								<td>Recuento de Coliformes Fecales (UFC/g)</td>
								<td><input type="number" bind:value={fecalColiformCount.m1} /></td>
								<td><input type="number" bind:value={fecalColiformCount.m2} /></td>
								<td><input type="number" bind:value={fecalColiformCount.m3} /></td>
								<td><input type="number" bind:value={fecalColiformCount.m4} /></td>
								<td><input type="number" bind:value={fecalColiformCount.m5} /></td>
							</tr>
							<tr>
								<td>Presencia de E. coli</td>
								<td><input type="text" bind:value={eColiPresence.m1} /></td>
								<td><input type="text" bind:value={eColiPresence.m2} /></td>
								<td><input type="text" bind:value={eColiPresence.m3} /></td>
								<td><input type="text" bind:value={eColiPresence.m4} /></td>
								<td><input type="text" bind:value={eColiPresence.m5} /></td>
							</tr>
							<tr>
								<td>Recuento de Mohos y Levaduras (UFC/g)</td>
								<td><input type="number" bind:value={moldYeastCount.m1} /></td>
								<td><input type="number" bind:value={moldYeastCount.m2} /></td>
								<td><input type="number" bind:value={moldYeastCount.m3} /></td>
								<td><input type="number" bind:value={moldYeastCount.m4} /></td>
								<td><input type="number" bind:value={moldYeastCount.m5} /></td>
							</tr>
						</tbody>
					</table>
				</div>

				<div class="form-actions">
					<button type="submit">Guardar</button>
					<button type="button" on:click={() => goto('/register/yogurt-fruity')}>Regresar</button>
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