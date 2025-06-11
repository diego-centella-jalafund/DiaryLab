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
		} catch (err) {
			console.error('Fetch error:', err);
			error.set(`Error fetching report: ${err.message}`);
		} finally {
			loading.set(false);
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
				<div class="date-section">
					<div class="form-row">
						<label>Date:</label>
						<p>{new Date($report.date).toLocaleDateString()}</p>
					</div>
					<div class="form-row">
						<label>Analysis Date:</label>
						<p>{new Date($report.analysisDate).toLocaleDateString()}</p>
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
								<td>{$report.sampleNumber.evening || '-'}</td>
								<td>{$report.sampleNumber.earlyMorning || '-'}</td>
								<td>{$report.sampleNumber.gmp2 || '-'}</td>
							</tr>
							<tr>
								<td>Sample Hour</td>
								<td>{$report.samplingTime.evening || '-'}</td>
								<td>{$report.samplingTime.earlyMorning || '-'}</td>
								<td>{$report.samplingTime.gmp2 || '-'}</td>
							</tr>
							<tr>
								<td>Sample Temperature °C</td>
								<td>{$report.samplingTemperature.evening || '-'}</td>
								<td>{$report.samplingTemperature.earlyMorning || '-'}</td>
								<td>{$report.samplingTemperature.gmp2 || '-'}</td>
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
								<td>{$report.ph20C.evening || '-'}</td>
								<td>{$report.ph20C.earlyMorning || '-'}</td>
								<td>{$report.ph20C.gmp2 || '-'}</td>
								<td>6.60 to 6.80</td>
								<td>Potentiometric</td>
							</tr>
							<tr>
								<td>Temperature</td>
								<td>°C</td>
								<td>{$report.temperature.evening || '-'}</td>
								<td>{$report.temperature.earlyMorning || '-'}</td>
								<td>{$report.temperature.gmp2 || '-'}</td>
								<td>15 to 25</td>
								<td>Thermometer</td>
							</tr>
							<tr>
								<td>Titratable Acidity</td>
								<td>% Lactic Acid</td>
								<td>{$report.titratableAcidity.evening || '-'}</td>
								<td>{$report.titratableAcidity.earlyMorning || '-'}</td>
								<td>{$report.titratableAcidity.gmp2 || '-'}</td>
								<td>0.13 to 0.18</td>
								<td>Volumetric Method</td>
							</tr>
							<tr>
								<td>Density at 20°C</td>
								<td>g/cm³</td>
								<td>{$report.density20C.evening || '-'}</td>
								<td>{$report.density20C.earlyMorning || '-'}</td>
								<td>{$report.density20C.gmp2 || '-'}</td>
								<td>1.028 to 1.034</td>
								<td>Lactodensimeter</td>
							</tr>
							<tr>
								<td>Fat Matter</td>
								<td>%</td>
								<td>{$report.fatContent.evening || '-'}</td>
								<td>{$report.fatContent.earlyMorning || '-'}</td>
								<td>{$report.fatContent.gmp2 || '-'}</td>
								<td>Min. 3.00</td>
								<td>Gerber Method</td>
							</tr>
							<tr>
								<td>Non-Fat Solids</td>
								<td>%</td>
								<td>{$report.nonFatSolids.evening || '-'}</td>
								<td>{$report.nonFatSolids.earlyMorning || '-'}</td>
								<td>{$report.nonFatSolids.gmp2 || '-'}</td>
								<td>Min. 8.2</td>
								<td>Bucziki's Lactometer</td>
							</tr>
							<tr>
								<td>Alcoholimetry</td>
								<td>-</td>
								<td>{$report.alcoholTest.evening || '-'}</td>
								<td>{$report.alcoholTest.earlyMorning || '-'}</td>
								<td>{$report.alcoholTest.gmp2 || '-'}</td>
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
								<td>{$report.tram.evening || '-'}</td>
								<td>{$report.tram.earlyMorning || '-'}</td>
								<td>{$report.tram.gmp2 || '-'}</td>
								<td>> 1h</td>
								<td>Reductase Test</td>
							</tr>
						</tbody>
					</table>
				</div>
				<button on:click={() => goto('/register/raw-milk')}>Back to Register</button>
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
