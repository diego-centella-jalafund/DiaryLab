import { json } from '@sveltejs/kit';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function GET() {
    try {
        const { stdout, stderr } = await execPromise('python3 src/routes/api/predict-acidity/prediction-model.py', { cwd: process.cwd() });

        if (stderr) {
            throw new Error(`Error en el script de Python: ${stderr}`);
        }

        const output = stdout.trim();
        if (!output) {
            throw new Error('No se recibió salida del script de Python');
        }

        const predictions = output.split('\n').map(line => {
            const [fecha, acidez] = line.split(', Acidez Titulable Predicha: ');
            if (!fecha || !acidez) {
                throw new Error(`Formato de salida inválido: ${line}`);
            }
            return {
                fecha: fecha.replace('Fecha: ', ''),
                acidez_tituable_predicha: parseFloat(acidez)
            };
        });

        return json({ predictions }, { status: 200 });
    } catch (error) {
        console.error('Error en el endpoint /api/predict-acidity:', error.message);
        return json({ error: error.message }, { status: 500 });
    }
}