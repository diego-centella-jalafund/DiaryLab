import { json } from '@sveltejs/kit';

export async function GET() {
    try {
        const response = await fetch('https://pyhost-mwbc.onrender.com/predict-acidity', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Microservice error: ${response.status} ${response.statusText}: ${errorText}`);
        }

        const { predictions } = await response.json();

        if (!predictions || !Array.isArray(predictions) || predictions.length === 0) {
            throw new Error('No predictions returned from the microservice');
        }

        const formattedPredictions = predictions.map((pred: any) => {
            if (!pred.date || typeof pred.titratable_acidity_predicted !== 'number') {
                throw new Error(`Invalid prediction format: ${JSON.stringify(pred)}`);
            }
            return {
                date: pred.date,
                titratable_acidity_predicted: pred.titratable_acidity_predicted
            };
        });

        return json({ predictions: formattedPredictions }, { status: 200 });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return json({ error: errorMessage }, { status: 500 });
    }
}