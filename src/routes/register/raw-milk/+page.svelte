<script lang="ts">
	import { onMount } from 'svelte';
	import { Registry } from '$lib/auth/Registry';
	import AuthGuard from '$lib/auth/AuthGuard.svelte';
	import type { User } from '$lib/auth/User';
	import { goto } from '$app/navigation';

	let user: User | null = null;

	let date = '';
	let analysisDate = '';
	let sampleNumberEvening = '';
	let sampleNumberEarlyMorning = '';
	let sampleNumberGmp2 = '';
	let samplingTimeEvening = '';
	let samplingTimeEarlyMorning = '';
	let samplingTimeGmp2 = '';
	let samplingTemperatureEvening = '';
	let samplingTemperatureEarlyMorning = '';
	let samplingTemperatureGmp2 = '';
	let ph20CEvening = '';
	let ph20CEarlyMorning ='';
	let ph20CGmp2 = '';
	let temperatureEvening = '';
	let temperatureEarlyMorning = '';
	let temperatureGmp2 = '';
	let titratableAcidityEvening = '';
	let titratableAcidityEarlyMorning = '';
	let titratableAcidityGmp2 = '';
	let density20CEvening = '';
	let density20CEarlyMorning = '';
	let density20CGmp2 = '';
	let fatContentEvening = '';
	let fatContentEarlyMorning = '';
	let fatContentGmp2 = '';
	let nonFatSolidsEvening = '';
	let nonFatSolidsEarlyMorning = '';
	let nonFatSolidsGmp2 = 8.6;
	let alcoholTestEvening = '';
	let alcoholTestEarlyMorning = '';
	let alcoholTestGmp2 = '';
	let tramEvening = '';
	let tramEarlyMorning = '';
	let tramGmp2 = '';

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
			sampleNumber: {
				evening: sampleNumberEvening,
				earlyMorning: sampleNumberEarlyMorning,
				gmp2: sampleNumberGmp2
			},
			samplingTime: {
				evening: samplingTimeEvening,
				earlyMorning: samplingTimeEarlyMorning,
				gmp2: samplingTimeGmp2
			},
			samplingTemperature: {
				evening: samplingTemperatureEvening,
				earlyMorning: samplingTemperatureEarlyMorning,
				gmp2: samplingTemperatureGmp2
			},
			ph20C: {
				evening: ph20CEvening,
				earlyMorning: ph20CEarlyMorning,
				gmp2: ph20CGmp2
			},
			temperature: {
				evening: temperatureEvening,
				earlyMorning: temperatureEarlyMorning,
				gmp2: temperatureGmp2
			},
			titratableAcidity: {
				evening: titratableAcidityEvening,
				earlyMorning: titratableAcidityEarlyMorning,
				gmp2: titratableAcidityGmp2
			},
			density20C: {
				evening: density20CEvening,
				earlyMorning: density20CEarlyMorning,
				gmp2: density20CGmp2
			},
			fatContent: {
				evening: fatContentEvening,
				earlyMorning: fatContentEarlyMorning,
				gmp2: fatContentGmp2
			},
			nonFatSolids: {
				evening: nonFatSolidsEvening,
				earlyMorning: nonFatSolidsEarlyMorning,
				gmp2: nonFatSolidsGmp2
			},
			alcoholTest: {
				evening: alcoholTestEvening,
				earlyMorning: alcoholTestEarlyMorning,
				gmp2: alcoholTestGmp2
			},
			tram: {
				evening: tramEvening,
				earlyMorning: tramEarlyMorning,
				gmp2: tramGmp2
			}
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
			const response = await fetch('/api/raw-milk', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
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
		} catch (error) {
			console.error('Error uploading data:', error.message || error);
			alert('Error saving data: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
			const response = await fetch(`/api/raw-milk?startDate=${startDate}&endDate=${endDate}`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`
				}
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
		goto(`/report/${reportId}`);

	}
</script>

<AuthGuard manual={true} forceLogin={true}>
	<div slot="authed" let:user>
		<section class="form-section">
			<h1>Raw milk analisis inform</h1>
			<form on:submit|preventDefault={() => saveForm()}>
				<div class="date-section">
					<div class="form-row">
						<label>Date:</label>
						<input type="date" bind:value={date} />
					</div>
					<div class="form-row">
						<label>Analisis date:</label>
						<input type="date" bind:value={analysisDate} />
					</div>
				</div>

				<div class="section">
					<h2>General information</h2>
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
								<td><input type="text" bind:value={sampleNumberEvening} /></td>
								<td><input type="text" bind:value={sampleNumberEarlyMorning} /></td>
								<td><input type="text" bind:value={sampleNumberGmp2} /></td>
							</tr>
							<tr>
								<td>Sample hour</td>
								<td><input type="time" bind:value={samplingTimeEvening} /></td>
								<td><input type="time" bind:value={samplingTimeEarlyMorning} /></td>
								<td><input type="time" bind:value={samplingTimeGmp2} /></td>
							</tr>
							<tr>
								<td>Sample Temperature °C</td>
								<td><input type="number" step="0.1" bind:value={samplingTemperatureEvening} /></td>
								<td><input type="number" step="0.1" bind:value={samplingTemperatureEarlyMorning} /></td>
								<td><input type="number" step="0.1" bind:value={samplingTemperatureGmp2} /></td>
							</tr>
						</tbody>
					</table>
				</div>

				<div class="section">
					<h2>Physicochemical information</h2>
					<table class="results-table">
						<thead>
							<tr>
								<th>Parameter</th>
								<th>Unit</th>
								<th>Afternoon</th>
								<th>Morning</th>
								<th>GMP 2</th>
								<th>Range</th>
								<th>Test method</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>pH a 20°C</td>
								<td>pH Unity</td>
								<td><input type="number" step="0.01" bind:value={ph20CEvening} /></td>
								<td><input type="number" step="0.01" bind:value={ph20CEarlyMorning} /></td>
								<td><input type="number" step="0.01" bind:value={ph20CGmp2} /></td>
								<td>6.60 a 6.80</td>
								<td>Potentiometric</td>
							</tr>
							<tr>
								<td>Temperature</td>
								<td>°C</td>
								<td><input type="number" step="0.1" bind:value={temperatureEvening} /></td>
								<td><input type="number" step="0.1" bind:value={temperatureEarlyMorning} /></td>
								<td><input type="number" step="0.1" bind:value={temperatureGmp2} /></td>
								<td>15 a 25</td>
								<td>Thermometer</td>
							</tr>
							<tr>
								<td>Titratable acidity</td>
								<td>%Lactic acid</td>
								<td><input type="number" step="0.01" bind:value={titratableAcidityEvening} /></td>
								<td
									><input
										type="number"
										step="0.01"
										bind:value={titratableAcidityEarlyMorning}
									/></td
								>
								<td><input type="number" step="0.01" bind:value={titratableAcidityGmp2} /></td>
								<td>0.13 a 0.18</td>
								<td>Volumetric method</td>
							</tr>
							<tr>
								<td>Densidity to 20°C</td>
								<td>g/cm³</td>
								<td><input type="number" step="0.001" bind:value={density20CEvening} /></td>
								<td><input type="number" step="0.001" bind:value={density20CEarlyMorning} /></td>
								<td><input type="number" step="0.001" bind:value={density20CGmp2} /></td>
								<td>1.028 a 1.034</td>
								<td>Lactodensimeter</td>
							</tr>
							<tr>
								<td>Fat matter</td>
								<td>%</td>
								<td><input type="number" step="0.1" bind:value={fatContentEvening} /></td>
								<td><input type="number" step="0.1" bind:value={fatContentEarlyMorning} /></td>
								<td><input type="number" step="0.1" bind:value={fatContentGmp2} /></td>
								<td>Min. 3.00</td>
								<td>Gerbe Method</td>
							</tr>
							<tr>
								<td>Non-Fat solids</td>
								<td>%</td>
								<td><input type="number" step="0.1" bind:value={nonFatSolidsEvening} /></td>
								<td><input type="number" step="0.1" bind:value={nonFatSolidsEarlyMorning} /></td>
								<td><input type="number" step="0.1" bind:value={nonFatSolidsGmp2} /></td>
								<td>Min. 8.2</td>
								<td>Bucziki's lactometer</td>
							</tr>
							<tr>
								<td>Alcoholimetry</td>
								<td>-</td>
								<td><input type="text" bind:value={alcoholTestEvening} /></td>
								<td><input type="text" bind:value={alcoholTestEarlyMorning} /></td>
								<td><input type="text" bind:value={alcoholTestGmp2} /></td>
								<td>Negative</td>
								<td>Alcohol Test to 79%</td>
							</tr>
						</tbody>
					</table>
				</div>

				<div class="section">
					<h2>Microbiologic information</h2>
					<table class="results-table">
						<thead>
							<tr>
								<th>Parameter</th>
								<th>Unit</th>
								<th>Afternoon</th>
								<th>Morning</th>
								<th>GMP 2</th>
								<th>Range</th>
								<th>Test method</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>TRAM (Methylene reduction time)</td>
								<td>h</td>
								<td><input type="text" bind:value={tramEvening} /></td>
								<td><input type="text" bind:value={tramEarlyMorning} /></td>
								<td><input type="text" bind:value={tramGmp2} /></td>
								<td>> 1h</td>
								<td>Reductase test</td>
							</tr>
						</tbody>
					</table>
				</div>

				<div class="form-actions">
					<button type="submit">Save</button>
				</div>
			</form>
            <div class="mt-6">
                <h2 class="text-xl font-semibold mb-2">View Historical Reports</h2>
                <div class="flex gap-4 mb-4">
                  <div>
                    <label for="startDate" class="block text-lg font-medium">Start Date:</label>
                    <input
                      type="date"
                      id="startDate"
                      bind:value={startDate}
                      on:change={fetchReports}
                      class="mt-1 block border rounded p-2"
                    />
                  </div>
                  <div>
                    <label for="endDate" class="block text-lg font-medium">End Date:</label>
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
                  <p>No reports found for the selected date range.</p>
                {:else}
                  <table class="w-full border-collapse">
                    <thead>
                      <tr>
                        <th class="border p-2">Sample Number</th>
                        <th class="border p-2">Date</th>
                        <th class="border p-2">User</th>
                        <th class="border p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each reports as report}
                        <tr>
                          <td class="border p-2">
                            {#if report.sampleNumber.evening}Evening: {report.sampleNumber.evening}{/if}
                            {#if report.sampleNumber.earlyMorning}<br>Morning: {report.sampleNumber.earlyMorning}{/if}
                            {#if report.sampleNumber.gmp2}<br>GMP 2: {report.sampleNumber.gmp2}{/if}
                          </td>
                          <td class="border p-2">{report.date}</td>
                          <td class="border p-2">{report.userId}</td>
                          <td class="border p-2">
                            <button
                              on:click={() => viewReport(report.id)}
                              class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                            >
                              View
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
