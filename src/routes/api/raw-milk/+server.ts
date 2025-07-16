import { json } from '@sveltejs/kit';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import type { RequestHandler } from './$types';
import sanitizeHtml from 'sanitize-html';
import 'dotenv/config';

const connectionString: string = process.env.DATABASE_URL as string;
const sql = neon(connectionString);

async function getPublicKey() {
    try {
        const response = await fetch(`${process.env.KEYCLOAK_URL}/realms/diarylab/protocol/openid-connect/certs`);
        if (!response.ok) throw new Error(`Failed to fetch JWKS: ${response.statusText}`);
        const jwks = await response.json();
        const jwk = jwks.keys.find((key: any) => key.use === 'sig' && key.kty === 'RSA');
        if (!jwk) throw new Error('No signing key found');
        return jwkToPem(jwk);
    } catch (error) {
        console.error('Failed to fetch public key:', error);
        throw error;
    }
}

export const POST: RequestHandler = async ({ request }) => {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        let decodedToken: { sub: string };
        try {
            const publicKey = await getPublicKey();
            decodedToken = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as { sub: string };
        } catch (error) {
            console.error('Token verification failed:', error);
            return json({ error: 'Invalid token', reason: 'token_invalid' }, { status: 401 });
        }

        const userId = sanitizeHtml(decodedToken.sub);
        const formData = await request.json();

        const values = [
            formData.date ? new Date(formData.date) : null,
            formData.analysisDate ? new Date(formData.analysisDate) : null,
            formData.sampleNumber?.evening ? sanitizeHtml(formData.sampleNumber.evening) : null,
            formData.sampleNumber?.earlyMorning ? sanitizeHtml(formData.sampleNumber.earlyMorning) : null,
            formData.sampleNumber?.gmp2 ? sanitizeHtml(formData.sampleNumber.gmp2) : null,
            formData.samplingTime?.evening ? sanitizeHtml(formData.samplingTime.evening) : null,
            formData.samplingTime?.earlyMorning ? sanitizeHtml(formData.samplingTime.earlyMorning) : null,
            formData.samplingTime?.gmp2 ? sanitizeHtml(formData.samplingTime.gmp2) : null,
            formData.samplingTemperature?.evening ? parseFloat(formData.samplingTemperature.evening) : null,
            formData.samplingTemperature?.earlyMorning ? parseFloat(formData.samplingTemperature.earlyMorning) : null,
            formData.samplingTemperature?.gmp2 ? parseFloat(formData.samplingTemperature.gmp2) : null,
            formData.ph20C?.evening ? parseFloat(formData.ph20C.evening) : null,
            formData.ph20C?.earlyMorning ? parseFloat(formData.ph20C.earlyMorning) : null,
            formData.ph20C?.gmp2 ? parseFloat(formData.ph20C.gmp2) : null,
            formData.temperature?.evening ? parseFloat(formData.temperature.evening) : null,
            formData.temperature?.earlyMorning ? parseFloat(formData.temperature.earlyMorning) : null,
            formData.temperature?.gmp2 ? parseFloat(formData.temperature.gmp2) : null,
            formData.titratableAcidity?.evening ? parseFloat(formData.titratableAcidity.evening) : null,
            formData.titratableAcidity?.earlyMorning ? parseFloat(formData.titratableAcidity.earlyMorning) : null,
            formData.titratableAcidity?.gmp2 ? parseFloat(formData.titratableAcidity.gmp2) : null,
            formData.density20C?.evening ? parseFloat(formData.density20C.evening) : null,
            formData.density20C?.earlyMorning ? parseFloat(formData.density20C.earlyMorning) : null,
            formData.density20C?.gmp2 ? parseFloat(formData.density20C.gmp2) : null,
            formData.fatContent?.evening ? parseFloat(formData.fatContent.evening) : null,
            formData.fatContent?.earlyMorning ? parseFloat(formData.fatContent.earlyMorning) : null,
            formData.fatContent?.gmp2 ? parseFloat(formData.fatContent.gmp2) : null,
            formData.nonFatSolids?.evening ? parseFloat(formData.nonFatSolids.evening) : null,
            formData.nonFatSolids?.earlyMorning ? parseFloat(formData.nonFatSolids.earlyMorning) : null,
            formData.nonFatSolids?.gmp2 ? parseFloat(formData.nonFatSolids.gmp2) : null,
            formData.alcoholTest?.evening ? sanitizeHtml(formData.alcoholTest.evening) : null,
            formData.alcoholTest?.earlyMorning ? sanitizeHtml(formData.alcoholTest.earlyMorning) : null,
            formData.alcoholTest?.gmp2 ? sanitizeHtml(formData.alcoholTest.gmp2) : null,
            formData.tram?.evening ? sanitizeHtml(formData.tram.evening) : null,
            formData.tram?.earlyMorning ? sanitizeHtml(formData.tram.earlyMorning) : null,
            formData.tram?.gmp2 ? sanitizeHtml(formData.tram.gmp2) : null,
            userId
        ];

        const result = await sql`
            INSERT INTO diarylab.raw_milk (
                date, analysis_date,
                evening_sample_number, early_morning_sample_number, gmp2_sample_number,
                evening_sampling_time, early_morning_sampling_time, gmp2_sampling_time,
                evening_sampling_temperature, early_morning_sampling_temperature, gmp2_sampling_temperature,
                ph_20c_evening, ph_20c_early_morning, ph_20c_gmp2,
                evening_temperature, early_morning_temperature, gmp2_temperature,
                titratable_acidity_evening, titratable_acidity_early_morning, titratable_acidity_gmp2,
                density_20c_evening, density_20c_early_morning, density_20c_gmp2,
                fat_content_evening, fat_content_early_morning, fat_content_gmp2,
                non_fat_solids_evening, non_fat_solids_early_morning, non_fat_solids_gmp2,
                alcohol_test_evening, alcohol_test_early_morning, alcohol_test_gmp2,
                tram_evening, tram_early_morning, tram_gmp2, user_id
            ) VALUES (
                ${values[0]}, ${values[1]}, ${values[2]}, ${values[3]}, ${values[4]},
                ${values[5]}, ${values[6]}, ${values[7]}, ${values[8]}, ${values[9]},
                ${values[10]}, ${values[11]}, ${values[12]}, ${values[13]}, ${values[14]},
                ${values[15]}, ${values[16]}, ${values[17]}, ${values[18]}, ${values[19]},
                ${values[20]}, ${values[21]}, ${values[22]}, ${values[23]}, ${values[24]},
                ${values[25]}, ${values[26]}, ${values[27]}, ${values[28]}, ${values[29]},
                ${values[30]}, ${values[31]}, ${values[32]}, ${values[33]}, ${values[34]},
                ${values[35]}
            )
            RETURNING id
        `;

        return json({ message: 'Data upload success', id: result[0].id }, { status: 200 });
    } catch (error) {
        console.error('Error uploading data:', error);
        return json({ error: 'Error uploading data', details: error.message }, { status: 500 });
    }
};

