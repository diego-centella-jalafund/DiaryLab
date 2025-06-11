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
    const response = await fetch('http://localhost:8080/realms/diarylab/protocol/openid-connect/certs');
    const jwks = await response.json();
    const jwk = jwks.keys.find((key: any) => key.use === 'sig' && key.kty === 'RSA');
    return jwkToPem(jwk);
}

let KEYCLOAK_PUBLIC_KEY: string;
(async () => {
    KEYCLOAK_PUBLIC_KEY = await getPublicKey();
})();


export const GET: RequestHandler = async ({ request, params }) => {
	try {
		const authHeader = request.headers.get('Authorization');
		if (!authHeader?.startsWith('Bearer ')) {
			return json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
		}

		const token = authHeader.replace('Bearer ', '');
		let decodedToken: { sub: string };
		try {
			decodedToken = jwt.verify(token, KEYCLOAK_PUBLIC_KEY || '', {
				algorithms: ['RS256']
			}) as { sub: string };
		} catch (error) {
			console.error('Token verification failed:', error);
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		const userId = sanitizeHtml(decodedToken.sub);
		const reportId = sanitizeHtml(params.id || '');

		const parsedReportId = parseInt(reportId, 10);
		if (isNaN(parsedReportId) || parsedReportId <= 0) {
			return json({ error: 'Invalid report ID' }, { status: 400 });
		}

		const client = await pool.connect();
		try {
			const query = `
				SELECT *
				FROM raw_milk
				WHERE id = $1 AND user_id = $2
			`;
			const result = await client.query(query, [parsedReportId, userId]);

			if (!result.rows.length) {
				return json({ error: 'Report not found' }, { status: 404 });
			}

			const row = result.rows[0];
			const report = {
				id: row.id,
				date: row.date,
				userId: row.user_id,
				analysisDate: row.analysis_date,
				sampleNumber: {
					evening: row.evening_sample_number,
					earlyMorning: row.early_morning_sample_number,
					gmp2: row.gmp2_sample_number
				},
				samplingTime: {
					evening: row.evening_sampling_time,
					earlyMorning: row.early_morning_sampling_time,
					gmp2: row.gmp2_sampling_time
				},
				samplingTemperature: {
					evening: row.evening_sampling_temperature,
					earlyMorning: row.early_morning_sampling_temperature,
					gmp2: row.gmp2_sampling_temperature
				},
				ph20C: {
					evening: row.ph_20c_evening,
					earlyMorning: row.ph_20c_early_morning,
					gmp2: row.ph_20c_gmp2
				},
				temperature: {
					evening: row.evening_temperature,
					earlyMorning: row.early_morning_temperature,
					gmp2: row.gmp2_temperature
				},
				titratableAcidity: {
					evening: row.titratable_acidity_evening,
					earlyMorning: row.titratable_acidity_early_morning,
					gmp2: row.titratable_acidity_gmp2
				},
				density20C: {
					evening: row.density_20c_evening,
					earlyMorning: row.density_20c_early_morning,
					gmp2: row.density_20c_gmp2
				},
				fatContent: {
					evening: row.fat_content_evening,
					earlyMorning: row.fat_content_early_morning,
					gmp2: row.fat_content_gmp2
				},
				nonFatSolids: {
					evening: row.non_fat_solids_evening,
					earlyMorning: row.non_fat_solids_early_morning,
					gmp2: row.non_fat_solids_gmp2
				},
				alcoholTest: {
					evening: row.alcohol_test_evening,
					earlyMorning: row.alcohol_test_early_morning,
					gmp2: row.alcohol_test_gmp2
				},
				tram: {
					evening: row.tram_evening,
					earlyMorning: row.tram_early_morning,
					gmp2: row.tram_gmp2
				},
				createdAt: row.created_at
			};

			return json(report, { status: 200 });
		} finally {
			client.release();
		}
	} catch (error) {
		console.error('Server error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};