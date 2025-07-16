import { json } from '@sveltejs/kit';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import sanitizeHtml from 'sanitize-html';
import type { RequestHandler } from './$types';
import 'dotenv/config';

const connectionString: string = process.env.DATABASE_URL as string;
const sql = neon(connectionString);

async function getPublicKey(): Promise<string> {
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

export const GET: RequestHandler = async ({ request, params }) => {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return json({ success: false, error: 'Missing or invalid Authorization header' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        let userId: string;
        try {
            const publicKey = await getPublicKey();
            const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as { sub: string };
            userId = sanitizeHtml(decoded.sub);
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                return json({ success: false, error: 'Token expired', reason: 'token_expired' }, { status: 401 });
            }
            return json({ success: false, error: `Invalid token: ${(error as Error).message}` }, { status: 401 });
        }

        const reportId = sanitizeHtml(params.id || '');
        const parsedReportId = parseInt(reportId, 10);
        if (isNaN(parsedReportId) || parsedReportId <= 0) {
            return json({ success: false, error: 'Invalid report ID' }, { status: 400 });
        }

        try {
            const result = await sql`
                SELECT *
                FROM diarylab.yogurt_fruited
                WHERE id = ${parsedReportId} AND user_id = ${userId}
            `;

            if (!result.length) {
                return json({ success: false, error: 'Report not found' }, { status: 404 });
            }

            const row = result[0];
            const report = {
                id: row.id,
                samplingDate: row.sampling_date ?? null,
                userId: row.user_id,
                analysisDate: row.analysis_date ?? null,
                samples: {
                    sample1: {
                        sampleNumber: row.sample_number1 ?? null,
                        productionDate: row.production_date1 ?? null,
                        expirationDate: row.expiration_date1 ?? null,
                        samplingTime: row.sampling_time1 ?? null,
                        productTemperature: row.product_temperature1 ?? null,
                        coldChamberTemperature: row.cold_chamber_temperature1 ?? null,
                        netContent: row.net_content1 ?? null,
                    },
                    sample2: {
                        sampleNumber: row.sample_number2 ?? null,
                        productionDate: row.production_date2 ?? null,
                        expirationDate: row.expiration_date2 ?? null,
                        samplingTime: row.sampling_time2 ?? null,
                        productTemperature: row.product_temperature2 ?? null,
                        coldChamberTemperature: row.cold_chamber_temperature2 ?? null,
                        netContent: row.net_content2 ?? null,
                    },
                    sample3: {
                        sampleNumber: row.sample_number3 ?? null,
                        productionDate: row.production_date3 ?? null,
                        expirationDate: row.expiration_date3 ?? null,
                        samplingTime: row.sampling_time3 ?? null,
                        productTemperature: row.product_temperature3 ?? null,
                        coldChamberTemperature: row.cold_chamber_temperature3 ?? null,
                        netContent: row.net_content3 ?? null,
                    },
                    sample4: {
                        sampleNumber: row.sample_number4 ?? null,
                        productionDate: row.production_date4 ?? null,
                        expirationDate: row.expiration_date4 ?? null,
                        samplingTime: row.sampling_time4 ?? null,
                        productTemperature: row.product_temperature4 ?? null,
                        coldChamberTemperature: row.cold_chamber_temperature4 ?? null,
                        netContent: row.net_content4 ?? null,
                    },
                    sample5: {
                        sampleNumber: row.sample_number5 ?? null,
                        productionDate: row.production_date5 ?? null,
                        expirationDate: row.expiration_date5 ?? null,
                        samplingTime: row.sampling_time5 ?? null,
                        productTemperature: row.product_temperature5 ?? null,
                        coldChamberTemperature: row.cold_chamber_temperature5 ?? null,
                        netContent: row.net_content5 ?? null,
                    },
                },
                measurements: {
                    fatContent: {
                        m1: row.fat_content_m1 ?? null,
                        m2: row.fat_content_m2 ?? null,
                        m3: row.fat_content_m3 ?? null,
                        m4: row.fat_content_m4 ?? null,
                        m5: row.fat_content_m5 ?? null,
                        observation: row.fat_content_observation ?? null,
                    },
                    sng: {
                        m1: row.sng_m1 ?? null,
                        m2: row.sng_m2 ?? null,
                        m3: row.sng_m3 ?? null,
                        m4: row.sng_m4 ?? null,
                        m5: row.sng_m5 ?? null,
                        observation: row.sng_observation ?? null,
                    },
                    titratableAcidity: {
                        m1: row.titratable_acidity_m1 ?? null,
                        m2: row.titratable_acidity_m2 ?? null,
                        m3: row.titratable_acidity_m3 ?? null,
                        m4: row.titratable_acidity_m4 ?? null,
                        m5: row.titratable_acidity_m5 ?? null,
                        observation: row.titratable_acidity_observation ?? null,
                    },
                    ph: {
                        m1: row.ph_m1 ?? null,
                        m2: row.ph_m2 ?? null,
                        m3: row.ph_m3 ?? null,
                        m4: row.ph_m4 ?? null,
                        m5: row.ph_m5 ?? null,
                        observation: row.ph_observation ?? null,
                    },
                    phTemperature: {
                        m1: row.ph_temperature_m1 ?? null,
                        m2: row.ph_temperature_m2 ?? null,
                        m3: row.ph_temperature_m3 ?? null,
                        m4: row.ph_temperature_m4 ?? null,
                        m5: row.ph_temperature_m5 ?? null,
                        observation: row.ph_temperature_observation ?? null,
                    },
                    color: {
                        m1: row.color_m1 ?? null,
                        m2: row.color_m2 ?? null,
                        m3: row.color_m3 ?? null,
                        m4: row.color_m4 ?? null,
                        m5: row.color_m5 ?? null,
                        observation: row.color_observation ?? null,
                    },
                    smell: {
                        m1: row.smell_m1 ?? null,
                        m2: row.smell_m2 ?? null,
                        m3: row.smell_m3 ?? null,
                        m4: row.smell_m4 ?? null,
                        m5: row.smell_m5 ?? null,
                        observation: row.smell_observation ?? null,
                    },
                    taste: {
                        m1: row.taste_m1 ?? null,
                        m2: row.taste_m2 ?? null,
                        m3: row.taste_m3 ?? null,
                        m4: row.taste_m4 ?? null,
                        m5: row.taste_m5 ?? null,
                        observation: row.taste_observation ?? null,
                    },
                    appearance: {
                        m1: row.appearance_m1 ?? null,
                        m2: row.appearance_m2 ?? null,
                        m3: row.appearance_m3 ?? null,
                        m4: row.appearance_m4 ?? null,
                        m5: row.appearance_m5 ?? null,
                        observation: row.appearance_observation ?? null,
                    },
                    bacteriologicalQuality: {
                        m1: row.bacteriological_quality_m1 ?? null,
                        m2: row.bacteriological_quality_m2 ?? null,
                        m3: row.bacteriological_quality_m3 ?? null,
                        m4: row.bacteriological_quality_m4 ?? null,
                        m5: row.bacteriological_quality_m5 ?? null,
                    },
                    coliformCount: {
                        m1: row.coliform_count_m1 ?? null,
                        m2: row.coliform_count_m2 ?? null,
                        m3: row.coliform_count_m3 ?? null,
                        m4: row.coliform_count_m4 ?? null,
                        m5: row.coliform_count_m5 ?? null,
                    },
                    fecalColiformCount: {
                        m1: row.fecal_coliform_count_m1 ?? null,
                        m2: row.fecal_coliform_count_m2 ?? null,
                        m3: row.fecal_coliform_count_m3 ?? null,
                        m4: row.fecal_coliform_count_m4 ?? null,
                        m5: row.fecal_coliform_count_m5 ?? null,
                    },
                    eColiPresence: {
                        m1: row.e_coli_presence_m1 ?? null,
                        m2: row.e_coli_presence_m2 ?? null,
                        m3: row.e_coli_presence_m3 ?? null,
                        m4: row.e_coli_presence_m4 ?? null,
                        m5: row.e_coli_presence_m5 ?? null,
                    },
                    moldYeastCount: {
                        m1: row.mold_yeast_count_m1 ?? null,
                        m2: row.mold_yeast_count_m2 ?? null,
                        m3: row.mold_yeast_count_m3 ?? null,
                        m4: row.mold_yeast_count_m4 ?? null,
                        m5: row.mold_yeast_count_m5 ?? null,
                    },
                },
                createdAt: row.created_at ?? null,
            };

            return json({ success: true, data: report }, { status: 200 });
        } catch (dbError) {
            console.error('Database error:', dbError);
            return json({ success: false, error: `Database error: ${(dbError as Error).message}` }, { status: 500 });
        }
    } catch (error) {
        console.error('Unexpected error:', error);
        return json({ success: false, error: `Internal server error: ${(error as Error).message}` }, { status: 500 });
    }
};

export const PUT: RequestHandler = async ({ request, params }) => {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return json({ success: false, error: 'Missing or invalid Authorization header' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        let userId: string;
        try {
            const publicKey = await getPublicKey();
            const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as { sub: string };
            userId = sanitizeHtml(decoded.sub);
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                return json({ success: false, error: 'Token expired', reason: 'token_expired' }, { status: 401 });
            }
            return json({ success: false, error: `Invalid token: ${(error as Error).message}` }, { status: 401 });
        }

        const reportId = sanitizeHtml(params.id || '');
        const parsedReportId = parseInt(reportId, 10);
        if (isNaN(parsedReportId) || parsedReportId <= 0) {
            return json({ success: false, error: 'Invalid report ID' }, { status: 400 });
        }

        const formData = await request.json();
        if (!formData || typeof formData !== 'object') {
            return json({ success: false, error: 'Invalid request body' }, { status: 400 });
        }

        try {
            const result = await sql`
                UPDATE diarylab.yogurt_fruited
                SET sampling_date = ${formData.date || null},
                    analysis_date = ${formData.analysisDate || null},
                    sample_number1 = ${formData.sampleNumber1 || null},
                    production_date1 = ${formData.productionDate1 || null},
                    expiration_date1 = ${formData.expirationDate1 || null},
                    sampling_time1 = ${formData.samplingTime1 || null},
                    product_temperature1 = ${formData.productTemperature1 ? parseFloat(formData.productTemperature1) : null},
                    cold_chamber_temperature1 = ${formData.coldChamberTemperature1 ? parseFloat(formData.coldChamberTemperature1) : null},
                    net_content1 = ${formData.netContent1 ? parseFloat(formData.netContent1) : null},
                    sample_number2 = ${formData.sampleNumber2 || null},
                    production_date2 = ${formData.productionDate2 || null},
                    expiration_date2 = ${formData.expirationDate2 || null},
                    sampling_time2 = ${formData.samplingTime2 || null},
                    product_temperature2 = ${formData.productTemperature2 ? parseFloat(formData.productTemperature2) : null},
                    cold_chamber_temperature2 = ${formData.coldChamberTemperature2 ? parseFloat(formData.coldChamberTemperature2) : null},
                    net_content2 = ${formData.netContent2 ? parseFloat(formData.netContent2) : null},
                    sample_number3 = ${formData.sampleNumber3 || null},
                    production_date3 = ${formData.productionDate3 || null},
                    expiration_date3 = ${formData.expirationDate3 || null},
                    sampling_time3 = ${formData.samplingTime3 || null},
                    product_temperature3 = ${formData.productTemperature3 ? parseFloat(formData.productTemperature3) : null},
                    cold_chamber_temperature3 = ${formData.coldChamberTemperature3 ? parseFloat(formData.coldChamberTemperature3) : null},
                    net_content3 = ${formData.netContent3 ? parseFloat(formData.netContent3) : null},
                    sample_number4 = ${formData.sampleNumber4 || null},
                    production_date4 = ${formData.productionDate4 || null},
                    expiration_date4 = ${formData.expirationDate4 || null},
                    sampling_time4 = ${formData.samplingTime4 || null},
                    product_temperature4 = ${formData.productTemperature4 ? parseFloat(formData.productTemperature4) : null},
                    cold_chamber_temperature4 = ${formData.coldChamberTemperature4 ? parseFloat(formData.coldChamberTemperature4) : null},
                    net_content4 = ${formData.netContent4 ? parseFloat(formData.netContent4) : null},
                    sample_number5 = ${formData.sampleNumber5 || null},
                    production_date5 = ${formData.productionDate5 || null},
                    expiration_date5 = ${formData.expirationDate5 || null},
                    sampling_time5 = ${formData.samplingTime5 || null},
                    product_temperature5 = ${formData.productTemperature5 ? parseFloat(formData.productTemperature5) : null},
                    cold_chamber_temperature5 = ${formData.coldChamberTemperature5 ? parseFloat(formData.coldChamberTemperature5) : null},
                    net_content5 = ${formData.netContent5 ? parseFloat(formData.netContent5) : null},
                    fat_content_m1 = ${formData.fatContentM1 ? parseFloat(formData.fatContentM1) : null},
                    fat_content_m2 = ${formData.fatContentM2 ? parseFloat(formData.fatContentM2) : null},
                    fat_content_m3 = ${formData.fatContentM3 ? parseFloat(formData.fatContentM3) : null},
                    fat_content_m4 = ${formData.fatContentM4 ? parseFloat(formData.fatContentM4) : null},
                    fat_content_m5 = ${formData.fatContentM5 ? parseFloat(formData.fatContentM5) : null},
                    fat_content_observation = ${formData.fatContentObservation || null},
                    sng_m1 = ${formData.sngM1 ? parseFloat(formData.sngM1) : null},
                    sng_m2 = ${formData.sngM2 ? parseFloat(formData.sngM2) : null},
                    sng_m3 = ${formData.sngM3 ? parseFloat(formData.sngM3) : null},
                    sng_m4 = ${formData.sngM4 ? parseFloat(formData.sngM4) : null},
                    sng_m5 = ${formData.sngM5 ? parseFloat(formData.sngM5) : null},
                    sng_observation = ${formData.sngObservation || null},
                    titratable_acidity_m1 = ${formData.titratableAcidityM1 ? parseFloat(formData.titratableAcidityM1) : null},
                    titratable_acidity_m2 = ${formData.titratableAcidityM2 ? parseFloat(formData.titratableAcidityM2) : null},
                    titratable_acidity_m3 = ${formData.titratableAcidityM3 ? parseFloat(formData.titratableAcidityM3) : null},
                    titratable_acidity_m4 = ${formData.titratableAcidityM4 ? parseFloat(formData.titratableAcidityM4) : null},
                    titratable_acidity_m5 = ${formData.titratableAcidityM5 ? parseFloat(formData.titratableAcidityM5) : null},
                    titratable_acidity_observation = ${formData.titratableAcidityObservation || null},
                    ph_m1 = ${formData.phM1 ? parseFloat(formData.phM1) : null},
                    ph_m2 = ${formData.phM2 ? parseFloat(formData.phM2) : null},
                    ph_m3 = ${formData.phM3 ? parseFloat(formData.phM3) : null},
                    ph_m4 = ${formData.phM4 ? parseFloat(formData.phM4) : null},
                    ph_m5 = ${formData.phM5 ? parseFloat(formData.phM5) : null},
                    ph_observation = ${formData.phObservation || null},
                    ph_temperature_m1 = ${formData.phTemperatureM1 ? parseFloat(formData.phTemperatureM1) : null},
                    ph_temperature_m2 = ${formData.phTemperatureM2 ? parseFloat(formData.phTemperatureM2) : null},
                    ph_temperature_m3 = ${formData.phTemperatureM3 ? parseFloat(formData.phTemperatureM3) : null},
                    ph_temperature_m4 = ${formData.phTemperatureM4 ? parseFloat(formData.phTemperatureM4) : null},
                    ph_temperature_m5 = ${formData.phTemperatureM5 ? parseFloat(formData.phTemperatureM5) : null},
                    ph_temperature_observation = ${formData.phTemperatureObservation || null},
                    color_m1 = ${formData.colorM1 || null},
                    color_m2 = ${formData.colorM2 || null},
                    color_m3 = ${formData.colorM3 || null},
                    color_m4 = ${formData.colorM4 || null},
                    color_m5 = ${formData.colorM5 || null},
                    color_observation = ${formData.colorObservation || null},
                    smell_m1 = ${formData.smellM1 || null},
                    smell_m2 = ${formData.smellM2 || null},
                    smell_m3 = ${formData.smellM3 || null},
                    smell_m4 = ${formData.smellM4 || null},
                    smell_m5 = ${formData.smellM5 || null},
                    smell_observation = ${formData.smellObservation || null},
                    taste_m1 = ${formData.tasteM1 || null},
                    taste_m2 = ${formData.tasteM2 || null},
                    taste_m3 = ${formData.tasteM3 || null},
                    taste_m4 = ${formData.tasteM4 || null},
                    taste_m5 = ${formData.tasteM5 || null},
                    taste_observation = ${formData.tasteObservation || null},
                    appearance_m1 = ${formData.appearanceM1 || null},
                    appearance_m2 = ${formData.appearanceM2 || null},
                    appearance_m3 = ${formData.appearanceM3 || null},
                    appearance_m4 = ${formData.appearanceM4 || null},
                    appearance_m5 = ${formData.appearanceM5 || null},
                    appearance_observation = ${formData.appearanceObservation || null},
                    bacteriological_quality_m1 = ${formData.bacteriologicalQualityM1 || null},
                    bacteriological_quality_m2 = ${formData.bacteriologicalQualityM2 || null},
                    bacteriological_quality_m3 = ${formData.bacteriologicalQualityM3 || null},
                    bacteriological_quality_m4 = ${formData.bacteriologicalQualityM4 || null},
                    bacteriological_quality_m5 = ${formData.bacteriologicalQualityM5 || null},
                    coliform_count_m1 = ${formData.coliformCountM1 ? parseInt(formData.coliformCountM1, 10) : null},
                    coliform_count_m2 = ${formData.coliformCountM2 ? parseInt(formData.coliformCountM2, 10) : null},
                    coliform_count_m3 = ${formData.coliformCountM3 ? parseInt(formData.coliformCountM3, 10) : null},
                    coliform_count_m4 = ${formData.coliformCountM4 ? parseInt(formData.coliformCountM4, 10) : null},
                    coliform_count_m5 = ${formData.coliformCountM5 ? parseInt(formData.coliformCountM5, 10) : null},
                    fecal_coliform_count_m1 = ${formData.fecalColiformCountM1 ? parseInt(formData.fecalColiformCountM1, 10) : null},
                    fecal_coliform_count_m2 = ${formData.fecalColiformCountM2 ? parseInt(formData.fecalColiformCountM2, 10) : null},
                    fecal_coliform_count_m3 = ${formData.fecalColiformCountM3 ? parseInt(formData.fecalColiformCountM3, 10) : null},
                    fecal_coliform_count_m4 = ${formData.fecalColiformCountM4 ? parseInt(formData.fecalColiformCountM4, 10) : null},
                    fecal_coliform_count_m5 = ${formData.fecalColiformCountM5 ? parseInt(formData.fecalColiformCountM5, 10) : null},
                    e_coli_presence_m1 = ${formData.eColiPresenceM1 || null},
                    e_coli_presence_m2 = ${formData.eColiPresenceM2 || null},
                    e_coli_presence_m3 = ${formData.eColiPresenceM3 || null},
                    e_coli_presence_m4 = ${formData.eColiPresenceM4 || null},
                    e_coli_presence_m5 = ${formData.eColiPresenceM5 || null},
                    mold_yeast_count_m1 = ${formData.moldYeastCountM1 ? parseInt(formData.moldYeastCountM1, 10) : null},
                    mold_yeast_count_m2 = ${formData.moldYeastCountM2 ? parseInt(formData.moldYeastCountM2, 10) : null},
                    mold_yeast_count_m3 = ${formData.moldYeastCountM3 ? parseInt(formData.moldYeastCountM3, 10) : null},
                    mold_yeast_count_m4 = ${formData.moldYeastCountM4 ? parseInt(formData.moldYeastCountM4, 10) : null},
                    mold_yeast_count_m5 = ${formData.moldYeastCountM5 ? parseInt(formData.moldYeastCountM5, 10) : null}
                WHERE id = ${parsedReportId} AND user_id = ${userId}
                RETURNING *
            `;

            if (!result.length) {
                return json({ success: false, error: 'Report not found or unauthorized' }, { status: 404 });
            }

            return json({ success: true, message: 'Data updated successfully', data: result[0] }, { status: 200 });
        } catch (dbError) {
            console.error('Database error:', dbError);
            return json({ success: false, error: `Database error: ${(dbError as Error).message}` }, { status: 500 });
        }
    } catch (error) {
        console.error('Unexpected error:', error);
        return json({ success: false, error: `Internal server error: ${(error as Error).message}` }, { status: 500 });
    }
};

export const DELETE: RequestHandler = async ({ request, params }) => {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return json({ success: false, error: 'Missing or invalid Authorization header' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        let userId: string;
        try {
            const publicKey = await getPublicKey();
            const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as { sub: string };
            userId = sanitizeHtml(decoded.sub);
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                return json({ success: false, error: 'Token expired', reason: 'token_expired' }, { status: 401 });
            }
            return json({ success: false, error: `Invalid token: ${(error as Error).message}` }, { status: 401 });
        }

        const reportId = sanitizeHtml(params.id || '');
        const parsedReportId = parseInt(reportId, 10);
        if (isNaN(parsedReportId) || parsedReportId <= 0) {
            return json({ success: false, error: 'Invalid report ID' }, { status: 400 });
        }

        try {
            const checkResult = await sql`
                SELECT id
                FROM diarylab.yogurt_fruited
                WHERE id = ${parsedReportId} AND user_id = ${userId}
                FOR UPDATE
            `;

            if (!checkResult.length) {
                return json({ success: false, error: 'Report not found or unauthorized' }, { status: 404 });
            }

            const deleteResult = await sql`
                DELETE FROM diarylab.yogurt_fruited
                WHERE id = ${parsedReportId} AND user_id = ${userId}
                RETURNING id
            `;

            if (!deleteResult.length) {
                return json({ success: false, error: 'Report deletion failed' }, { status: 500 });
            }

            return json({ success: true, message: 'Report deleted successfully', id: parsedReportId }, { status: 200 });
        } catch (dbError) {
            console.error('Database error during deletion:', dbError);
            return json({ success: false, error: `Internal server error: ${(dbError as Error).message}` }, { status: 500 });
        }
    } catch (error) {
        console.error('Unexpected error:', error);
        return json({ success: false, error: `Internal server error: ${(error as Error).message}` }, { status: 500 });
    }
};