export const GET: RequestHandler = async ({ request, url }) => {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        let decodedToken: { sub: string };
        try {
            const publicKey = await getPublicKey();
            decodedToken = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as { sub: string };
        } catch (error) {
            console.error('Token verification failed:', error);
            return json({ error: 'Invalid token' }, { status: 401 });
        }

        const userId = sanitizeHtml(decodedToken.sub);
        const startDate = sanitizeHtml(url.searchParams.get('startDate') || '');
        const endDate = sanitizeHtml(url.searchParams.get('endDate') || '');

        if (!startDate || !endDate) {
            return json({ error: 'Missing startDate or endDate' }, { status: 400 });
        }

        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
            return json({ error: 'Invalid date format' }, { status: 400 });
        }

        const result = await sql`
            SELECT id, date, user_id, analysis_date,
                   evening_sample_number, early_morning_sample_number, gmp2_sample_number
            FROM diarylab.raw_milk
            WHERE user_id = ${userId}
              AND date BETWEEN ${startDateObj} AND ${endDateObj}
            ORDER BY date ASC
        `;

        const reports = result.map((row: any) => ({
            id: row.id,
            date: row.date,
            userId: row.user_id,
            analysisDate: row.analysis_date,
            sampleNumber: {
                evening: row.evening_sample_number,
                earlyMorning: row.early_morning_sample_number,
                gmp2: row.gmp2_sample_number
            }
        }));

        return json({ reports }, { status: 200 });
    } catch (error) {
        console.error('Database query error (reports list):', error);
        return json({ error: 'Failed to fetch reports', details: error.message }, { status: 500 });
    }
};