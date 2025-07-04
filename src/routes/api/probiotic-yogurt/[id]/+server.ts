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
                FROM probiotic_yogurt
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
                samples: {
                    sample1: {
                        sampleNumber: row.sample_number1,
                        lot: row.lot1,
                        flavor: row.flavor1,
                        productionDate: row.production_date1,
                        expirationDate: row.expiration_date1,
                        productionTemperature: row.production_temperature1,
                        coldChamberTemperature: row.cold_chamber_temperature1,
                        samplingTime: row.sampling_time1,
                        netContent: row.net_content1
                    },
                    sample2: {
                        sampleNumber: row.sample_number2,
                        lot: row.lot2,
                        flavor: row.flavor2,
                        productionDate: row.production_date2,
                        expirationDate: row.expiration_date2,
                        productionTemperature: row.production_temperature2,
                        coldChamberTemperature: row.cold_chamber_temperature2,
                        samplingTime: row.sampling_time2,
                        netContent: row.net_content2
                    },
                    sample3: {
                        sampleNumber: row.sample_number3,
                        lot: row.lot3,
                        flavor: row.flavor3,
                        productionDate: row.production_date3,
                        expirationDate: row.expiration_date3,
                        productionTemperature: row.production_temperature3,
                        coldChamberTemperature: row.cold_chamber_temperature3,
                        samplingTime: row.sampling_time3,
                        netContent: row.net_content3
                    }
                },
                measurements: {
                    fatContent: {
                        m1: row.fat_content_m1,
                        m2: row.fat_content_m2,
                        m3: row.fat_content_m3,
                        observation: row.fat_content_observation
                    },
                    sng: {
                        m1: row.sng_m1,
                        m2: row.sng_m2,
                        m3: row.sng_m3,
                        observation: row.sng_observation
                    },
                    titratableAcidity: {
                        m1: row.titratable_acidity_m1,
                        m2: row.titratable_acidity_m2,
                        m3: row.titratable_acidity_m3,
                        observation: row.titratable_acidity_observation
                    },
                    ph: {
                        m1: row.ph_m1,
                        m2: row.ph_m2,
                        m3: row.ph_m3,
                        observation: row.ph_observation
                    },
                    phTemperature: {
                        m1: row.ph_temperature_m1,
                        m2: row.ph_temperature_m2,
                        m3: row.ph_temperature_m3,
                        observation: row.ph_temperature_observation
                    },
                    color: {
                        m1: row.color_m1,
                        m2: row.color_m2,
                        m3: row.color_m3,
                        observation: row.color_observation
                    },
                    smell: {
                        m1: row.smell_m1,
                        m2: row.smell_m2,
                        m3: row.smell_m3,
                        observation: row.smell_observation
                    },
                    taste: {
                        m1: row.taste_m1,
                        m2: row.taste_m2,
                        m3: row.taste_m3,
                        observation: row.taste_observation
                    },
                    appearance: {
                        m1: row.appearance_m1,
                        m2: row.appearance_m2,
                        m3: row.appearance_m3,
                        observation: row.appearance_observation
                    },
                    probioticCount: {
                        m1: row.probiotic_count_m1,
                        m2: row.probiotic_count_m2,
                        m3: row.probiotic_count_m3,
                    },
                    coliformCount: {
                        m1: row.coliform_count_m1,
                        m2: row.coliform_count_m2,
                        m3: row.coliform_count_m3,
                    },
                    fecalColiformCount: {
                        m1: row.fecal_coliform_count_m1,
                        m2: row.fecal_coliform_count_m2,
                        m3: row.fecal_coliform_count_m3,
                    },
                    eColiPresence: {
                        m1: row.e_coli_presence_m1,
                        m2: row.e_coli_presence_m2,
                        m3: row.e_coli_presence_m3,
                    },
                    moldYeastCount: {
                        m1: row.mold_yeast_count_m1,
                        m2: row.mold_yeast_count_m2,
                        m3: row.mold_yeast_count_m3,
                    }
                },
                analysisTime: row.analysis_time,
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
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        let decodedToken;
        try {
            decodedToken = jwt.verify(token, KEYCLOAK_PUBLIC_KEY, { algorithms: ['RS256'] }) as { sub: string };
        } catch (error) {
            console.error('Token verification failed:', error);
            return json({ error: 'Invalid token', reason: 'token_invalid' }, { status: 401 });
        }

        const userId = decodedToken.sub;
        const id = sanitizeHtml(params.id || '');
        if (!id) {
            return json({ error: 'Missing id' }, { status: 400 });
        }

        const formData = await request.json();

        const query = `
            UPDATE probiotic_yogurt
            SET date = $1,
                analysis_date = $2,
                sample_number1 = $3,
                lot1 = $4,
                flavor1 = $5,
                production_date1 = $6,
                expiration_date1 = $7,
                production_temperature1 = $8,
                cold_chamber_temperature1 = $9,
                sampling_time1 = $10,
                net_content1 = $11,
                sample_number2 = $12,
                lot2 = $13,
                flavor2 = $14,
                production_date2 = $15,
                expiration_date2 = $16,
                production_temperature2 = $17,
                cold_chamber_temperature2 = $18,
                sampling_time2 = $19,
                net_content2 = $20,
                sample_number3 = $21,
                lot3 = $22,
                flavor3 = $23,
                production_date3 = $24,
                expiration_date3 = $25,
                production_temperature3 = $26,
                cold_chamber_temperature3 = $27,
                sampling_time3 = $28,
                net_content3 = $29,
                fat_content_m1 = $30,
                fat_content_m2 = $31,
                fat_content_m3 = $32,
                fat_content_observation = $3,
                sng_m1 = $34,
                sng_m2 = $35,
                sng_m3 = $36,
                sng_observation = $37,
                titratable_acidity_m1 = $38,
                titratable_acidity_m2 = $39,
                titratable_acidity_m3 = $40,
                titratable_acidity_observation = $41,
                ph_m1 = $41,
                ph_m2 = $42,
                ph_m3 = $43,
                ph_observation = $44,
                ph_temperature_m1 = $45,
                ph_temperature_m2 = $46,
                ph_temperature_m3 = $47,
                ph_temperature_observation = $48,
                color_m1 = $49,
                color_m2 = $50,
                color_m3 = $51,
                color_observation = $52,
                smell_m1 = $53,
                smell_m2 = $54,
                smell_m3 = $55,
                smell_observation = $56,
                taste_m1 = $57,
                taste_m2 = $58,
                taste_m3 = $59,
                taste_observation = $60,
                appearance_m1 = $61,
                appearance_m2 = $62,
                appearance_m3 = $63,
                appearance_observation = $64,
                probiotic_count_m1 = $65,
                probiotic_count_m2 = $66,
                probiotic_count_m3 = $67,
                probiotic_count_observation = $68,
                coliform_count_m1 = $69,
                coliform_count_m2 = $70,
                coliform_count_m3 = $71,
                fecal_coliform_count_m1 = $73,
                fecal_coliform_count_m2 = $74,
                fecal_coliform_count_m3 = $75,
                e_coli_presence_m1 = $76,
                e_coli_presence_m2 = $77,
                e_coli_presence_m3 = $78,
                mold_yeast_count_m1 = $79,
                mold_yeast_count_m2 = $80,
                mold_yeast_count_m3 = $81,
                analysis_time = $82
            WHERE id = $129 AND user_id = $130
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
            formData.probioticCountObservation || null,
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
            id,
            userId
        ];

        const client = await pool.connect();
        try {
            const result = await client.query(query, values);
            if (result.rowCount === 0) {
                return json({ error: 'Record not found or unauthorized' }, { status: 404 });
            }
            return json({ message: 'Data updated successfully', data: result.rows[0] }, { status: 200 });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error updating data:', error);
        return json({ error: 'Error updating data', details: error.message }, { status: 500 });
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
                FROM probiotic_yogurt
                WHERE id = $1 AND user_id = $2
                FOR UPDATE
            `;
            const checkResult = await client.query(checkQuery, [parsedReportId, userId]);

            if (!checkResult.rows.length) {
                return json({ error: 'Report not found or unauthorized' }, { status: 404 });
            }

            const deleteQuery = `
                DELETE FROM probiotic_yogurt
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