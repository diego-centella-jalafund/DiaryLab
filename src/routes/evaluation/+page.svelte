<script lang="ts">
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';
    import { Auth } from '$lib/auth/Auth';

    let chartData = [];

    let errorMessage: string | null = null;

  onMount(async () => {
    const auth = new Auth({
      url: 'http://localhost:8080/auth',
      realm: 'diarylab',
      clientId: 'sveltekit',
    });

    try {
      await auth.inBrowserInit();
      const token = auth.getToken();
      if (!token) throw new Error('No authentication token available');

      const response = await fetch('/api/reports/raw-milk', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} - ${response.statusText}`);
      }
      const { data } = await response.json();
      chartData = data;

      const ctx = document.getElementById('phChart') as HTMLCanvasElement;
      if (ctx) {
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: chartData.map((row) => row.date),
            datasets: [
              {
                label: 'titratable acidity (Afternoon)',
                data: chartData.map((row) => row.titratable_acidity.evening),
                borderColor: 'blue',
                fill: false,
              },
              {
                label: 'titratable acidity  (Early morning)',
                data: chartData.map((row) => row.titratable_acidity.earlyMorning),
                borderColor: 'green',
                fill: false,
              },
              {
                label: 'titratable acidity  (GMP 2)',
                data: chartData.map((row) => row.titratable_acidity.gmp2),
                borderColor: 'red',
                fill: false,
              },
            ],
          },
          options: {
            scales: {
              y: {
                suggestedMin: 0.12, 
                suggestedMax: 0.19,
                  title: {
                    display: true,
                      text: 'Titratable Acidity (%)'
                      },
                      ticks: {
                        callback: (value) => value.toFixed(2), 
                      },
              },
            },
          },
        });
      }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error loading chart data:', error);
    }
  });
</script>

<div class="report-section">
  <h1>Sample evaluation report - raw milk</h1>
  {#if errorMessage}
    <p style="color: red;">Error: {errorMessage}</p>
  {:else}
    <div class="chart-container">
      <h2>Titratable Acidity</h2>
      <canvas id="phChart"></canvas>
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
    h1 {
        color: #333;
        text-align: center;
    }
    h2 {
        color: #666;
        font-size: 1.5rem;
    }
</style>