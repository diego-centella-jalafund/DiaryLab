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
                FROM diarylab.raw_milk
                WHERE id = ${parsedReportId} AND user_id = ${userId}
            `;

            if (!result.length) {
                return json({ success: false, error: 'Report not found' }, { status: 404 });
            }

            const row = result[0];
            const report = {
                id: row.id,
                date: row.date ?? null,
                userId: row.user_id,
                analysisDate: row.analysis_date ?? null,
                sampleNumber: {
                    evening: row.evening_sample_number ?? null,
                    earlyMorning: row.early_morning_sample_number ?? null,
                    gmp2: row.gmp2_sample_number ?? null,
                },
                samplingTime: {
                    evening: row.evening_sampling_time ?? null,
                    earlyMorning: row.early_morning_sampling_time ?? null,
                    gmp2: row.gmp2_sampling_time ?? null,
                },
                samplingTemperature: {
                    evening: row.evening_sampling_temperature ?? null,
                    earlyMorning: row.early_morning_sampling_temperature ?? null,
                    gmp2: row.gmp2_sampling_temperature ?? null,
                },
                ph20C: {
                    evening: row.ph_20c_evening ?? null,
                    earlyMorning: row.ph_20c_early_morning ?? null,
                    gmp2: row.ph_20c_gmp2 ?? null,
                },
                temperature: {
                    evening: row.evening_temperature ?? null,
                    earlyMorning: row.early_morning_temperature ?? null,
                    gmp2: row.gmp2_temperature ?? null,
                },
                titratableAcidity: {
                    evening: row.titratable_acidity_evening ?? null,
                    earlyMorning: row.titratable_acidity_early_morning ?? null,
                    gmp2: row.titratable_acidity_gmp2 ?? null,
                },
                density20C: {
                    evening: row.density_20c_evening ?? null,
                    earlyMorning: row.density_20c_early_morning ?? null,
                    gmp2: row.density_20c_gmp2 ?? null,
                },
                fatContent: {
                    evening: row.fat_content_evening ?? null,
                    earlyMorning: row.fat_content_early_morning ?? null,
                    gmp2: row.fat_content_gmp2 ?? null,
                },
                nonFatSolids: {
                    evening: row.non_fat_solids_evening ?? null,
                    earlyMorning: row.non_fat_solids_early_morning ?? null,
                    gmp2: row.non_fat_solids_gmp2 ?? null,
                },
                alcoholTest: {
                    evening: row.alcohol_test_evening ?? null,
                    earlyMorning: row.alcohol_test_early_morning ?? null,
                    gmp2: row.alcohol_test_gmp2 ?? null,
                },
                tram: {
                    evening: row.tram_evening ?? null,
                    earlyMorning: row.tram_early_morning ?? null,
                    gmp2: row.tram_gmp2 ?? null,
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

        const data = await request.json();
        if (!data || typeof data !== 'object') {
            return json({ success: false, error: 'Invalid request body' }, { status: 400 });
        }

        const sanitizedData = {
            date: sanitizeHtml(data.date || ''),
            analysisDate: sanitizeHtml(data.analysisDate || ''),
            sampleNumber: {
                evening: sanitizeHtml(data.sampleNumber?.evening || ''),
                earlyMorning: sanitizeHtml(data.sampleNumber?.earlyMorning || ''),
                gmp2: sanitizeHtml(data.sampleNumber?.gmp2 || ''),
            },
            samplingTime: {
        		evening: data.samplingTime?.evening && sanitizeHtml(data.samplingTime.evening) !== '' ? sanitizeHtml(data.samplingTime.evening) : null,
        		earlyMorning: data.samplingTime?.earlyMorning && sanitizeHtml(data.samplingTime.earlyMorning) !== '' ? sanitizeHtml(data.samplingTime.earlyMorning) : null,
        		gmp2: data.samplingTime?.gmp2 && sanitizeHtml(data.samplingTime.gmp2) !== '' ? sanitizeHtml(data.samplingTime.gmp2) : null,
    		},
            samplingTemperature: {
                evening: data.samplingTemperature?.evening ? parseFloat(data.samplingTemperature.evening) : null,
                earlyMorning: data.samplingTemperature?.earlyMorning ? parseFloat(data.samplingTemperature.earlyMorning) : null,
                gmp2: data.samplingTemperature?.gmp2 ? parseFloat(data.samplingTemperature.gmp2) : null,
            },
            ph20C: {
                evening: data.ph20C?.evening ? parseFloat(data.ph20C.evening) : null,
                earlyMorning: data.ph20C?.earlyMorning ? parseFloat(data.ph20C.earlyMorning) : null,
                gmp2: data.ph20C?.gmp2 ? parseFloat(data.ph20C.gmp2) : null,
            },
            temperature: {
                evening: data.temperature?.evening ? parseFloat(data.temperature.evening) : null,
                earlyMorning: data.temperature?.earlyMorning ? parseFloat(data.temperature.earlyMorning) : null,
                gmp2: data.temperature?.gmp2 ? parseFloat(data.temperature.gmp2) : null,
            },
            titratableAcidity: {
                evening: data.titratableAcidity?.evening ? parseFloat(data.titratableAcidity.evening) : null,
                earlyMorning: data.titratableAcidity?.earlyMorning ? parseFloat(data.titratableAcidity.earlyMorning) : null,
                gmp2: data.titratableAcidity?.gmp2 ? parseFloat(data.titratableAcidity.gmp2) : null,
            },
            density20C: {
                evening: data.density20C?.evening ? parseFloat(data.density20C.evening) : null,
                earlyMorning: data.density20C?.earlyMorning ? parseFloat(data.density20C.earlyMorning) : null,
                gmp2: data.density20C?.gmp2 ? parseFloat(data.density20C.gmp2) : null,
            },
            fatContent: {
                evening: data.fatContent?.evening ? parseFloat(data.fatContent.evening) : null,
                earlyMorning: data.fatContent?.earlyMorning ? parseFloat(data.fatContent.earlyMorning) : null,
                gmp2: data.fatContent?.gmp2 ? parseFloat(data.fatContent.gmp2) : null,
            },
            nonFatSolids: {
                evening: data.nonFatSolids?.evening ? parseFloat(data.nonFatSolids.evening) : null,
                earlyMorning: data.nonFatSolids?.earlyMorning ? parseFloat(data.nonFatSolids.earlyMorning) : null,
                gmp2: data.nonFatSolids?.gmp2 ? parseFloat(data.nonFatSolids.gmp2) : null,
            },
            alcoholTest: {
                evening: sanitizeHtml(data.alcoholTest?.evening || ''),
                earlyMorning: sanitizeHtml(data.alcoholTest?.earlyMorning || ''),
                gmp2: sanitizeHtml(data.alcoholTest?.gmp2 || ''),
            },
            tram: {
                evening: sanitizeHtml(data.tram?.evening || ''),
                earlyMorning: sanitizeHtml(data.tram?.earlyMorning || ''),
                gmp2: sanitizeHtml(data.tram?.gmp2 || ''),
            },
        };

        if (!sanitizedData.date || !sanitizedData.analysisDate) {
            return json({ success: false, error: 'Date and Analysis Date are required' }, { status: 400 });
        }

        try {
            const result = await sql`
                UPDATE diarylab.raw_milk
                SET
                    date = ${sanitizedData.date},
                    analysis_date = ${sanitizedData.analysisDate},
                    evening_sample_number = ${sanitizedData.sampleNumber.evening},
                    early_morning_sample_number = ${sanitizedData.sampleNumber.earlyMorning},
                    gmp2_sample_number = ${sanitizedData.sampleNumber.gmp2},
                    evening_sampling_time = ${sanitizedData.samplingTime.evening},
                    early_morning_sampling_time = ${sanitizedData.samplingTime.earlyMorning},
                    gmp2_sampling_time = ${sanitizedData.samplingTime.gmp2},
                    evening_sampling_temperature = ${sanitizedData.samplingTemperature.evening},
                    early_morning_sampling_temperature = ${sanitizedData.samplingTemperature.earlyMorning},
                    gmp2_sampling_temperature = ${sanitizedData.samplingTemperature.gmp2},
                    ph_20c_evening = ${sanitizedData.ph20C.evening},
                    ph_20c_early_morning = ${sanitizedData.ph20C.earlyMorning},
                    ph_20c_gmp2 = ${sanitizedData.ph20C.gmp2},
                    evening_temperature = ${sanitizedData.temperature.evening},
                    early_morning_temperature = ${sanitizedData.temperature.earlyMorning},
                    gmp2_temperature = ${sanitizedData.temperature.gmp2},
                    titratable_acidity_evening = ${sanitizedData.titratableAcidity.evening},
                    titratable_acidity_early_morning = ${sanitizedData.titratableAcidity.earlyMorning},
                    titratable_acidity_gmp2 = ${sanitizedData.titratableAcidity.gmp2},
                    density_20c_evening = ${sanitizedData.density20C.evening},
                    density_20c_early_morning = ${sanitizedData.density20C.earlyMorning},
                    density_20c_gmp2 = ${sanitizedData.density20C.gmp2},
                    fat_content_evening = ${sanitizedData.fatContent.evening},
                    fat_content_early_morning = ${sanitizedData.fatContent.earlyMorning},
                    fat_content_gmp2 = ${sanitizedData.fatContent.gmp2},
                    non_fat_solids_evening = ${sanitizedData.nonFatSolids.evening},
                    non_fat_solids_early_morning = ${sanitizedData.nonFatSolids.earlyMorning},
                    non_fat_solids_gmp2 = ${sanitizedData.nonFatSolids.gmp2},
                    alcohol_test_evening = ${sanitizedData.alcoholTest.evening},
                    alcohol_test_early_morning = ${sanitizedData.alcoholTest.earlyMorning},
                    alcohol_test_gmp2 = ${sanitizedData.alcoholTest.gmp2},
                    tram_evening = ${sanitizedData.tram.evening},
                    tram_early_morning = ${sanitizedData.tram.earlyMorning},
                    tram_gmp2 = ${sanitizedData.tram.gmp2}
                WHERE id = ${parsedReportId} AND user_id = ${userId}
                RETURNING id
            `;

            if (!result.length) {
                return json({ success: false, error: 'Report not found or unauthorized' }, { status: 404 });
            }

            return json({ success: true, id: result[0].id }, { status: 200 });
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
                FROM diarylab.raw_milk
                WHERE id = ${parsedReportId} AND user_id = ${userId}
                FOR UPDATE
            `;

            if (!checkResult.length) {
                return json({ success: false, error: 'Report not found or unauthorized' }, { status: 404 });
            }

            const deleteResult = await sql`
                DELETE FROM diarylab.raw_milk
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