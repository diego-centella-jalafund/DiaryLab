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
	let formData = {
		date: '',
		analysisDate: '',
		sampleNumber: { evening: '', earlyMorning: '', gmp2: '' },
		samplingTime: { evening: '', earlyMorning: '', gmp2: '' },
		samplingTemperature: { evening: '', earlyMorning: '', gmp2: '' },
		ph20C: { evening: '', earlyMorning: '', gmp2: '' },
		temperature: { evening: '', earlyMorning: '', gmp2: '' },
		titratableAcidity: { evening: '', earlyMorning: '', gmp2: '' },
		density20C: { evening: '', earlyMorning: '', gmp2: '' },
		fatContent: { evening: '', earlyMorning: '', gmp2: '' },
		nonFatSolids: { evening: '', earlyMorning: '', gmp2: '' },
		alcoholTest: { evening: '', earlyMorning: '', gmp2: '' },
		tram: { evening: '', earlyMorning: '', gmp2: '' }
	};
	onMount(async () => {
		const auth = new Auth({
			url: 'http://localhost:8080',
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
			console.log('Token after refresh attempt:', token);
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
			const response = await fetch(`/api/raw-milk/${data.id}`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (!response.ok) {
				const result = await response.text();
				console.error('API error:', result);
				if (response.status === 401 && retryCount < 1) {
					const refreshed = await authInstance.refreshToken();
					if (refreshed) {
						console.log('Retrying fetch after token refresh');
						return fetchReport(retryCount + 1);
					}
				}
				if (response.status === 404) {
					error.set('Report not found');
					return;
				}
				throw new Error(`Failed to fetch data: ${response.status} - ${result}`);
			}

			const result = await response.json();
			console.log('Fetched report:', result);
			report.set(result);
			if (result) {
				formData = {
					date: formatDateForInput(result.date),
					analysisDate: formatDateForInput(result.analysisDate),
					sampleNumber: result.sampleNumber || { evening: '', earlyMorning: '', gmp2: '' },
					samplingTime: {
						evening: formatTimeForInput(result.samplingTime?.evening || ''),
						earlyMorning: formatTimeForInput(result.samplingTime?.earlyMorning || ''),
						gmp2: formatTimeForInput(result.samplingTime?.gmp2 || '')
					},
					samplingTemperature: result.samplingTemperature || {
						evening: '',
						earlyMorning: '',
						gmp2: ''
					},
					ph20C: result.ph20C || { evening: '', earlyMorning: '', gmp2: '' },
					temperature: result.temperature || { evening: '', earlyMorning: '', gmp2: '' },
					titratableAcidity: result.titratableAcidity || {
						evening: '',
						earlyMorning: '',
						gmp2: ''
					},
					density20C: result.density20C || { evening: '', earlyMorning: '', gmp2: '' },
					fatContent: result.fatContent || { evening: '', earlyMorning: '', gmp2: '' },
					nonFatSolids: result.nonFatSolids || { evening: '', earlyMorning: '', gmp2: '' },
					alcoholTest: result.alcoholTest || { evening: '', earlyMorning: '', gmp2: '' },
					tram: result.tram || { evening: '', earlyMorning: '', gmp2: '' }
				};
			}
		} catch (err) {
			console.error('Fetch error:', err);
			error.set(`Error fetching report: ${err.message}`);
		} finally {
			loading.set(false);
		}
	}
	
	async function saveReport(event: Event, retryCount = 0) {
		event.preventDefault(); 

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

		console.log('Token before refresh:', token);

		try {
			const refreshed = await authInstance.refreshToken();
			if (!refreshed) {
				console.warn('Token refresh failed');
				if (retryCount < 1) {
					const refreshedAgain = await authInstance.refreshToken();
					if (refreshedAgain) {
						token = authInstance.getToken();
						console.log('Token after second refresh:', token);
					} 
				} else {
					throw new Error('Token refresh failed after retry');
				}
			}
			token = authInstance.getToken();
			if (!token) {
				console.error('No token available after refresh');
				throw new Error('Failed to obtain token after refresh');
			}
			console.log('Token after refresh:', token);
		} catch (error) {
			console.error('Error during token refresh:', error.message || error);
			alert('Authentication error. Redirecting to login...');
			await authInstance.login({ redirectUri: window.location.href });
			return;
		}

		try {
			const response = await fetch(`/api/raw-milk/${data.id}`, {
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(formData)
			});

			if (response.ok) {
				const result = await response.json();
				console.log('Data uploaded successfully:', result);
				alert(`Report updated successfully!${result.id ? ` ID ${result.id}` : ''}`);
				await fetchReport(); 
			} else {
				const result = await response.json();
				console.error('API response:', result);
				if (response.status === 401 && result.reason === 'token_invalid' && retryCount < 1) {
					const refreshed = await authInstance.refreshToken();
					if (refreshed) {
						return saveReport(event, retryCount + 1);
					} 
				}
				throw new Error(
					`Failed to upload data: ${response.status} - ${result.message || result.error || response.statusText}`
				);
			}
		} catch (err) {
			console.error('Save error:', err);
			error.set(`Error saving report: ${err.message}`);
		}
	}
</script>

<AuthGuard manual={true} forceLogin={true}>
	<div slot="authed" let:user>
		<section class="form-section">
			<h1>Raw Milk Analysis Report (ID: {data.id})</h1>

			{#if $loading}
				<p>Loading report...</p>
			{:else if $error}
				<p class="text-red-600">{$error}</p>
			{:else if $report && $report.date && $report.sampleNumber && $report.samplingTime && $report.samplingTemperature && $report.ph20C && $report.temperature && $report.titratableAcidity && $report.density20C && $report.fatContent && $report.nonFatSolids && $report.alcoholTest && $report.tram}
				{console.log('Rendering report:', $report)}
				<form on:submit|preventDefault={saveReport}>
					<div class="date-section">
						<div class="form-row">
							<label for="date">Date:</label>
							<input type="date" id="date" bind:value={formData.date} required />
						</div>
						<div class="form-row">
							<label for="analysisDate">Analysis Date:</label>
							<input type="date" id="analysisDate" bind:value={formData.analysisDate} required />
						</div>
					</div>

					<div class="section">
						<h2>General Information</h2>
						<table class="info-general-table">
							<thead>
								<tr>
									<th></th>
									<th>Afternoon</th>
									<th>Morning</th>
									<th>GMP 2</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>N° Sample</td>
									<td><input type="text" bind:value={formData.sampleNumber.evening} /></td>
									<td><input type="text" bind:value={formData.sampleNumber.earlyMorning} /></td>
									<td><input type="text" bind:value={formData.sampleNumber.gmp2} /></td>
								</tr>
								<tr>
									<td>Sample Hour</td>
									<td><input type="time" bind:value={formData.samplingTime.evening} /></td>
									<td><input type="time" bind:value={formData.samplingTime.earlyMorning} /></td>
									<td><input type="time" bind:value={formData.samplingTime.gmp2} /></td>
								</tr>
								<tr>
									<td>Sample Temperature °C</td>
									<td
										><input
											type="number"
											step="0.01"
											bind:value={formData.samplingTemperature.evening}
										/></td
									>
									<td
										><input
											type="number"
											step="0.01"
											bind:value={formData.samplingTemperature.earlyMorning}
										/></td
									>
									<td
										><input
											type="number"
											step="0.01"
											bind:value={formData.samplingTemperature.gmp2}
										/></td
									>
								</tr>
							</tbody>
						</table>
					</div>

					<div class="section">
						<h2>Physicochemical Information</h2>
						<table class="results-table">
							<thead>
								<tr>
									<th>Parameter</th>
									<th>Unit</th>
									<th>Afternoon</th>
									<th>Morning</th>
									<th>GMP 2</th>
									<th>Range</th>
									<th>Test Method</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>pH at 20°C</td>
									<td>pH Unity</td>
									<td><input type="number" step="0.01" bind:value={formData.ph20C.evening} /></td>
									<td
										><input
											type="number"
											step="0.01"
											bind:value={formData.ph20C.earlyMorning}
										/></td
									>
									<td><input type="number" step="0.01" bind:value={formData.ph20C.gmp2} /></td>
									<td>6.60 to 6.80</td>
									<td>Potentiometric</td>
								</tr>
								<tr>
									<td>Temperature</td>
									<td>°C</td>
									<td
										><input
											type="number"
											step="0.01"
											bind:value={formData.temperature.evening}
										/></td
									>
									<td
										><input
											type="number"
											step="0.01"
											bind:value={formData.temperature.earlyMorning}
										/></td
									>
									<td><input type="number" step="0.01" bind:value={formData.temperature.gmp2} /></td
									>
									<td>15 to 25</td>
									<td>Thermometer</td>
								</tr>
								<tr>
									<td>Titratable Acidity</td>
									<td>% Lactic Acid</td>
									<td
										><input
											type="number"
											step="0.01"
											bind:value={formData.titratableAcidity.evening}
										/></td
									>
									<td
										><input
											type="number"
											step="0.01"
											bind:value={formData.titratableAcidity.earlyMorning}
										/></td
									>
									<td
										><input
											type="number"
											step="0.01"
											bind:value={formData.titratableAcidity.gmp2}
										/></td
									>
									<td>0.13 to 0.18</td>
									<td>Volumetric Method</td>
								</tr>
								<tr>
									<td>Density at 20°C</td>
									<td>g/cm³</td>
									<td
										><input
											type="number"
											step="0.001"
											bind:value={formData.density20C.evening}
										/></td
									>
									<td
										><input
											type="number"
											step="0.001"
											bind:value={formData.density20C.earlyMorning}
										/></td
									>
									<td><input type="number" step="0.001" bind:value={formData.density20C.gmp2} /></td
									>
									<td>1.028 to 1.034</td>
									<td>Lactodensimeter</td>
								</tr>
								<tr>
									<td>Fat Matter</td>
									<td>%</td>
									<td
										><input
											type="number"
											step="0.01"
											bind:value={formData.fatContent.evening}
										/></td
									>
									<td
										><input
											type="number"
											step="0.01"
											bind:value={formData.fatContent.earlyMorning}
										/></td
									>
									<td><input type="number" step="0.01" bind:value={formData.fatContent.gmp2} /></td>
									<td>Min. 3.00</td>
									<td>Gerber Method</td>
								</tr>
								<tr>
									<td>Non-Fat Solids</td>
									<td>%</td>
									<td
										><input
											type="number"
											step="0.01"
											bind:value={formData.nonFatSolids.evening}
										/></td
									>
									<td
										><input
											type="number"
											step="0.01"
											bind:value={formData.nonFatSolids.earlyMorning}
										/></td
									>
									<td
										><input type="number" step="0.01" bind:value={formData.nonFatSolids.gmp2} /></td
									>
									<td>Min. 8.2</td>
									<td>Bucziki's Lactometer</td>
								</tr>
								<tr>
									<td>Alcoholimetry</td>
									<td>-</td>
									<td><input type="text" bind:value={formData.alcoholTest.evening} /></td>
									<td><input type="text" bind:value={formData.alcoholTest.earlyMorning} /></td>
									<td><input type="text" bind:value={formData.alcoholTest.gmp2} /></td>
									<td>Negative</td>
									<td>Alcohol Test to 79%</td>
								</tr>
							</tbody>
						</table>
					</div>

					<div class="section">
						<h2>Microbiological Information</h2>
						<table class="results-table">
							<thead>
								<tr>
									<th>Parameter</th>
									<th>Unit</th>
									<th>Afternoon</th>
									<th>Morning</th>
									<th>GMP 2</th>
									<th>Range</th>
									<th>Test Method</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>TRAM (Methylene Reduction Time)</td>
									<td>h</td>
									<td><input type="number" step="0.01" bind:value={formData.tram.evening} /></td>
									<td
										><input type="number" step="0.01" bind:value={formData.tram.earlyMorning} /></td
									>
									<td><input type="number" step="0.01" bind:value={formData.tram.gmp2} /></td>
									<td>> 1h</td>
									<td>Reductase Test</td>
								</tr>
							</tbody>
						</table>
					</div>

					<div class="button-group">
						<button type="submit">Save Report</button>
						<button type="button" on:click={() => goto('/register/raw-milk')}
							>Back to Register</button
						>
					</div>
				</form>
			{:else}
				<p>No report data available.</p>
			{/if}
		</section>
	</div>
	<div slot="not_authed">
		<p>Log in to join DiaryLab</p>
	</div>
</AuthGuard>

<style>
	.form-section {
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
	}
	.date-section {
		display: flex;
		gap: 20px;
		margin-bottom: 20px;
	}
	.form-row {
		display: flex;
		flex-direction: column;
	}
	.section {
		margin-bottom: 30px;
	}
	.info-general-table,
	.results-table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 10px;
	}
	.info-general-table th,
	.info-general-table td,
	.results-table th,
	.results-table td {
		border: 1px solid #e4e2cf;
		padding: 8px;
		text-align: center;
	}
	.info-general-table th,
	.results-table th {
		background-color: #d1b366;
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
</style>
