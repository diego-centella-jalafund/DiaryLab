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
                FROM butter
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
                samplingTime: row.sampling_time,
                responsibleAnalyst: row.responsible_analyst,
                sampleNumber: row.sample_number,
                production: {
                    batch: row.production_batch,
                    date: row.production_date,
                    expirationDate: row.expiration_date,
                    temperature: row.product_temperature,
                    coldChamberTemperature: row.cold_chamber_temperature,
                    netContent: row.net_content
                },
                measurements: {
                    fatContent: row.fat_content,
                    acidityPercent: row.acidity_percent,
                    phAcidity: row.ph_acidity,
                    phTemperature: row.ph_temperature,
                    meltingPoint: row.melting_point,
                    color: row.color,
                    odor: row.odor,
                    flavor: row.flavor,
                    texture: row.texture
                },
                bacteriological: {
                    quality: row.bacteriological_quality,
                    totalMesophilicCount: row.total_mesophilic_count,
                    totalColiformCount: row.total_coliform_count,
                    moldYeastCount: row.mold_yeast_count,
                    escherichiaColi: row.escherichia_coli,
                    salmonellaDetection: row.salmonella_detection
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
            UPDATE butter
            SET sampling_date = $1,
                analysis_date = $2,
                sampling_time = $3,
                responsible_analyst = $4,
                sample_number = $5,
                production_batch = $6,
                production_date = $7,
                expiration_date = $8,
                product_temperature = $9,
                cold_chamber_temperature = $10,
                net_content = $11,
                fat_content = $12,
                acidity_percent = $13,
                ph_acidity = $14,
                ph_temperature = $15,
                melting_point = $16,
                color = $17,
                odor = $18,
                flavor = $19,
                texture = $20,
                bacteriological_quality = $21,
                total_mesophilic_count = $22,
                total_coliform_count = $23,
                mold_yeast_count = $24,
                escherichia_coli = $25,
                salmonella_detection = $26
            WHERE id = $27 AND user_id = $28
            RETURNING *;
        `;

        const values = [
            formData.date || null,
            formData.analysisDate || null,
            formData.samplingTime || null,
            formData.responsibleAnalyst || null,
            formData.sampleNumber || null,
            formData.productionLot || null,
            formData.productionDate || null,
            formData.expirationDate || null,
            formData.temperature ? parseFloat(formData.temperature) : 0,
            formData.coldChamber ? parseFloat(formData.coldChamber) : 0,
            formData.netContent ? parseFloat(formData.netContent) : 0,
            formData.fatContent ? parseFloat(formData.fatContent) : 0,
            formData.acidityPercent ? parseFloat(formData.acidityPercent) : 0,
            formData.phAcidity ? parseFloat(formData.phAcidity) : 0,
            formData.phTemperature ? parseFloat(formData.phTemperature) : 0,
            formData.meltingPoint ? parseFloat(formData.meltingPoint) : 0,
            formData.color || '',
            formData.odor || '',
            formData.taste || '',
            formData.texture || '',
            formData.bacteriologicalQuality || '',
            formData.totalMesophilicCount ? parseFloat(formData.totalMesophilicCount) : 0,
            formData.totalColiformCount ? parseFloat(formData.totalColiformCount) : 0,
            formData.moldYeastCount ? parseFloat(formData.moldYeastCount) : 0,
            formData.escherichiaColi || false,
            formData.salmonellaDetection || false,
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
                FROM butter
                WHERE id = $1 AND user_id = $2
                FOR UPDATE
            `;
            const checkResult = await client.query(checkQuery, [parsedReportId, userId]);

            if (!checkResult.rows.length) {
                return json({ error: 'Report not found or unauthorized' }, { status: 404 });
            }

            const deleteQuery = `
                DELETE FROM butter
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