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
                    },
                    sample4: {
                        sampleNumber: row.sample_number4,
                        lot: row.lot4,
                        flavor: row.flavor4,
                        productionDate: row.production_date4,
                        expirationDate: row.expiration_date4,
                        productionTemperature: row.production_temperature4,
                        coldChamberTemperature: row.cold_chamber_temperature4,
                        samplingTime: row.sampling_time4,
                        netContent: row.net_content4
                    },
                    sample5: {
                        sampleNumber: row.sample_number5,
                        lot: row.lot5,
                        flavor: row.flavor5,
                        productionDate: row.production_date5,
                        expirationDate: row.expiration_date5,
                        productionTemperature: row.production_temperature5,
                        coldChamberTemperature: row.cold_chamber_temperature5,
                        samplingTime: row.sampling_time5,
                        netContent: row.net_content5
                    }
                },
                measurements: {
                    fatContent: {
                        m1: row.fat_content_m1,
                        m2: row.fat_content_m2,
                        m3: row.fat_content_m3,
                        m4: row.fat_content_m4,
                        m5: row.fat_content_m5,
                        observation: row.fat_content_observation
                    },
                    sng: {
                        m1: row.sng_m1,
                        m2: row.sng_m2,
                        m3: row.sng_m3,
                        m4: row.sng_m4,
                        m5: row.sng_m5,
                        observation: row.sng_observation
                    },
                    titratableAcidity: {
                        m1: row.titratable_acidity_m1,
                        m2: row.titratable_acidity_m2,
                        m3: row.titratable_acidity_m3,
                        m4: row.titratable_acidity_m4,
                        m5: row.titratable_acidity_m5,
                        observation: row.titratable_acidity_observation
                    },
                    ph: {
                        m1: row.ph_m1,
                        m2: row.ph_m2,
                        m3: row.ph_m3,
                        m4: row.ph_m4,
                        m5: row.ph_m5,
                        observation: row.ph_observation
                    },
                    phTemperature: {
                        m1: row.ph_temperature_m1,
                        m2: row.ph_temperature_m2,
                        m3: row.ph_temperature_m3,
                        m4: row.ph_temperature_m4,
                        m5: row.ph_temperature_m5,
                        observation: row.ph_temperature_observation
                    },
                    color: {
                        m1: row.color_m1,
                        m2: row.color_m2,
                        m3: row.color_m3,
                        m4: row.color_m4,
                        m5: row.color_m5,
                        observation: row.color_observation
                    },
                    smell: {
                        m1: row.smell_m1,
                        m2: row.smell_m2,
                        m3: row.smell_m3,
                        m4: row.smell_m4,
                        m5: row.smell_m5,
                        observation: row.smell_observation
                    },
                    taste: {
                        m1: row.taste_m1,
                        m2: row.taste_m2,
                        m3: row.taste_m3,
                        m4: row.taste_m4,
                        m5: row.taste_m5,
                        observation: row.taste_observation
                    },
                    appearance: {
                        m1: row.appearance_m1,
                        m2: row.appearance_m2,
                        m3: row.appearance_m3,
                        m4: row.appearance_m4,
                        m5: row.appearance_m5,
                        observation: row.appearance_observation
                    },
                    probioticCount: {
                        m1: row.probiotic_count_m1,
                        m2: row.probiotic_count_m2,
                        m3: row.probiotic_count_m3,
                        m4: row.probiotic_count_m4,
                        m5: row.probiotic_count_m5,
                        observation: row.probiotic_count_observation
                    },
                    coliformCount: {
                        m1: row.coliform_count_m1,
                        m2: row.coliform_count_m2,
                        m3: row.coliform_count_m3,
                        m4: row.coliform_count_m4,
                        m5: row.coliform_count_m5
                    },
                    fecalColiformCount: {
                        m1: row.fecal_coliform_count_m1,
                        m2: row.fecal_coliform_count_m2,
                        m3: row.fecal_coliform_count_m3,
                        m4: row.fecal_coliform_count_m4,
                        m5: row.fecal_coliform_count_m5
                    },
                    eColiPresence: {
                        m1: row.e_coli_presence_m1,
                        m2: row.e_coli_presence_m2,
                        m3: row.e_coli_presence_m3,
                        m4: row.e_coli_presence_m4,
                        m5: row.e_coli_presence_m5
                    },
                    moldYeastCount: {
                        m1: row.mold_yeast_count_m1,
                        m2: row.mold_yeast_count_m2,
                        m3: row.mold_yeast_count_m3,
                        m4: row.mold_yeast_count_m4,
                        m5: row.mold_yeast_count_m5
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
                sample_number4 = $30,
                lot4 = $31,
                flavor4 = $32,
                production_date4 = $33,
                expiration_date4 = $34,
                production_temperature4 = $35,
                cold_chamber_temperature4 = $36,
                sampling_time4 = $37,
                net_content4 = $38,
                sample_number5 = $39,
                lot5 = $40,
                flavor5 = $41,
                production_date5 = $42,
                expiration_date5 = $43,
                production_temperature5 = $44,
                cold_chamber_temperature5 = $45,
                sampling_time5 = $46,
                net_content5 = $47,
                fat_content_m1 = $48,
                fat_content_m2 = $49,
                fat_content_m3 = $50,
                fat_content_m4 = $51,
                fat_content_m5 = $52,
                fat_content_observation = $53,
                sng_m1 = $54,
                sng_m2 = $55,
                sng_m3 = $56,
                sng_m4 = $57,
                sng_m5 = $58,
                sng_observation = $59,
                titratable_acidity_m1 = $60,
                titratable_acidity_m2 = $61,
                titratable_acidity_m3 = $62,
                titratable_acidity_m4 = $63,
                titratable_acidity_m5 = $64,
                titratable_acidity_observation = $65,
                ph_m1 = $66,
                ph_m2 = $67,
                ph_m3 = $68,
                ph_m4 = $69,
                ph_m5 = $70,
                ph_observation = $71,
                ph_temperature_m1 = $72,
                ph_temperature_m2 = $73,
                ph_temperature_m3 = $74,
                ph_temperature_m4 = $75,
                ph_temperature_m5 = $76,
                ph_temperature_observation = $77,
                color_m1 = $78,
                color_m2 = $79,
                color_m3 = $80,
                color_m4 = $81,
                color_m5 = $82,
                color_observation = $83,
                smell_m1 = $84,
                smell_m2 = $85,
                smell_m3 = $86,
                smell_m4 = $87,
                smell_m5 = $88,
                smell_observation = $89,
                taste_m1 = $90,
                taste_m2 = $91,
                taste_m3 = $92,
                taste_m4 = $93,
                taste_m5 = $94,
                taste_observation = $95,
                appearance_m1 = $96,
                appearance_m2 = $97,
                appearance_m3 = $98,
                appearance_m4 = $99,
                appearance_m5 = $100,
                appearance_observation = $101,
                probiotic_count_m1 = $102,
                probiotic_count_m2 = $103,
                probiotic_count_m3 = $104,
                probiotic_count_m4 = $105,
                probiotic_count_m5 = $106,
                probiotic_count_observation = $107,
                coliform_count_m1 = $108,
                coliform_count_m2 = $109,
                coliform_count_m3 = $110,
                coliform_count_m4 = $111,
                coliform_count_m5 = $112,
                fecal_coliform_count_m1 = $113,
                fecal_coliform_count_m2 = $114,
                fecal_coliform_count_m3 = $115,
                fecal_coliform_count_m4 = $116,
                fecal_coliform_count_m5 = $117,
                e_coli_presence_m1 = $118,
                e_coli_presence_m2 = $119,
                e_coli_presence_m3 = $120,
                e_coli_presence_m4 = $121,
                e_coli_presence_m5 = $122,
                mold_yeast_count_m1 = $123,
                mold_yeast_count_m2 = $124,
                mold_yeast_count_m3 = $125,
                mold_yeast_count_m4 = $126,
                mold_yeast_count_m5 = $127,
                analysis_time = $128
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