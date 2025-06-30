<script lang="ts">
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';
    import { Auth } from '$lib/auth/Auth';
    import type { User } from '$lib/auth/User';
    import { Registry } from '$lib/auth/Registry';

    let chartData: { sampling_date: string; titratableAcidityM1: number; titratableAcidityM2: number; titratableAcidityM3: number; titratableAcidityM4: number; titratableAcidityM5: number }[] = [];
    let errorMessage: string | null = null;
    let authInstance: Auth | null = null;
    let chartInstance1: Chart | null = null;
    let chartInstance2: Chart | null = null;
    let chartInstance3: Chart | null = null;
    let chartInstance4: Chart | null = null;
    let chartInstance5: Chart | null = null;
    let chartInstance6: Chart | null = null;
    let startDate: string = '2025-01-01';
    let endDate: string = '2025-06-01';
    let user: User | null = null;

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

    async function fetchDataRawMilk(retryCount = 0) {
        if (!user) return;

		loading = true;
		error = null;

		let token =  Registry.auth.getToken();
		if (!token) {
			error = 'No authentication token available.';
			loading = false;
			return;
		}
        try {
            const response = await fetch(`/api/reports/report-samples/raw-milk?startDate=${startDate}&endDate=${endDate}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                credentials: 'include',
            });

            if (!response.ok) {
                const text = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(text);
                } catch (e) {
                    errorData = { error: text };
                }

                if (response.status === 401 && errorData.reason === 'token_expired' && retryCount < 1) {
                    const refreshed = await  Registry.auth.refreshToken();
                    if (refreshed) {
                        return fetchDataRawMilk(retryCount + 1);
                    } else {
                        console.warn('Token refresh failed on retry, redirecting to login');
                        await  Registry.auth.login({ redirectUri: window.location.href });
                        return;
                    }
                }
                throw new Error(`Failed to fetch data: ${response.status} - ${errorData.error || text}`);
            }

            const { data } = await response.json();
            if (!data) throw new Error('No data returned from server');
            chartData = data;

            if (chartInstance1) {
                chartInstance1.destroy();
            }

            const ctx = document.getElementById('phChart1') as HTMLCanvasElement;
            if (ctx) {
                chartInstance1 = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: chartData.map((row) => row.date),
                        datasets: [
                            {
                                label: 'Acidez Titulable Tarde',
                                data: chartData.map((row) => row.titratable_acidity.evening || 0),
                                borderColor: 'blue',
                                fill: false,
                            },
                            {
                                label: 'Acidez Titulable Madrugada',
                                data: chartData.map((row) => row.titratable_acidity.earlyMorning || 0),
                                borderColor: 'green',
                                fill: false,
                            },
                            {
                                label: 'Acidez Titulable GMP2',
                                data: chartData.map((row) => row.titratable_acidity.gmp2 || 0),
                                borderColor: 'red',
                                fill: false,
                            }
                       
                        ],
                    },
                    options: {
                        scales: {
                            y: {
                                suggestedMin: 0.12,
                                suggestedMax: 0.19,
                                title: {
                                    display: true,
                                    text: 'Acidez Titulable (%)',
                                },
                                ticks: {
                                    callback: (value) => (typeof value === 'number' ? value.toFixed(2) : value),
                                },
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Fecha',
                                },
                            },
                        },
                        responsive: true,
                        maintainAspectRatio: false,
                    },
                });
            }
        } catch (error) {
            errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('Error loading chart data:', error);
        }
    }

    async function fetchDataYogurtFruited(retryCount = 0) {
        if (!user) return;

		loading = true;
		error = null;

		let token =  Registry.auth.getToken();
		if (!token) {
			error = 'No authentication token available.';
			loading = false;
			return;
		}
        try {
            const response = await fetch(`/api/reports/report-samples/yogurt-fruited?startDate=${startDate}&endDate=${endDate}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                credentials: 'include',
            });

            if (!response.ok) {
                const text = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(text);
                } catch (e) {
                    errorData = { error: text };
                }

                if (response.status === 401 && errorData.reason === 'token_expired' && retryCount < 1) {
                    const refreshed = await  Registry.auth.refreshToken();
                    if (refreshed) {
                        return fetchDataYogurtFruited(retryCount + 1);
                    } else {
                        console.warn('Token refresh failed on retry, redirecting to login');
                        await  Registry.auth.login({ redirectUri: window.location.href });
                        return;
                    }
                }
                throw new Error(`Failed to fetch data: ${response.status} - ${errorData.error || text}`);
            }

            const { data } = await response.json(); 
            if (!data) throw new Error('No data returned from server');
            chartData = data;

            if (chartInstance2) {
                chartInstance2.destroy();
            }

            const ctx = document.getElementById('phChart2') as HTMLCanvasElement;
            if (ctx) {
                chartInstance2 = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: chartData.map((row) => row.sampling_date),
                        datasets: [
                            {
                                label: 'Acidez Titulable M1',
                                data: chartData.map((row) => row.titratableAcidityM1 || 0),
                                borderColor: 'blue',
                                fill: false,
                            },
                            {
                                label: 'Acidez Titulable M2',
                                data: chartData.map((row) => row.titratableAcidityM2 || 0),
                                borderColor: 'green',
                                fill: false,
                            },
                            {
                                label: 'Acidez Titulable M3',
                                data: chartData.map((row) => row.titratableAcidityM3 || 0),
                                borderColor: 'red',
                                fill: false,
                            },
                            {
                                label: 'Acidez Titulable M4',
                                data: chartData.map((row) => row.titratableAcidityM4 || 0),
                                borderColor: 'orange',
                                fill: false,
                            },
                            {
                                label: 'Acidez Titulable M5',
                                data: chartData.map((row) => row.titratableAcidityM5 || 0),
                                borderColor: 'purple',
                                fill: false,
                            },
                        ],
                    },
                    options: {
                        scales: {
                            y: {
                                suggestedMin: 0.6,
                                suggestedMax: 1.5,
                                title: {
                                    display: true,
                                    text: 'Acidez Titulable (%)',
                                },
                                ticks: {
                                    callback: (value) => (typeof value === 'number' ? value.toFixed(2) : value),
                                },
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Fecha',
                                },
                            },
                        },
                        responsive: true,
                        maintainAspectRatio: false,
                    },
                });
            }
        } catch (error) {
            errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('Error loading chart data:', error);
        }
    }

    async function fetchDataYogurtNoSugar(retryCount = 0) {
        if (!user) return;

		loading = true;
		error = null;

		let token =  Registry.auth.getToken();
		if (!token) {
			error = 'No authentication token available.';
			loading = false;
			return;
		}
        try {
            const response = await fetch(`/api/reports/report-samples/yogurt-no-sugar?startDate=${startDate}&endDate=${endDate}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                credentials: 'include',
            });

            if (!response.ok) {
                const text = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(text);
                } catch (e) {
                    errorData = { error: text };
                }

                if (response.status === 401 && errorData.reason === 'token_expired' && retryCount < 1) {
                    const refreshed = await  Registry.auth.refreshToken();
                    if (refreshed) {
                        return fetchDataYogurtNoSugar(retryCount + 1);
                    } else {
                        console.warn('Token refresh failed on retry, redirecting to login');
                        await  Registry.auth.login({ redirectUri: window.location.href });
                        return;
                    }
                }
                throw new Error(`Failed to fetch data: ${response.status} - ${errorData.error || text}`);
            }

            const { data } = await response.json(); 
            if (!data) throw new Error('No data returned from server');
            chartData = data;

            if (chartInstance3) {
                chartInstance3.destroy();
            }

            const ctx = document.getElementById('phChart3') as HTMLCanvasElement;
            if (ctx) {
                chartInstance3 = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: chartData.map((row) => row.sampling_date),
                        datasets: [
                            {
                                label: 'Acidez Titulable M1',
                                data: chartData.map((row) => row.titratableAcidity || 0),
                                borderColor: 'blue',
                                fill: false,
                            }
                        ],
                    },
                    options: {
                        scales: {
                            y: {
                                suggestedMin: 0.6,
                                suggestedMax: 1.5,
                                title: {
                                    display: true,
                                    text: 'Acidez Titulable (%)',
                                },
                                ticks: {
                                    callback: (value) => (typeof value === 'number' ? value.toFixed(2) : value),
                                },
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Fecha',
                                },
                            },
                        },
                        responsive: true,
                        maintainAspectRatio: false,
                    },
                });
            }
        } catch (error) {
            errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('Error loading chart data:', error);
        }
    }

    async function fetchDataYogurtProbiotic(retryCount = 0) {
        if (!user) return;

		loading = true;
		error = null;

		let token =  Registry.auth.getToken();
		if (!token) {
			error = 'No authentication token available.';
			loading = false;
			return;
		}
        try {
            const response = await fetch(`/api/reports/report-samples/yogurt-probiotic?startDate=${startDate}&endDate=${endDate}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                credentials: 'include',
            });

            if (!response.ok) {
                const text = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(text);
                } catch (e) {
                    errorData = { error: text };
                }

                if (response.status === 401 && errorData.reason === 'token_expired' && retryCount < 1) {
                    const refreshed = await  Registry.auth.refreshToken();
                    if (refreshed) {
                        return fetchDataYogurtProbiotic(retryCount + 1);
                    } else {
                        console.warn('Token refresh failed on retry, redirecting to login');
                        await  Registry.auth.login({ redirectUri: window.location.href });
                        return;
                    }
                }
                throw new Error(`Failed to fetch data: ${response.status} - ${errorData.error || text}`);
            }

            const { data } = await response.json();
            if (!data) throw new Error('No data returned from server');
            chartData = data;

            if (chartInstance4) {
                chartInstance4.destroy();
            }

            const ctx = document.getElementById('phChart4') as HTMLCanvasElement;
            if (ctx) {
                chartInstance4 = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: chartData.map((row) => row.sampling_date),
                        datasets: [
                            {
                                label: 'Acidez Titulable M1',
                                data: chartData.map((row) => row.titratableAcidityM1 || 0),
                                borderColor: 'blue',
                                fill: false,
                            },
                            {
                                label: 'Acidez Titulable M2',
                                data: chartData.map((row) => row.titratableAcidityM2 || 0),
                                borderColor: 'green',
                                fill: false,
                            },
                            {
                                label: 'Acidez Titulable M3',
                                data: chartData.map((row) => row.titratableAcidityM3 || 0),
                                borderColor: 'red',
                                fill: false,
                            }
                        ],
                    },
                    options: {
                        scales: {
                            y: {
                                suggestedMin: 0.6,
                                suggestedMax: 1.5,
                                title: {
                                    display: true,
                                    text: 'Acidez Titulable (%)',
                                },
                                ticks: {
                                    callback: (value) => (typeof value === 'number' ? value.toFixed(2) : value),
                                },
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Fecha',
                                },
                            },
                        },
                        responsive: true,
                        maintainAspectRatio: false,
                    },
                });
            }
        } catch (error) {
            errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('Error loading chart data:', error);
        }
    }

    async function fetchDataSemiCheese(retryCount = 0) {
        if (!user) return;

		loading = true;
		error = null;

		let token =  Registry.auth.getToken();
		if (!token) {
			error = 'No authentication token available.';
			loading = false;
			return;
		}
        try {
            const response = await fetch(`/api/reports/report-samples/semi-cheese?startDate=${startDate}&endDate=${endDate}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                credentials: 'include',
            });

            if (!response.ok) {
                const text = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(text);
                } catch (e) {
                    errorData = { error: text };
                }

                if (response.status === 401 && errorData.reason === 'token_expired' && retryCount < 1) {
                    const refreshed = await  Registry.auth.refreshToken();
                    if (refreshed) {
                        return fetchDataYogurtNoSugar(retryCount + 1);
                    } else {
                        console.warn('Token refresh failed on retry, redirecting to login');
                        await  Registry.auth.login({ redirectUri: window.location.href });
                        return;
                    }
                }
                throw new Error(`Failed to fetch data: ${response.status} - ${errorData.error || text}`);
            }

            const { data } = await response.json(); 
            if (!data) throw new Error('No data returned from server');
            chartData = data;

            if (chartInstance5) {
                chartInstance5.destroy();
            }

            const ctx = document.getElementById('phChart5') as HTMLCanvasElement;
            if (ctx) {
                chartInstance5 = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: chartData.map((row) => row.sampling_date),
                        datasets: [
                            {
                                label: 'Acidez pH ',
                                data: chartData.map((row) => row.titratableAcidity || 0),
                                borderColor: 'blue',
                                fill: false,
                            }
                        ],
                    },
                    options: {
                        scales: {
                            y: {
                                suggestedMin: 4.9,
                                suggestedMax: 5.30,
                                title: {
                                    display: true,
                                    text: 'Acidez Titulable (%)',
                                },
                                ticks: {
                                    callback: (value) => (typeof value === 'number' ? value.toFixed(2) : value),
                                },
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Fecha',
                                },
                            },
                        },
                        responsive: true,
                        maintainAspectRatio: false,
                    },
                });
            }
        } catch (error) {
            errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('Error loading chart data:', error);
        }
    }

    async function fetchDataButter(retryCount = 0) {
        if (!user) return;

		loading = true;
		error = null;

		let token =  Registry.auth.getToken();
		if (!token) {
			error = 'No authentication token available.';
			loading = false;
			return;
		}
        try {
            const response = await fetch(`/api/reports/report-samples/butter?startDate=${startDate}&endDate=${endDate}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                credentials: 'include',
            });

            if (!response.ok) {
                const text = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(text);
                } catch (e) {
                    errorData = { error: text };
                }

                if (response.status === 401 && errorData.reason === 'token_expired' && retryCount < 1) {
                    const refreshed = await  Registry.auth.refreshToken();
                    if (refreshed) {
                        return fetchDataYogurtNoSugar(retryCount + 1);
                    } else {
                        console.warn('Token refresh failed on retry, redirecting to login');
                        await  Registry.auth.login({ redirectUri: window.location.href });
                        return;
                    }
                }
                throw new Error(`Failed to fetch data: ${response.status} - ${errorData.error || text}`);
            }

            const { data } = await response.json(); 
            if (!data) throw new Error('No data returned from server');
            chartData = data;

            if (chartInstance6) {
                chartInstance6.destroy();
            }

            const ctx = document.getElementById('phChart6') as HTMLCanvasElement;
            if (ctx) {
                chartInstance6 = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: chartData.map((row) => row.sampling_date),
                        datasets: [
                            {
                                label: 'Acidez %',
                                data: chartData.map((row) => row.titratableAcidity || 0),
                                borderColor: 'blue',
                                fill: false,
                            }
                        ],
                    },
                    options: {
                        scales: {
                            y: {
                                suggestedMin: 0.1,
                                suggestedMax: 2,
                                title: {
                                    display: true,
                                    text: 'Acidez Titulable (%)',
                                },
                                ticks: {
                                    callback: (value) => (typeof value === 'number' ? value.toFixed(2) : value),
                                },
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Fecha',
                                },
                            },
                        },
                        responsive: true,
                        maintainAspectRatio: false,
                    },
                });
            }
        } catch (error) {
            errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('Error loading chart data:', error);
        }
    }

