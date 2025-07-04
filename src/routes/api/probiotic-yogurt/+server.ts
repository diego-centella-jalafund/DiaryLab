import { json } from '@sveltejs/kit';
import pkg from 'pg';
const { Pool } = pkg;
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import type { RequestHandler } from './$types';
import sanitizeHtml from 'sanitize-html';
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const pool = new Pool({
    user: process.env.DB_USER || 'user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'midb',
    password: process.env.DB_PASSWORD || 'password',
    port: Number(process.env.DB_PORT) || 5439,
    options: process.env.DB_OPTIONS || '-c search_path=diarylab,public',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});
const connectionString: string = process.env.DATABASE_URL as string;
const sql = neon(connectionString);
(async () => {
	try {
        const response = await sql`SELECT version()`;
        const { version } = response[0];
		const client = await pool.connect();
		console.log('Database connected successfully');
		client.release();
         return {
            version,
        };
	} catch (error) {
		console.error('Database connection failed:', error);
	}
})();
async function getPublicKey() {
	const response = await fetch(`${process.env.KEYCLOAK_URL}/realms/diarylab/protocol/openid-connect/certs`);

	const jwks = await response.json();
	const jwk = jwks.keys.find((key: any) => key.use === 'sig' && key.kty === 'RSA');
	return jwkToPem(jwk);
}

let KEYCLOAK_PUBLIC_KEY: string;
(async () => {
	KEYCLOAK_PUBLIC_KEY = await getPublicKey();
})();

