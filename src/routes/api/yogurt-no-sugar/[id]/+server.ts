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
                FROM diarylab.non_sugar_yogurt
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
                samplingTime: row.sampling_time ?? null,
                responsibleAnalyst: row.responsible_analyst ?? null,
                sampleNumber: row.sample_number ?? null,
                production: {
                    batch: row.production_batch ?? null,
                    date: row.production_date ?? null,
                    expirationDate: row.expiration_date ?? null,
                    temperature: row.product_temperature ?? null,
                    coldChamberTemperature: row.cold_chamber_temperature ?? null,
                    netContent: row.net_content ?? null,
                },
                measurements: {
                    fatContent: row.fat_content ?? null,
                    sng: row.sng ?? null,
                    titratableAcidity: row.titratable_acidity ?? null,
                    phAcidity: row.ph_acidity ?? null,
                    phTemperature: row.ph_temperature ?? null,
                    color: row.color ?? null,
                    odor: row.odor ?? null,
                    flavor: row.flavor ?? null,
                    appearance: row.appearance ?? null,
                },
                bacteriological: {
                    quality: row.bacteriological_quality ?? null,
                    totalColiforms: row.total_coliforms ?? null,
                    fecalColiforms: row.fecal_coliforms ?? null,
                    escherichiaColi: row.escherichia_coli ?? null,
                    yeastMoldCount: row.yeast_mold_count ?? null,
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
                UPDATE diarylab.non_sugar_yogurt
                SET sampling_date = ${formData.date || null},
                    analysis_date = ${formData.analysisDate || null},
                    sampling_time = ${formData.samplingTime || null},
                    responsible_analyst = ${formData.responsibleAnalyst || null},
                    sample_number = ${formData.sampleNumber || null},
                    production_batch = ${formData.productionLot || null},
                    production_date = ${formData.productionDate || null},
                    expiration_date = ${formData.expirationDate || null},
                    product_temperature = ${formData.temperature ? parseFloat(formData.temperature) : null},
                    cold_chamber_temperature = ${formData.coldChamber ? parseFloat(formData.coldChamber) : null},
                    net_content = ${formData.netContent ? parseFloat(formData.netContent) : null},
                    fat_content = ${formData.fatContent ? parseFloat(formData.fatContent) : null},
                    sng = ${formData.sng ? parseFloat(formData.sng) : null},
                    titratable_acidity = ${formData.titratableAcidity ? parseFloat(formData.titratableAcidity) : null},
                    ph_acidity = ${formData.ph20C ? parseFloat(formData.ph20C) : null},
                    ph_temperature = ${formData.analysisTemperature ? parseFloat(formData.analysisTemperature) : null},
                    color = ${formData.color || null},
                    odor = ${formData.odor || null},
                    flavor = ${formData.taste || null},
                    appearance = ${formData.appearance || null},
                    bacteriological_quality = ${formData.bacteriologicalQuality || null},
                    total_coliforms = ${formData.coliformCount ? parseFloat(formData.coliformCount) : null},
                    fecal_coliforms = ${formData.fecalColiforms ? parseFloat(formData.fecalColiforms) : null},
                    escherichia_coli = ${formData.escherichiaColi || null},
                    yeast_mold_count = ${formData.moldYeastCount ? parseFloat(formData.moldYeastCount) : null}
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
                FROM diarylab.non_sugar_yogurt
                WHERE id = ${parsedReportId} AND user_id = ${userId}
                FOR UPDATE
            `;

            if (!checkResult.length) {
                return json({ success: false, error: 'Report not found or unauthorized' }, { status: 404 });
            }

            const deleteResult = await sql`
                DELETE FROM diarylab.non_sugar_yogurt
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