</script>

<div class="report-section">
  <h1>Reporte de muestra - Leche cruda</h1>
  {#if errorMessage}
    <p style="color: red;">Error: {errorMessage}</p>
  {:else}
   <div class="flex gap-4 mb-4">
      <div>
        <label for="startDate" class="block text-lg font-medium">Fecha inicial:</label>
        <input
          type="date"
          id="startDate"
          bind:value={startDate}
          on:change={fetchDataRawMilk}
          class="mt-1 block border rounded p-2"
        />
      </div>
      <div>
        <label for="endDate" class="block text-lg font-medium">Fecha final:</label>
        <input
          type="date"
          id="endDate"
          bind:value={endDate}
          on:change={fetchDataRawMilk}
          class="mt-1 block border rounded p-2"
        />
      </div>
    </div>
    <div class="chart-container">
      <h2>Acidez Titulable por Fecha</h2>
      <div style="position: relative; height: 400px; width: 100%;">
        <canvas id="phChart1"></canvas>
      </div>
    </div>
    <h1>Reporte de muestra - Yogurt Frutado</h1>
    <div class="flex gap-4 mb-4">
      <div>
        <label for="startDate" class="block text-lg font-medium">Fecha inicial:</label>
        <input
          type="date"
          id="startDate"
          bind:value={startDate}
          on:change={fetchDataYogurtFruited}
          class="mt-1 block border rounded p-2"
        />
      </div>
      <div>
        <label for="endDate" class="block text-lg font-medium">Fecha final:</label>
        <input
          type="date"
          id="endDate"
          bind:value={endDate}
          on:change={fetchDataYogurtFruited}
          class="mt-1 block border rounded p-2"
        />
      </div>
    </div>
    <div class="chart-container">
      <h2>Acidez Titulable por Fecha</h2>
      <div style="position: relative; height: 400px; width: 100%;">
        <canvas id="phChart2"></canvas>
      </div>
    </div>

    <h1>Reporte de muestra - Yogurt Sin Azucar</h1>
    <div class="flex gap-4 mb-4">
      <div>
        <label for="startDate" class="block text-lg font-medium">Fecha inicial:</label>
        <input
          type="date"
          id="startDate"
          bind:value={startDate}
          on:change={fetchDataYogurtNoSugar}
          class="mt-1 block border rounded p-2"
        />
      </div>
      <div>
        <label for="endDate" class="block text-lg font-medium">Fecha final:</label>
        <input
          type="date"
          id="endDate"
          bind:value={endDate}
          on:change={fetchDataYogurtNoSugar}
          class="mt-1 block border rounded p-2"
        />
      </div>
    </div>
    <div class="chart-container">
      <h2>Acidez Titulable por Fecha</h2>
      <div style="position: relative; height: 400px; width: 100%;">
        <canvas id="phChart3"></canvas>
      </div>
    </div>

    <h1>Reporte de muestra - Yogurt Probiotico</h1>
    <div class="flex gap-4 mb-4">
      <div>
        <label for="startDate" class="block text-lg font-medium">Fecha inicial:</label>
        <input
          type="date"
          id="startDate"
          bind:value={startDate}
          on:change={fetchDataYogurtProbiotic}
          class="mt-1 block border rounded p-2"
        />
      </div>
      <div>
        <label for="endDate" class="block text-lg font-medium">Fecha final:</label>
        <input
          type="date"
          id="endDate"
          bind:value={endDate}
          on:change={fetchDataYogurtProbiotic}
          class="mt-1 block border rounded p-2"
        />
      </div>
    </div>
    <div class="chart-container">
      <h2>Acidez Titulable por Fecha</h2>
      <div style="position: relative; height: 400px; width: 100%;">
        <canvas id="phChart4"></canvas>
      </div>
    </div>

    <h1>Reporte de muestra - Queso semi maduro</h1>
    <div class="flex gap-4 mb-4">
      <div>
        <label for="startDate" class="block text-lg font-medium">Fecha inicial:</label>
        <input
          type="date"
          id="startDate"
          bind:value={startDate}
          on:change={fetchDataSemiCheese}
          class="mt-1 block border rounded p-2"
        />
      </div>
      <div>
        <label for="endDate" class="block text-lg font-medium">Fecha final:</label>
        <input
          type="date"
          id="endDate"
          bind:value={endDate}
          on:change={fetchDataSemiCheese}
          class="mt-1 block border rounded p-2"
        />
      </div>
    </div>
    <div class="chart-container">
      <h2>Acidez Titulable por Fecha</h2>
      <div style="position: relative; height: 400px; width: 100%;">
        <canvas id="phChart5"></canvas>
      </div>
    </div>

    <h1>Reporte de muestra -Mantequilla</h1>
    <div class="flex gap-4 mb-4">
      <div>
        <label for="startDate" class="block text-lg font-medium">Fecha inicial:</label>
        <input
          type="date"
          id="startDate"
          bind:value={startDate}
          on:change={fetchDataButter}
          class="mt-1 block border rounded p-2"
        />
      </div>
      <div>
        <label for="endDate" class="block text-lg font-medium">Fecha final:</label>
        <input
          type="date"
          id="endDate"
          bind:value={endDate}
          on:change={fetchDataButter}
          class="mt-1 block border rounded p-2"
        />
      </div>
    </div>
    <div class="chart-container">
      <h2>Acidez Titulable por Fecha</h2>
      <div style="position: relative; height: 400px; width: 100%;">
        <canvas id="phChart6"></canvas>
      </div>
    </div>
  {/if}
</div>

<style>
    .report-section {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
    }
    .chart-container {
        margin-bottom: 2rem;
    }
    .flex {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
    }
    h1 {
        color: #333;
        text-align: center;
    }
    h2 {
        color: #666;
        font-size: 1.5rem;
    }
</style>