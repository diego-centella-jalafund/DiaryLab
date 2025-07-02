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
                FROM yogurt_fruited
                WHERE id = $1 AND user_id = $2
            `;
            const result = await client.query(query, [parsedReportId, userId]);

            if (!result.rows.length) {
                return json({ error: 'Report not found' }, { status: 404 });
            }

            const row = result.rows[0];
            const report = {
                id: row.id,
                samplingDate: row.sampling_date,
                userId: row.user_id,
                analysisDate: row.analysis_date,
                samples: {
                    sample1: {
                        sampleNumber: row.sample_number1,
                        productionDate: row.production_date1,
                        expirationDate: row.expiration_date1,
                        samplingTime: row.sampling_time1,
                        productTemperature: row.product_temperature1,
                        coldChamberTemperature: row.cold_chamber_temperature1,
                        netContent: row.net_content1
                    },
                    sample2: {
                        sampleNumber: row.sample_number2,
                        productionDate: row.production_date2,
                        expirationDate: row.expiration_date2,
                        samplingTime: row.sampling_time2,
                        productTemperature: row.product_temperature2,
                        coldChamberTemperature: row.cold_chamber_temperature2,
                        netContent: row.net_content2
                    },
                    sample3: {
                        sampleNumber: row.sample_number3,
                        productionDate: row.production_date3,
                        expirationDate: row.expiration_date3,
                        samplingTime: row.sampling_time3,
                        productTemperature: row.product_temperature3,
                        coldChamberTemperature: row.cold_chamber_temperature3,
                        netContent: row.net_content3
                    },
                    sample4: {
                        sampleNumber: row.sample_number4,
                        productionDate: row.production_date4,
                        expirationDate: row.expiration_date4,
                        samplingTime: row.sampling_time4,
                        productTemperature: row.product_temperature4,
                        coldChamberTemperature: row.cold_chamber_temperature4,
                        netContent: row.net_content4
                    },
                    sample5: {
                        sampleNumber: row.sample_number5,
                        productionDate: row.production_date5,
                        expirationDate: row.expiration_date5,
                        samplingTime: row.sampling_time5,
                        productTemperature: row.product_temperature5,
                        coldChamberTemperature: row.cold_chamber_temperature5,
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
                    bacteriologicalQuality: {
                        m1: row.bacteriological_quality_m1,
                        m2: row.bacteriological_quality_m2,
                        m3: row.bacteriological_quality_m3,
                        m4: row.bacteriological_quality_m4,
                        m5: row.bacteriological_quality_m5
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

        const formData = await request.json();

        const query = `
            UPDATE yogurt_fruited
            SET sampling_date = $1,
                analysis_date = $2,
                sample_number1 = $3,
                production_date1 = $4,
                expiration_date1 = $5,
                sampling_time1 = $6,
                product_temperature1 = $7,
                cold_chamber_temperature1 = $8,
                net_content1 = $9,
                sample_number2 = $10,
                production_date2 = $11,
                expiration_date2 = $12,
                sampling_time2 = $13,
                product_temperature2 = $14,
                cold_chamber_temperature2 = $15,
                net_content2 = $16,
                sample_number3 = $17,
                production_date3 = $18,
                expiration_date3 = $19,
                sampling_time3 = $20,
                product_temperature3 = $21,
                cold_chamber_temperature3 = $22,
                net_content3 = $23,
                sample_number4 = $24,
                production_date4 = $25,
                expiration_date4 = $26,
                sampling_time4 = $27,
                product_temperature4 = $28,
                cold_chamber_temperature4 = $29,
                net_content4 = $30,
                sample_number5 = $31,
                production_date5 = $32,
                expiration_date5 = $33,
                sampling_time5 = $34,
                product_temperature5 = $35,
                cold_chamber_temperature5 = $36,
                net_content5 = $37,
                fat_content_m1 = $38,
                fat_content_m2 = $39,
                fat_content_m3 = $40,
                fat_content_m4 = $41,
                fat_content_m5 = $42,
                fat_content_observation = $43,
                sng_m1 = $44,
                sng_m2 = $45,
                sng_m3 = $46,
                sng_m4 = $47,
                sng_m5 = $48,
                sng_observation = $49,
                titratable_acidity_m1 = $50,
                titratable_acidity_m2 = $51,
                titratable_acidity_m3 = $52,
                titratable_acidity_m4 = $53,
                titratable_acidity_m5 = $54,
                titratable_acidity_observation = $55,
                ph_m1 = $56,
                ph_m2 = $57,
                ph_m3 = $58,
                ph_m4 = $59,
                ph_m5 = $60,
                ph_observation = $61,
                ph_temperature_m1 = $62,
                ph_temperature_m2 = $63,
                ph_temperature_m3 = $64,
                ph_temperature_m4 = $65,
                ph_temperature_m5 = $66,
                ph_temperature_observation = $67,
                color_m1 = $68,
                color_m2 = $69,
                color_m3 = $70,
                color_m4 = $71,
                color_m5 = $72,
                color_observation = $73,
                smell_m1 = $74,
                smell_m2 = $75,
                smell_m3 = $76,
                smell_m4 = $77,
                smell_m5 = $78,
                smell_observation = $79,
                taste_m1 = $80,
                taste_m2 = $81,
                taste_m3 = $82,
                taste_m4 = $83,
                taste_m5 = $84,
                taste_observation = $85,
                appearance_m1 = $86,
                appearance_m2 = $87,
                appearance_m3 = $88,
                appearance_m4 = $89,
                appearance_m5 = $90,
                appearance_observation = $91,
                bacteriological_quality_m1 = $92,
                bacteriological_quality_m2 = $93,
                bacteriological_quality_m3 = $94,
                bacteriological_quality_m4 = $95,
                bacteriological_quality_m5 = $96,
                coliform_count_m1 = $97,
                coliform_count_m2 = $98,
                coliform_count_m3 = $99,
                coliform_count_m4 = $100,
                coliform_count_m5 = $101,
                fecal_coliform_count_m1 = $102,
                fecal_coliform_count_m2 = $103,
                fecal_coliform_count_m3 = $104,
                fecal_coliform_count_m4 = $105,
                fecal_coliform_count_m5 = $106,
                e_coli_presence_m1 = $107,
                e_coli_presence_m2 = $108,
                e_coli_presence_m3 = $109,
                e_coli_presence_m4 = $110,
                e_coli_presence_m5 = $111,
                mold_yeast_count_m1 = $112,
                mold_yeast_count_m2 = $113,
                mold_yeast_count_m3 = $114,
                mold_yeast_count_m4 = $115,
                mold_yeast_count_m5 = $116
            WHERE id = $117 AND user_id = $118
            RETURNING *;
        `;

        const values = [
            formData.date || null,
            formData.analysisDate || null,
            formData.sampleNumber1 || null,
            formData.productionDate1 || null,
            formData.expirationDate1 || null,
            formData.samplingTime1 || null,
            formData.productTemperature1 ? parseFloat(formData.productTemperature1) : 0,
            formData.coldChamberTemperature1 ? parseFloat(formData.coldChamberTemperature1) : 0,
            formData.netContent1 ? parseFloat(formData.netContent1) : 0,
            formData.sampleNumber2 || null,
            formData.productionDate2 || null,
            formData.expirationDate2 || null,
            formData.samplingTime2 || null,
            formData.productTemperature2 ? parseFloat(formData.productTemperature2) : 0,
            formData.coldChamberTemperature2 ? parseFloat(formData.coldChamberTemperature2) : 0,
            formData.netContent2 ? parseFloat(formData.netContent2) : 0,
            formData.sampleNumber3 || null,
            formData.productionDate3 || null,
            formData.expirationDate3 || null,
            formData.samplingTime3 || null,
            formData.productTemperature3 ? parseFloat(formData.productTemperature3) : 0,
            formData.coldChamberTemperature3 ? parseFloat(formData.coldChamberTemperature3) : 0,
            formData.netContent3 ? parseFloat(formData.netContent3) : 0,
            formData.sampleNumber4 || null,
            formData.productionDate4 || null,
            formData.expirationDate4 || null,
            formData.samplingTime4 || null,
            formData.productTemperature4 ? parseFloat(formData.productTemperature4) : 0,
            formData.coldChamberTemperature4 ? parseFloat(formData.coldChamberTemperature4) : 0,
            formData.netContent4 ? parseFloat(formData.netContent4) : 0,
            formData.sampleNumber5 || null,
            formData.productionDate5 || null,
            formData.expirationDate5 || null,
            formData.samplingTime5 || null,
            formData.productTemperature5 ? parseFloat(formData.productTemperature5) : 0,
            formData.coldChamberTemperature5 ? parseFloat(formData.coldChamberTemperature5) : 0,
            formData.netContent5 ? parseFloat(formData.netContent5) : 0,
            formData.fatContentM1 ? parseFloat(formData.fatContentM1) : 0,
            formData.fatContentM2 ? parseFloat(formData.fatContentM2) : 0,
            formData.fatContentM3 ? parseFloat(formData.fatContentM3) : 0,
            formData.fatContentM4 ? parseFloat(formData.fatContentM4) : 0,
            formData.fatContentM5 ? parseFloat(formData.fatContentM5) : 0,
            formData.fatContentObservation || '',
            formData.sngM1 ? parseFloat(formData.sngM1) : 0,
            formData.sngM2 ? parseFloat(formData.sngM2) : 0,
            formData.sngM3 ? parseFloat(formData.sngM3) : 0,
            formData.sngM4 ? parseFloat(formData.sngM4) : 0,
            formData.sngM5 ? parseFloat(formData.sngM5) : 0,
            formData.sngObservation || '',
            formData.titratableAcidityM1 ? parseFloat(formData.titratableAcidityM1) : 0,
            formData.titratableAcidityM2 ? parseFloat(formData.titratableAcidityM2) : 0,
            formData.titratableAcidityM3 ? parseFloat(formData.titratableAcidityM3) : 0,
            formData.titratableAcidityM4 ? parseFloat(formData.titratableAcidityM4) : 0,
            formData.titratableAcidityM5 ? parseFloat(formData.titratableAcidityM5) : 0,
            formData.titratableAcidityObservation || '',
            formData.phM1 ? parseFloat(formData.phM1) : 0,
            formData.phM2 ? parseFloat(formData.phM2) : 0,
            formData.phM3 ? parseFloat(formData.phM3) : 0,
            formData.phM4 ? parseFloat(formData.phM4) : 0,
            formData.phM5 ? parseFloat(formData.phM5) : 0,
            formData.phObservation || '',
            formData.phTemperatureM1 ? parseFloat(formData.phTemperatureM1) : 0,
            formData.phTemperatureM2 ? parseFloat(formData.phTemperatureM2) : 0,
            formData.phTemperatureM3 ? parseFloat(formData.phTemperatureM3) : 0,
            formData.phTemperatureM4 ? parseFloat(formData.phTemperatureM4) : 0,
            formData.phTemperatureM5 ? parseFloat(formData.phTemperatureM5) : 0,
            formData.phTemperatureObservation || '',
            formData.colorM1 || '',
            formData.colorM2 || '',
            formData.colorM3 || '',
            formData.colorM4 || '',
            formData.colorM5 || '',
            formData.colorObservation || '',
            formData.smellM1 || '',
            formData.smellM2 || '',
            formData.smellM3 || '',
            formData.smellM4 || '',
            formData.smellM5 || '',
            formData.smellObservation || '',
            formData.tasteM1 || '',
            formData.tasteM2 || '',
            formData.tasteM3 || '',
            formData.tasteM4 || '',
            formData.tasteM5 || '',
            formData.tasteObservation || '',
            formData.appearanceM1 || '',
            formData.appearanceM2 || '',
            formData.appearanceM3 || '',
            formData.appearanceM4 || '',
            formData.appearanceM5 || '',
            formData.appearanceObservation || '',
            formData.bacteriologicalQualityM1 || '',
            formData.bacteriologicalQualityM2 || '',
            formData.bacteriologicalQualityM3 || '',
            formData.bacteriologicalQualityM4 || '',
            formData.bacteriologicalQualityM5 || '',
            formData.coliformCountM1 ? parseInt(formData.coliformCountM1, 10) : 0,
            formData.coliformCountM2 ? parseInt(formData.coliformCountM2, 10) : 0,
            formData.coliformCountM3 ? parseInt(formData.coliformCountM3, 10) : 0,
            formData.coliformCountM4 ? parseInt(formData.coliformCountM4, 10) : 0,
            formData.coliformCountM5 ? parseInt(formData.coliformCountM5, 10) : 0,
            formData.fecalColiformCountM1 ? parseInt(formData.fecalColiformCountM1, 10) : 0,
            formData.fecalColiformCountM2 ? parseInt(formData.fecalColiformCountM2, 10) : 0,
            formData.fecalColiformCountM3 ? parseInt(formData.fecalColiformCountM3, 10) : 0,
            formData.fecalColiformCountM4 ? parseInt(formData.fecalColiformCountM4, 10) : 0,
            formData.fecalColiformCountM5 ? parseInt(formData.fecalColiformCountM5, 10) : 0,
            formData.eColiPresenceM1 || '',
            formData.eColiPresenceM2 || '',
            formData.eColiPresenceM3 || '',
            formData.eColiPresenceM4 || '',
            formData.eColiPresenceM5 || '',
            formData.moldYeastCountM1 ? parseInt(formData.moldYeastCountM1, 10) : 0,
            formData.moldYeastCountM2 ? parseInt(formData.moldYeastCountM2, 10) : 0,
            formData.moldYeastCountM3 ? parseInt(formData.moldYeastCountM3, 10) : 0,
            formData.moldYeastCountM4 ? parseInt(formData.moldYeastCountM4, 10) : 0,
            formData.moldYeastCountM5 ? parseInt(formData.moldYeastCountM5, 10) : 0,
            parsedReportId,
            userId
        ];

        const client = await pool.connect();
        try {
            const result = await client.query(query, values);
            if (result.rowCount === 0) {
                return json({ error: 'Report not found or unauthorized' }, { status: 404 });
            }
            return json({ message: 'Data updated successfully', data: result.rows[0] }, { status: 200 });
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
                FROM yogurt_fruited
                WHERE id = $1 AND user_id = $2
                FOR UPDATE
            `;
            const checkResult = await client.query(checkQuery, [parsedReportId, userId]);

            if (!checkResult.rows.length) {
                return json({ error: 'Report not found or unauthorized' }, { status: 404 });
            }

            const deleteQuery = `
                DELETE FROM yogurt_fruited
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