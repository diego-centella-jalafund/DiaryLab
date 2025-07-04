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
            decodedToken = jwt.verify(token, KEYCLOAK_PUBLIC_KEY, { algorithms: ['RS256'] }) as { sub: string };
        } catch (error) {
            console.error('Token verification failed:', error);
            return json({ error: 'Invalid token', reason: 'token_invalid' }, { status: 401 });
        }

        const formData = await request.json();

        const query = `
            INSERT INTO semi_cheese (
                sampling_date, analysis_date, sampling_time, responsible_analyst, sample_number,
                production_batch, production_date, expiration_date, product_temperature,
                cold_chamber_temperature, net_content, fat_content, ph_acidity, ph_temperature,
                color, odor, flavor, appearance, bacteriological_quality, total_mesophilic_count,
                total_coliform_count, fecal_coliform_count, spore_forming_bacteria, escherichia_coli,
                salmonella_detection, user_id
            ) VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9,
                $10, $11, $12, $13, $14,
                $15, $16, $17, $18, $19, $20,
                $21, $22, $23, $24,
                $25, $26
            )
            RETURNING id;
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
            decodedToken = jwt.verify(token, KEYCLOAK_PUBLIC_KEY, { algorithms: ['RS256'] }) as { sub: string };
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
                FROM semi_cheese
                WHERE user_id = $1
                  AND sampling_date BETWEEN $2 AND $3
                ORDER BY sampling_date ASC
            `;
            const result = await client.query(query, [userId, startDate, endDate]);
            console.log('Query result rows:', result.rows);

            const reports = result.rows.map((row) => ({
                id: row.id,
                date: row.sampling_date,
                userId: row.user_id,
                sampleNumber: row.sample_number
            }));

            return json({ reports }, { status: 200 });
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