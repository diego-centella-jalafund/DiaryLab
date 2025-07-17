import { json } from '@sveltejs/kit';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import type { RequestHandler } from './$types';
import sanitizeHtml from 'sanitize-html';
import 'dotenv/config';

const connectionString: string = process.env.DATABASE_URL as string;
const sql = neon(connectionString);

async function getPublicKey() {
    try {
        const response = await fetch(`${process.env.KEYCLOAK_URL}/realms/diarylab/protocol/openid-connect/certs`);
        if (!response.ok) throw new Error('Failed to fetch JWKS');
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
            return json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        let decodedToken: { sub: string };
        try {
            const publicKey = await getPublicKey();
            decodedToken = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as { sub: string };
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

        const result = await sql`
            SELECT *
            FROM diarylab.butter
            WHERE id = ${parsedReportId} AND user_id = ${userId}
        `;

        if (!result.length) {
            return json({ error: 'Report not found' }, { status: 404 });
        }

        const row = result[0];
        const report = {
            id: row.id,
            samplingDate: row.sampling_date?? null,
            userId: row.user_id,
            analysisDate: row.analysis_date?? null,
            samplingTime: row.sampling_time ?? null,
            responsibleAnalyst: row.responsible_analyst?? null,
            sampleNumber: row.sample_number?? null,
            production: {
                batch: row.production_batch?? null,
                date: row.production_date?? null,
                expirationDate: row.expiration_date?? null,
                temperature: row.product_temperature?? null,
                coldChamberTemperature: row.cold_chamber_temperature?? null,
                netContent: row.net_content?? null,
            },
            measurements: {
                fatContent: row.fat_content?? null,
                acidityPercent: row.acidity_percent?? null,
                phAcidity: row.ph_acidity?? null,
                phTemperature: row.ph_temperature?? null,
                meltingPoint: row.melting_point?? null,
                color: row.color?? null,
                odor: row.odor?? null,
                flavor: row.flavor?? null,
                texture: row.texture?? null,
            },
            bacteriological: {
                quality: row.bacteriological_quality?? null,
                totalMesophilicCount: row.total_mesophilic_count?? null,
                totalColiformCount: row.total_coliform_count?? null,
                moldYeastCount: row.mold_yeast_count?? null,
                escherichiaColi: row.escherichia_coli?? null,
                salmonellaDetection: row.salmonella_detection?? null,
            },
            createdAt: row.created_at ?? null,
        };

        return json(report, { status: 200 });
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
            const publicKey = await getPublicKey();
            decodedToken = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as { sub: string };
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

        const result = await sql`
            UPDATE diarylab.butter
            SET
                sampling_date = ${formData.date || null},
                analysis_date = ${formData.analysisDate || null},
                sampling_time = ${formData.samplingTime || null},
                responsible_analyst = ${formData.responsibleAnalyst || null},
                sample_number = ${formData.sampleNumber || null},
                production_batch = ${formData.productionLot || null},
                production_date = ${formData.productionDate || null},
                expiration_date = ${formData.expirationDate || null},
                product_temperature = ${formData.temperature ? parseFloat(formData.temperature) : 0},
                cold_chamber_temperature = ${formData.coldChamber ? parseFloat(formData.coldChamber) : 0},
                net_content = ${formData.netContent ? parseFloat(formData.netContent) : 0},
                fat_content = ${formData.fatContent ? parseFloat(formData.fatContent) : 0},
                acidity_percent = ${formData.acidityPercent ? parseFloat(formData.acidityPercent) : 0},
                ph_acidity = ${formData.phAcidity ? parseFloat(formData.phAcidity) : 0},
                ph_temperature = ${formData.phTemperature ? parseFloat(formData.phTemperature) : 0},
                melting_point = ${formData.meltingPoint ? parseFloat(formData.meltingPoint) : 0},
                color = ${formData.color || ''},
                odor = ${formData.odor || ''},
                flavor = ${formData.taste || ''},
                texture = ${formData.texture || ''},
                bacteriological_quality = ${formData.bacteriologicalQuality || ''},
                total_mesophilic_count = ${formData.totalMesophilicCount ? parseFloat(formData.totalMesophilicCount) : 0},
                total_coliform_count = ${formData.totalColiformCount ? parseFloat(formData.totalColiformCount) : 0},
                mold_yeast_count = ${formData.moldYeastCount ? parseFloat(formData.moldYeastCount) : 0},
                escherichia_coli = ${formData.escherichiaColi || false},
                salmonella_detection = ${formData.salmonellaDetection || false}
            WHERE id = ${parsedReportId} AND user_id = ${userId}
            RETURNING *
        `;

        if (!result.length) {
            return json({ error: 'Report not found or unauthorized' }, { status: 404 });
        }

        return json({ message: 'Data updated successfully', data: result[0] }, { status: 200 });
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
            const publicKey = await getPublicKey();
            decodedToken = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as { sub: string };
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

        const checkResult = await sql`
            SELECT id
            FROM diarylab.butter
            WHERE id = ${parsedReportId} AND user_id = ${userId}
        `;

        if (!checkResult.length) {
            return json({ error: 'Report not found or unauthorized' }, { status: 404 });
        }

        const deleteResult = await sql`
            DELETE FROM diarylab.butter
            WHERE id = ${parsedReportId} AND user_id = ${userId}
            RETURNING id
        `;

        if (!deleteResult.length) {
            return json({ error: 'Report deletion failed' }, { status: 500 });
        }

        return json({ message: 'Report deleted successfully', id: parsedReportId }, { status: 200 });
    } catch (error) {
        console.error('Unexpected error:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};