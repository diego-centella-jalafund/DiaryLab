<script>
    let predictions = [];
    let error = null;
    let loading = true;

    async function fetchPredictions() {
        try {
            const response = await fetch('/api/predict-acidity');
            const data = await response.json();
            if (response.ok) {
                predictions = data.predictions;
            } else {
                error = data.error || 'Error desconocido al obtener las predicciones';
            }
        } catch (err) {
            error = `Error de red: ${err.message}`;
        } finally {
            loading = false;
        }
    }
    fetchPredictions();
</script>

<h1>Reportes de Predicción - Acidez Titulable</h1>

{#if error}
    <p style="color: red;">Error: {error}</p>
{/if}

{#if loading}
    <p>Cargando predicciones...</p>
{:else if predictions.length > 0}
    <table>
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Acidez Titulable Predicha (% Titulacion)</th>
            </tr>
        </thead>
        <tbody>
            {#each predictions as pred}
                <tr>
                    <td>{pred.fecha}</td>
                    <td>{pred.acidez_tituable_predicha}</td>
                </tr>
            {/each}
        </tbody>
    </table>
{:else}
    <p>No se encontraron predicciones.</p>
{/if}

<style>
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
</style>