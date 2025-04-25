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
                error = data.error || 'erro to obtain predictions';
            }
        } catch (err) {
            error = `Error an ocurred: ${err.message}`;
        } finally {
            loading = false;
        }
    }
    fetchPredictions();
</script>

<h1>Prediction Report - Titratable Acidity</h1>

{#if error}
    <p style="color: red;">Error: {error}</p>
{/if}

{#if predictions.length > 0}
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Titratable Acidity Predicted (% Titratable)</th>
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
{:else}
    <p>Predictions not found.</p>
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