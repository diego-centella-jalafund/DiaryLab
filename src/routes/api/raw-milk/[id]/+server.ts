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

export const PUT: RequestHandler = async ({ request, params }) => {
	try {
      const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    let decodedToken: { sub: string };
    try {
      decodedToken = jwt.verify(token, KEYCLOAK_PUBLIC_KEY, { algorithms: ['RS256'] }) as { sub: string };
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

		const data = await request.json();
		if (!data || typeof data !== 'object') {
			return json({ error: 'Invalid request body' }, { status: 400 });
		}

		const sanitizedData = {
			date: sanitizeHtml(data.date || ''),
			analysisDate: sanitizeHtml(data.analysisDate || ''),
			sampleNumber: {
				evening: sanitizeHtml(data.sampleNumber?.evening || ''),
				earlyMorning: sanitizeHtml(data.sampleNumber?.earlyMorning || ''),
				gmp2: sanitizeHtml(data.sampleNumber?.gmp2 || '')
			},
			samplingTime: {
				evening: sanitizeHtml(data.samplingTime?.evening || ''),
				earlyMorning: sanitizeHtml(data.samplingTime?.earlyMorning || ''),
				gmp2: sanitizeHtml(data.samplingTime?.gmp2 || '')
			},
			samplingTemperature: {
				evening: sanitizeHtml(data.samplingTemperature?.evening || ''),
				earlyMorning: sanitizeHtml(data.samplingTemperature?.earlyMorning || ''),
				gmp2: sanitizeHtml(data.samplingTemperature?.gmp2 || '')
			},
			ph20C: {
				evening: sanitizeHtml(data.ph20C?.evening || ''),
				earlyMorning: sanitizeHtml(data.ph20C?.earlyMorning || ''),
				gmp2: sanitizeHtml(data.ph20C?.gmp2 || '')
			},
			temperature: {
				evening: sanitizeHtml(data.temperature?.evening || ''),
				earlyMorning: sanitizeHtml(data.temperature?.earlyMorning || ''),
				gmp2: sanitizeHtml(data.temperature?.gmp2 || '')
			},
			titratableAcidity: {
				evening: sanitizeHtml(data.titratableAcidity?.evening || ''),
				earlyMorning: sanitizeHtml(data.titratableAcidity?.earlyMorning || ''),
				gmp2: sanitizeHtml(data.titratableAcidity?.gmp2 || '')
			},
			density20C: {
				evening: sanitizeHtml(data.density20C?.evening || ''),
				earlyMorning: sanitizeHtml(data.density20C?.earlyMorning || ''),
				gmp2: sanitizeHtml(data.density20C?.gmp2 || '')
			},
			fatContent: {
				evening: sanitizeHtml(data.fatContent?.evening || ''),
				earlyMorning: sanitizeHtml(data.fatContent?.earlyMorning || ''),
				gmp2: sanitizeHtml(data.fatContent?.gmp2 || '')
			},
			nonFatSolids: {
				evening: sanitizeHtml(data.nonFatSolids?.evening || ''),
				earlyMorning: sanitizeHtml(data.nonFatSolids?.earlyMorning || ''),
				gmp2: sanitizeHtml(data.nonFatSolids?.gmp2 || '')
			},
			alcoholTest: {
				evening: sanitizeHtml(data.alcoholTest?.evening || ''),
				earlyMorning: sanitizeHtml(data.alcoholTest?.earlyMorning || ''),
				gmp2: sanitizeHtml(data.alcoholTest?.gmp2 || '')
			},
			tram: {
				evening: sanitizeHtml(data.tram?.evening || ''),
				earlyMorning: sanitizeHtml(data.tram?.earlyMorning || ''),
				gmp2: sanitizeHtml(data.tram?.gmp2 || '')
			}
		};

		if (!sanitizedData.date || !sanitizedData.analysisDate) {
			return json({ error: 'Date and Analysis Date are required' }, { status: 400 });
		}

		const client = await pool.connect();
		try {
			const query = `
				UPDATE raw_milk
				SET
					date = $1,
					analysis_date = $2,
					evening_sample_number = $3,
					early_morning_sample_number = $4,
					gmp2_sample_number = $5,
					evening_sampling_time = $6,
					early_morning_sampling_time = $7,
					gmp2_sampling_time = $8,
					evening_sampling_temperature = $9,
					early_morning_sampling_temperature = $10,
					gmp2_sampling_temperature = $11,
					ph_20c_evening = $12,
					ph_20c_early_morning = $13,
					ph_20c_gmp2 = $14,
					evening_temperature = $15,
					early_morning_temperature = $16,
					gmp2_temperature = $17,
					titratable_acidity_evening = $18,
					titratable_acidity_early_morning = $19,
					titratable_acidity_gmp2 = $20,
					density_20c_evening = $21,
					density_20c_early_morning = $22,
					density_20c_gmp2 = $23,
					fat_content_evening = $24,
					fat_content_early_morning = $25,
					fat_content_gmp2 = $26,
					non_fat_solids_evening = $27,
					non_fat_solids_early_morning = $28,
					non_fat_solids_gmp2 = $29,
					alcohol_test_evening = $30,
					alcohol_test_early_morning = $31,
					alcohol_test_gmp2 = $32,
					tram_evening = $33,
					tram_early_morning = $34,
					tram_gmp2 = $35
				WHERE id = $36 AND user_id = $37
				RETURNING id
			`;
			const values = [
				sanitizedData.date,
				sanitizedData.analysisDate,
				sanitizedData.sampleNumber.evening,
				sanitizedData.sampleNumber.earlyMorning,
				sanitizedData.sampleNumber.gmp2,
				sanitizedData.samplingTime.evening,
				sanitizedData.samplingTime.earlyMorning,
				sanitizedData.samplingTime.gmp2,
				sanitizedData.samplingTemperature.evening,
				sanitizedData.samplingTemperature.earlyMorning,
				sanitizedData.samplingTemperature.gmp2,
				sanitizedData.ph20C.evening,
				sanitizedData.ph20C.earlyMorning,
				sanitizedData.ph20C.gmp2,
				sanitizedData.temperature.evening,
				sanitizedData.temperature.earlyMorning,
				sanitizedData.temperature.gmp2,
				sanitizedData.titratableAcidity.evening,
				sanitizedData.titratableAcidity.earlyMorning,
				sanitizedData.titratableAcidity.gmp2,
				sanitizedData.density20C.evening,
				sanitizedData.density20C.earlyMorning,
				sanitizedData.density20C.gmp2,
				sanitizedData.fatContent.evening,
				sanitizedData.fatContent.earlyMorning,
				sanitizedData.fatContent.gmp2,
				sanitizedData.nonFatSolids.evening,
				sanitizedData.nonFatSolids.earlyMorning,
				sanitizedData.nonFatSolids.gmp2,
				sanitizedData.alcoholTest.evening,
				sanitizedData.alcoholTest.earlyMorning,
				sanitizedData.alcoholTest.gmp2,
				sanitizedData.tram.evening,
				sanitizedData.tram.earlyMorning,
				sanitizedData.tram.gmp2,
				parsedReportId,
				userId
			];

			const result = await client.query(query, values);
			if (!result.rows.length) {
				return json({ error: 'Report not found or unauthorized' }, { status: 404 });
			}

			return json({ id: result.rows[0].id }, { status: 200 });
		} finally {
			client.release();
		}
	} catch (error) {
		console.error('Server error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ request, params }) => {
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
			const checkQuery = `
				SELECT id
				FROM raw_milk
				WHERE id = $1 AND user_id = $2
				FOR UPDATE
			`;
			const checkResult = await client.query(checkQuery, [parsedReportId, userId]);

			if (!checkResult.rows.length) {
				return json({ error: 'Report not found or unauthorized' }, { status: 404 });
			}

			const deleteQuery = `
				DELETE FROM raw_milk
				WHERE id = $1 AND user_id = $2
				RETURNING id
			`;
			const deleteResult = await client.query(deleteQuery, [parsedReportId, userId]);

			if (deleteResult.rowCount === 0) {
				return json({ error: 'Report deletion failed' }, { status: 500 });
			}

			return json({ message: 'Report deleted successfully', id: parsedReportId }, { status: 200 });
		} catch (error) {
			console.error('Database error during deletion:', error);
			return json({ error: 'Internal server error' }, { status: 500 });
		} finally {
			client.release(); 
		}
	} catch (error) {
		console.error('Unexpected error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};