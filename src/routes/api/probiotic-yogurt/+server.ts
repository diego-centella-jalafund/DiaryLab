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
                sample_number4, lot4, flavor4, production_date4, expiration_date4,
                production_temperature4, cold_chamber_temperature4, sampling_time4, net_content4,
                sample_number5, lot5, flavor5, production_date5, expiration_date5,
                production_temperature5, cold_chamber_temperature5, sampling_time5, net_content5,
                fat_content_m1, fat_content_m2, fat_content_m3, fat_content_m4, fat_content_m5, fat_content_observation,
                sng_m1, sng_m2, sng_m3, sng_m4, sng_m5, sng_observation,
                titratable_acidity_m1, titratable_acidity_m2, titratable_acidity_m3, titratable_acidity_m4, titratable_acidity_m5, titratable_acidity_observation,
                ph_m1, ph_m2, ph_m3, ph_m4, ph_m5, ph_observation,
                ph_temperature_m1, ph_temperature_m2, ph_temperature_m3, ph_temperature_m4, ph_temperature_m5, ph_temperature_observation,
                color_m1, color_m2, color_m3, color_m4, color_m5, color_observation,
                smell_m1, smell_m2, smell_m3, smell_m4, smell_m5, smell_observation,
                taste_m1, taste_m2, taste_m3, taste_m4, taste_m5, taste_observation,
                appearance_m1, appearance_m2, appearance_m3, appearance_m4, appearance_m5, appearance_observation,
                probiotic_count_m1, probiotic_count_m2, probiotic_count_m3, probiotic_count_m4, probiotic_count_m5, probiotic_count_observation,
                coliform_count_m1, coliform_count_m2, coliform_count_m3, coliform_count_m4, coliform_count_m5,
                fecal_coliform_count_m1, fecal_coliform_count_m2, fecal_coliform_count_m3, fecal_coliform_count_m4, fecal_coliform_count_m5,
                e_coli_presence_m1, e_coli_presence_m2, e_coli_presence_m3, e_coli_presence_m4, e_coli_presence_m5,
                mold_yeast_count_m1, mold_yeast_count_m2, mold_yeast_count_m3, mold_yeast_count_m4, mold_yeast_count_m5,
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
                $78, $79, $80, $81, $82, $83,
                $84, $85, $86, $87, $88, $89,
                $90, $91, $92, $93, $94, $95,
                $96, $97, $98, $99, $100, $101,
                $102, $103, $104, $105, $106, $107,
                $108, $109, $110, $111, $112,
                $113, $114, $115, $116, $117,
                $118, $119, $120, $121, $122,
                $123, $124, $125, $126, $127,
                $128,
                $129
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
            formData.sampleNumber4 || null,
            formData.lot4 || null,
            formData.flavor4 || null,
            formData.productionDate4 || null,
            formData.expirationDate4 || null,
            formData.productionTemperature4 ? parseFloat(formData.productionTemperature4) : null,
            formData.coldChamberTemperature4 ? parseFloat(formData.coldChamberTemperature4) : null,
            formData.samplingTime4 || null,
            formData.netContent4 ? parseFloat(formData.netContent4) : null,
            formData.sampleNumber5 || null,
            formData.lot5 || null,
            formData.flavor5 || null,
            formData.productionDate5 || null,
            formData.expirationDate5 || null,
            formData.productionTemperature5 ? parseFloat(formData.productionTemperature5) : null,
            formData.coldChamberTemperature5 ? parseFloat(formData.coldChamberTemperature5) : null,
            formData.samplingTime5 || null,
            formData.netContent5 ? parseFloat(formData.netContent5) : null,
            formData.fatContentM1 ? parseFloat(formData.fatContentM1) : null,
            formData.fatContentM2 ? parseFloat(formData.fatContentM2) : null,
            formData.fatContentM3 ? parseFloat(formData.fatContentM3) : null,
            formData.fatContentM4 ? parseFloat(formData.fatContentM4) : null,
            formData.fatContentM5 ? parseFloat(formData.fatContentM5) : null,
            formData.fatContentObservation || null,
            formData.sngM1 ? parseFloat(formData.sngM1) : null,
            formData.sngM2 ? parseFloat(formData.sngM2) : null,
            formData.sngM3 ? parseFloat(formData.sngM3) : null,
            formData.sngM4 ? parseFloat(formData.sngM4) : null,
            formData.sngM5 ? parseFloat(formData.sngM5) : null,
            formData.sngObservation || null,
            formData.titratableAcidityM1 ? parseFloat(formData.titratableAcidityM1) : null,
            formData.titratableAcidityM2 ? parseFloat(formData.titratableAcidityM2) : null,
            formData.titratableAcidityM3 ? parseFloat(formData.titratableAcidityM3) : null,
            formData.titratableAcidityM4 ? parseFloat(formData.titratableAcidityM4) : null,
            formData.titratableAcidityM5 ? parseFloat(formData.titratableAcidityM5) : null,
            formData.titratableAcidityObservation || null,
            formData.phM1 ? parseFloat(formData.phM1) : null,
            formData.phM2 ? parseFloat(formData.phM2) : null,
            formData.phM3 ? parseFloat(formData.phM3) : null,
            formData.phM4 ? parseFloat(formData.phM4) : null,
            formData.phM5 ? parseFloat(formData.phM5) : null,
            formData.phObservation || null,
            formData.phTemperatureM1 ? parseFloat(formData.phTemperatureM1) : null,
            formData.phTemperatureM2 ? parseFloat(formData.phTemperatureM2) : null,
            formData.phTemperatureM3 ? parseFloat(formData.phTemperatureM3) : null,
            formData.phTemperatureM4 ? parseFloat(formData.phTemperatureM4) : null,
            formData.phTemperatureM5 ? parseFloat(formData.phTemperatureM5) : null,
            formData.phTemperatureObservation || null,
            formData.colorM1 || null,
            formData.colorM2 || null,
            formData.colorM3 || null,
            formData.colorM4 || null,
            formData.colorM5 || null,
            formData.colorObservation || null,
            formData.smellM1 || null,
            formData.smellM2 || null,
            formData.smellM3 || null,
            formData.smellM4 || null,
            formData.smellM5 || null,
            formData.smellObservation || null,
            formData.tasteM1 || null,
            formData.tasteM2 || null,
            formData.tasteM3 || null,
            formData.tasteM4 || null,
            formData.tasteM5 || null,
            formData.tasteObservation || null,
            formData.appearanceM1 || null,
            formData.appearanceM2 || null,
            formData.appearanceM3 || null,
            formData.appearanceM4 || null,
            formData.appearanceM5 || null,
            formData.appearanceObservation || null,
            formData.probioticCountM1 ? parseFloat(formData.probioticCountM1) : null,
            formData.probioticCountM2 ? parseFloat(formData.probioticCountM2) : null,
            formData.probioticCountM3 ? parseFloat(formData.probioticCountM3) : null,
            formData.probioticCountM4 ? parseFloat(formData.probioticCountM4) : null,
            formData.probioticCountM5 ? parseFloat(formData.probioticCountM5) : null,
            formData.probioticCountObservation || null,
            formData.coliformCountM1 ? parseInt(formData.coliformCountM1, 10) : null,
            formData.coliformCountM2 ? parseInt(formData.coliformCountM2, 10) : null,
            formData.coliformCountM3 ? parseInt(formData.coliformCountM3, 10) : null,
            formData.coliformCountM4 ? parseInt(formData.coliformCountM4, 10) : null,
            formData.coliformCountM5 ? parseInt(formData.coliformCountM5, 10) : null,
            formData.fecalColiformCountM1 ? parseInt(formData.fecalColiformCountM1, 10) : null,
            formData.fecalColiformCountM2 ? parseInt(formData.fecalColiformCountM2, 10) : null,
            formData.fecalColiformCountM3 ? parseInt(formData.fecalColiformCountM3, 10) : null,
            formData.fecalColiformCountM4 ? parseInt(formData.fecalColiformCountM4, 10) : null,
            formData.fecalColiformCountM5 ? parseInt(formData.fecalColiformCountM5, 10) : null,
            formData.eColiPresenceM1 || null,
            formData.eColiPresenceM2 || null,
            formData.eColiPresenceM3 || null,
            formData.eColiPresenceM4 || null,
            formData.eColiPresenceM5 || null,
            formData.moldYeastCountM1 ? parseInt(formData.moldYeastCountM1, 10) : null,
            formData.moldYeastCountM2 ? parseInt(formData.moldYeastCountM2, 10) : null,
            formData.moldYeastCountM3 ? parseInt(formData.moldYeastCountM3, 10) : null,
            formData.moldYeastCountM4 ? parseInt(formData.moldYeastCountM4, 10) : null,
            formData.moldYeastCountM5 ? parseInt(formData.moldYeastCountM5, 10) : null,
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
