<script lang="ts">
    import Chart from 'chart.js/auto';
    import { onMount } from 'svelte';

    let predictions: any[] = [];
    let error: string | null = null;
    let loading: boolean = true;
    let chartInstance: Chart | null = null;

    onMount(async () => {
        try {
            const response = await fetch('/api/predict-acidity');
            const data = await response.json();
            if (response.ok) {
                predictions = data.predictions;
            } else {
                error = data.error || 'Error to obtain predictions';
            }
        } catch (err) {
            error = `Error occurred: ${err.message}`;
        } finally {
            loading = false;

            if (predictions.length > 0 && !error) {
                const ctx = document.getElementById('acidityChart') as HTMLCanvasElement;
                if (ctx && !chartInstance) {
                    chartInstance = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: predictions.map((pred) => pred.date),
                            datasets: [
                                {
                                    label: 'Acidez titulable predicha',
                                    data: predictions.map((pred) => pred.titratable_acidity_predicted),
                                    borderColor: 'purple',
                                    fill: false,
                                    tension: 0.1,
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
                                        text: 'Acidez titulable (%)'
                                    },
                                    ticks: {
                                        callback: (value) => value.toFixed(2),
                                    },
                                },
                                x: {
                                    title: {
                                        display: true,
                                        text: 'Date'
                                    }
                                }
                            },
                            responsive: true,
                            maintainAspectRatio: false,
                        },
                    });
                }
            }
        }
    });
</script>

<h1>Reporte de prediccion - Acidez titulable</h1>

{#if error}
    <p style="color: red;">Error: {error}</p>
{/if}

    <table>
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Acidez titulable predicha (% Titulable)</th>
            </tr>
        </thead>
        <tbody>
            {#each predictions as pred}
                <tr>
                    <td>{pred.date}</td>
                    <td>{pred.titratable_acidity_predicted}</td>
                </tr>
            {/each}
        </tbody>
    </table>
    <div class="chart-container">
        <h2>Acidez titulable predicha (Siguientes 20 Dias)</h2>
        <div style="position: relative; height: 400px; width: 100%;">
            <canvas id="acidityChart"></canvas>
        </div>
    </div>


<style>
    .report-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
    }
    .chart-container {
        margin-top: 2rem;
    }
    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
    }
    th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
    }
    th {
        background-color: #f2f2f2;
    }
    h1 {
        color: #333;
        text-align: center;
    }
    h2 {
        color: #666;
        font-size: 1.5rem;
        text-align: center;
    }
</style>