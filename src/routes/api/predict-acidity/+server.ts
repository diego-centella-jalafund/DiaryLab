import { json } from '@sveltejs/kit';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function GET() {
    try {
        const { stdout, stderr } = await execPromise('python3 src/routes/api/predict-acidity/prediction-model.py', { cwd: process.cwd() });

        if (stderr) {
            throw new Error(`Error on the Python script: ${stderr}`);
        }

        const output = stdout.trim();
        if (!output) {
            throw new Error('not output for script');
        }

        const predictions = output.split('\n').map(line => {
            const [date, acidity] = line.split(', Titratable Acidity Predicted: ');
            if (!date || !acidity) {
                throw new Error(`invalid format: ${line}`);
            }
            return {
                date: date.replace('Date: ', ''),
                titratable_acidity_predicted: parseFloat(acidity)
            };
        });

        return json({ predictions }, { status: 200 });
    } catch (error) {

        return json({ error: error.message }, { status: 500 });
    }
}