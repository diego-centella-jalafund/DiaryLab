import { json } from '@sveltejs/kit';
import pkg from 'pg';
const { Pool } = pkg;
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import type { RequestHandler } from './$types';
import sanitizeHtml from 'sanitize-html';

const pool = new Pool({
	user: 'user',
	host: 'localhost',
	database: 'midb',
	password: 'password',
	port: 5439,
	options: '-c search_path=diarylab,public'
});
(async () => {
	try {
		const client = await pool.connect();
		console.log('Database connected successfully');
		client.release();
	} catch (error) {
		console.error('Database connection failed:', error);
	}
})();
async function getPublicKey() {
	const response = await fetch(
		'http://localhost:8080/realms/diarylab/protocol/openid-connect/certs'
	);
	const jwks = await response.json();
	const jwk = jwks.keys.find((key: any) => key.use === 'sig' && key.kty === 'RSA');
	return jwkToPem(jwk);
}

let KEYCLOAK_PUBLIC_KEY: string;
(async () => {
	KEYCLOAK_PUBLIC_KEY = await getPublicKey();
})();

export async function POST({ request }) {
	try {
		const authHeader = request.headers.get('Authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
		}

		const token = authHeader.replace('Bearer ', '');
		let decodedToken;
		try {
			decodedToken = jwt.verify(token, KEYCLOAK_PUBLIC_KEY, { algorithms: ['RS256'] }) as {
				sub: string;
			};
		} catch (error) {
			console.error('Token verification failed:', error);
			return json({ error: 'Invalid token', reason: 'token_invalid' }, { status: 401 });
		}
		const formData = await request.json();
		const query = `
            INSERT INTO raw_milk (
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
                $1, $2,
                $3, $4, $5,
                $6, $7, $8,
                $9, $10, $11,
                $12, $13, $14,
                $15, $16, $17,
                $18, $19, $20,
                $21, $22, $23,
                $24, $25, $26,
                $27, $28, $29,
                $30, $31, $32,
                $33, $34, $35, $36
            )
        `;
		const values = [
			formData.date || null,
			formData.analysisDate || null,
			formData.sampleNumber?.evening || null,
			formData.sampleNumber?.earlyMorning || null,
			formData.sampleNumber?.gmp2 || null,
			formData.samplingTime?.evening || null,
			formData.samplingTime?.earlyMorning || null,
			formData.samplingTime?.gmp2 || null,
			formData.samplingTemperature?.evening
				? parseFloat(formData.samplingTemperature.evening)
				: null,
			formData.samplingTemperature?.earlyMorning
				? parseFloat(formData.samplingTemperature.earlyMorning)
				: null,
			formData.samplingTemperature?.gmp2 ? parseFloat(formData.samplingTemperature.gmp2) : null,
			formData.ph20C?.evening ? parseFloat(formData.ph20C.evening) : null,
			formData.ph20C?.earlyMorning ? parseFloat(formData.ph20C.earlyMorning) : null,
			formData.ph20C?.gmp2 ? parseFloat(formData.ph20C.gmp2) : null,
			formData.temperature?.evening ? parseFloat(formData.temperature.evening) : null,
			formData.temperature?.earlyMorning ? parseFloat(formData.temperature.earlyMorning) : null,
			formData.temperature?.gmp2 ? parseFloat(formData.temperature.gmp2) : null,
			formData.titratableAcidity?.evening ? parseFloat(formData.titratableAcidity.evening) : null,
			formData.titratableAcidity?.earlyMorning
				? parseFloat(formData.titratableAcidity.earlyMorning)
				: null,
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
			formData.alcoholTest?.evening || null,
			formData.alcoholTest?.earlyMorning || null,
			formData.alcoholTest?.gmp2 || null,
			formData.tram?.evening || null,
			formData.tram?.earlyMorning || null,
			formData.tram?.gmp2 || null,
			decodedToken.sub
		];

		await pool.query(query, values);

		return json({ message: 'data upload success' }, { status: 200 });
	} catch (error) {
		return json({ error: 'error to upload data' }, { status: 500 });
	}
}

export const GET: RequestHandler = async ({ request, url }) => {
	try {
		const authHeader = request.headers.get('Authorization');
		if (!authHeader?.startsWith('Bearer ')) {
			return json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
		}

		const token = authHeader.replace('Bearer ', '');
		let decodedToken: { sub: string };
		try {
			decodedToken = jwt.verify(token, KEYCLOAK_PUBLIC_KEY, { algorithms: ['RS256'] }) as {
				sub: string;
			};
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

		const client = await pool.connect();
		try {
			const query = `
          SELECT *
          FROM raw_milk
          WHERE user_id = $1
            AND date BETWEEN $2 AND $3
          ORDER BY date ASC
        `;
			const result = await client.query(query, [userId, startDate, endDate]);
			console.log('Query result rows:', result.rows);

			const reports = result.rows.map((row) => ({
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
			return json({ error: 'Failed to fetch reports' }, { status: 500 });
		} finally {
			client.release();
		}
	} catch (error) {
		console.error('Server error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
