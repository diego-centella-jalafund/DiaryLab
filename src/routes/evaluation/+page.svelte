<script lang="ts">
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';

    let chartData = [];

    onMount(async () => {
        const response = await fetch('/api/reports/raw-milk');
        const { data } = await response.json();
        chartData = data;

        const ctx = document.getElementById('phChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.map(row => row.fecha),
                datasets: [
                    {
                        label: 'pH a 20°C (Tarde)',
                        data: chartData.map(row => row.ph_20c.tarde),
                        borderColor: 'blue',
                        fill: false
                    },
                    {
                        label: 'pH a 20°C (Madrugrada)',
                        data: chartData.map(row => row.ph_20c.madrugrada),
                        borderColor: 'green',
                        fill: false
                    },
                    {
                        label: 'pH a 20°C (GMP 2)',
                        data: chartData.map(row => row.ph_20c.gmp2),
                        borderColor: 'red',
                        fill: false
                    }
                ]
            },
            options: {
                scales: {
                    y: {
                        suggestedMin: 6.5,
                        suggestedMax: 7.0
                    }
                }
            }
        });
    });
</script>

<div class="report-section">
    <h1>Reportes de Muestras - Leche Cruda</h1>
    <div class="chart-container">
        <h2>pH a 20°C Over Time</h2>
        <canvas id="phChart"></canvas>
    </div>
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