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
(async () => {
    try {
        const client = await pool.connect();
        console.log('Database connected successfully');
        client.release();
    } catch (error) {
        console.error('Database connection failed:', error);
    }
})();

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
                FROM semi_cheese
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
                    phAcidity: row.ph_acidity,
                    phTemperature: row.ph_temperature,
                    color: row.color,
                    odor: row.odor,
                    flavor: row.flavor,
                    appearance: row.appearance
                },
                bacteriological: {
                    quality: row.bacteriological_quality,
                    totalMesophilicCount: row.total_mesophilic_count,
                    totalColiformCount: row.total_coliform_count,
                    fecalColiformCount: row.fecal_coliform_count,
                    sporeFormingBacteria: row.spore_forming_bacteria,
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
            UPDATE semi_cheese
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
                ph_acidity = $13,
                ph_temperature = $14,
                color = $15,
                odor = $16,
                flavor = $17,
                appearance = $18,
                bacteriological_quality = $19,
                total_mesophilic_count = $20,
                total_coliform_count = $21,
                fecal_coliform_count = $22,
                spore_forming_bacteria = $23,
                escherichia_coli = $24,
                salmonella_detection = $25
            WHERE id = $26 AND user_id = $27
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
            formData.phAcidity ? parseFloat(formData.phAcidity) : 0,
            formData.phTemperature ? parseFloat(formData.phTemperature) : 0,
            formData.color || '',
            formData.odor || '',
            formData.taste || '',
            formData.appearance || '',
            formData.bacteriologicalQuality || '',
            formData.totalMesophilicCount ? parseFloat(formData.totalMesophilicCount) : 0,
            formData.totalColiformCount ? parseFloat(formData.totalColiformCount) : 0,
            formData.fecalColiformCount ? parseFloat(formData.fecalColiformCount) : 0,
            formData.sporeFormingBacteria ? parseFloat(formData.sporeFormingBacteria) : 0,
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
                FROM semi_cheese
                WHERE id = $1 AND user_id = $2
                FOR UPDATE
            `;
            const checkResult = await client.query(checkQuery, [parsedReportId, userId]);

            if (!checkResult.rows.length) {
                return json({ error: 'Report not found or unauthorized' }, { status: 404 });
            }

            const deleteQuery = `
                DELETE FROM semi_cheese
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