export const POST: RequestHandler = async ({ request }) => {
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
            INSERT INTO probiotic_yogurt (
                date, analysis_date,
                sample_number1, lot1, flavor1, production_date1, expiration_date1,
                production_temperature1, cold_chamber_temperature1, sampling_time1, net_content1,
                sample_number2, lot2, flavor2, production_date2, expiration_date2,
                production_temperature2, cold_chamber_temperature2, sampling_time2, net_content2,
                sample_number3, lot3, flavor3, production_date3, expiration_date3,
                production_temperature3, cold_chamber_temperature3, sampling_time3, net_content3,
                fat_content_m1, fat_content_m2, fat_content_m3, fat_content_observation,
                sng_m1, sng_m2, sng_m3, sng_observation,
                titratable_acidity_m1, titratable_acidity_m2, titratable_acidity_m3, titratable_acidity_observation,
                ph_m1, ph_m2, ph_m3, ph_observation,
                ph_temperature_m1, ph_temperature_m2, ph_temperature_m3, ph_temperature_observation,
                color_m1, color_m2, color_m3, color_observation,
                smell_m1, smell_m2, smell_m3, smell_observation,
                taste_m1, taste_m2, taste_m3, taste_observation,
                appearance_m1, appearance_m2, appearance_m3, appearance_observation,
                probiotic_count_m1, probiotic_count_m2, probiotic_count_m3,
                coliform_count_m1, coliform_count_m2, coliform_count_m3,
                fecal_coliform_count_m1, fecal_coliform_count_m2, fecal_coliform_count_m3, 
                e_coli_presence_m1, e_coli_presence_m2, e_coli_presence_m3,
                mold_yeast_count_m1, mold_yeast_count_m2, mold_yeast_count_m3,
                analysis_time,
                user_id
            ) VALUES (
                $1, $2,
                $3, $4, $5, $6, $7,
                $8, $9, $10, $11,
                $12, $13, $14, $15, $16,
                $17, $18, $19, $20,
                $21, $22, $23, $24, $25,
                $26, $27, $28, $29,
                $30, $31, $32, $33, $34,
                $35, $36, $37, $38,
                $39, $40, $41, $42, $43,
                $44, $45, $46, $47,
                $48, $49, $50, $51, $52, $53,
                $54, $55, $56, $57, $58, $59,
                $60, $61, $62, $63, $64, $65,
                $66, $67, $68, $69, $70, $71,
                $72, $73, $74, $75, $76, $77,
                $78, $79, $80, $81, $82
            )
            RETURNING id;
        `;

        const values = [
            formData.date || null,
            formData.analysisDate || null,
            formData.sampleNumber1 || null,
            formData.lot1 || null,
            formData.flavor1 || null,
            formData.productionDate1 || null,
            formData.expirationDate1 || null,
            formData.productionTemperature1 ? parseFloat(formData.productionTemperature1) : null,
            formData.coldChamberTemperature1 ? parseFloat(formData.coldChamberTemperature1) : null,
            formData.samplingTime1 || null,
            formData.netContent1 ? parseFloat(formData.netContent1) : null,
            formData.sampleNumber2 || null,
            formData.lot2 || null,
            formData.flavor2 || null,
            formData.productionDate2 || null,
            formData.expirationDate2 || null,
            formData.productionTemperature2 ? parseFloat(formData.productionTemperature2) : null,
            formData.coldChamberTemperature2 ? parseFloat(formData.coldChamberTemperature2) : null,
            formData.samplingTime2 || null,
            formData.netContent2 ? parseFloat(formData.netContent2) : null,
            formData.sampleNumber3 || null,
            formData.lot3 || null,
            formData.flavor3 || null,
            formData.productionDate3 || null,
            formData.expirationDate3 || null,
            formData.productionTemperature3 ? parseFloat(formData.productionTemperature3) : null,
            formData.coldChamberTemperature3 ? parseFloat(formData.coldChamberTemperature3) : null,
            formData.samplingTime3 || null,
            formData.netContent3 ? parseFloat(formData.netContent3) : null,
            formData.fatContentM1 ? parseFloat(formData.fatContentM1) : null,
            formData.fatContentM2 ? parseFloat(formData.fatContentM2) : null,
            formData.fatContentM3 ? parseFloat(formData.fatContentM3) : null,
            formData.fatContentObservation || null,
            formData.sngM1 ? parseFloat(formData.sngM1) : null,
            formData.sngM2 ? parseFloat(formData.sngM2) : null,
            formData.sngM3 ? parseFloat(formData.sngM3) : null,
            formData.sngObservation || null,
            formData.titratableAcidityM1 ? parseFloat(formData.titratableAcidityM1) : null,
            formData.titratableAcidityM2 ? parseFloat(formData.titratableAcidityM2) : null,
            formData.titratableAcidityM3 ? parseFloat(formData.titratableAcidityM3) : null,
            formData.titratableAcidityObservation || null,
            formData.phM1 ? parseFloat(formData.phM1) : null,
            formData.phM2 ? parseFloat(formData.phM2) : null,
            formData.phM3 ? parseFloat(formData.phM3) : null,
            formData.phObservation || null,
            formData.phTemperatureM1 ? parseFloat(formData.phTemperatureM1) : null,
            formData.phTemperatureM2 ? parseFloat(formData.phTemperatureM2) : null,
            formData.phTemperatureM3 ? parseFloat(formData.phTemperatureM3) : null,
            formData.phTemperatureObservation || null,
            formData.colorM1 || null,
            formData.colorM2 || null,
            formData.colorM3 || null,
            formData.colorObservation || null,
            formData.smellM1 || null,
            formData.smellM2 || null,
            formData.smellM3 || null,
            formData.smellObservation || null,
            formData.tasteM1 || null,
            formData.tasteM2 || null,
            formData.tasteM3 || null,
            formData.tasteObservation || null,
            formData.appearanceM1 || null,
            formData.appearanceM2 || null,
            formData.appearanceM3 || null,
            formData.appearanceObservation || null,
            formData.probioticCountM1 ? parseFloat(formData.probioticCountM1) : null,
            formData.probioticCountM2 ? parseFloat(formData.probioticCountM2) : null,
            formData.probioticCountM3 ? parseFloat(formData.probioticCountM3) : null,
            formData.coliformCountM1 ? parseInt(formData.coliformCountM1, 10) : null,
            formData.coliformCountM2 ? parseInt(formData.coliformCountM2, 10) : null,
            formData.coliformCountM3 ? parseInt(formData.coliformCountM3, 10) : null,
            formData.fecalColiformCountM1 ? parseInt(formData.fecalColiformCountM1, 10) : null,
            formData.fecalColiformCountM2 ? parseInt(formData.fecalColiformCountM2, 10) : null,
            formData.fecalColiformCountM3 ? parseInt(formData.fecalColiformCountM3, 10) : null,
            formData.eColiPresenceM1 || null,
            formData.eColiPresenceM2 || null,
            formData.eColiPresenceM3 || null,
            formData.moldYeastCountM1 ? parseInt(formData.moldYeastCountM1, 10) : null,
            formData.moldYeastCountM2 ? parseInt(formData.moldYeastCountM2, 10) : null,
            formData.moldYeastCountM3 ? parseInt(formData.moldYeastCountM3, 10) : null,
            formData.analysisTime || null,
            decodedToken.sub
        ];

        const result = await pool.query(query, values);
        return json({ message: 'Data uploaded successfully', id: result.rows[0].id }, { status: 200 });
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
                FROM probiotic_yogurt
                WHERE user_id = $1
                  AND date BETWEEN $2 AND $3
                ORDER BY date ASC
            `;
            const result = await client.query(query, [userId, startDate, endDate]);
            console.log('Query result rows:', result.rows);

            const reports = result.rows.map((row) => ( {
				id: row.id ,
				date: row.date,
				userId: row.user_id,
                sampleNumber1: row.sample_number1
            }));

			return json({reports}, { status: 200 });
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
