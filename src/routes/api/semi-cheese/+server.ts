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

export const POST: RequestHandler = async ({ request }) => {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        let decodedToken: { sub: string };
        try {
            const publicKey = await getPublicKey();
            decodedToken = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as { sub: string };
        } catch (error) {
            console.error('Token verification failed:', error);
            return json({ error: 'Invalid token', reason: 'token_invalid' }, { status: 401 });
        }

        const userId = sanitizeHtml(decodedToken.sub);
        const formData = await request.json();

        const values = [
            formData.date ? new Date(formData.date) : null,
            formData.analysisDate ? new Date(formData.analysisDate) : null,
            formData.samplingTime ? sanitizeHtml(formData.samplingTime) : null,
            formData.responsibleAnalyst ? sanitizeHtml(formData.responsibleAnalyst) : null,
            formData.sampleNumber ? sanitizeHtml(formData.sampleNumber) : null,
            formData.productionLot ? sanitizeHtml(formData.productionLot) : null,
            formData.productionDate ? new Date(formData.productionDate) : null,
            formData.expirationDate ? new Date(formData.expirationDate) : null,
            formData.temperature ? parseFloat(formData.temperature) : null,
            formData.coldChamber ? parseFloat(formData.coldChamber) : null,
            formData.netContent ? parseFloat(formData.netContent) : null,
            formData.fatContent ? parseFloat(formData.fatContent) : null,
            formData.phAcidity ? parseFloat(formData.phAcidity) : null,
            formData.phTemperature ? parseFloat(formData.phTemperature) : null,
            formData.color ? sanitizeHtml(formData.color) : null,
            formData.odor ? sanitizeHtml(formData.odor) : null,
            formData.taste ? sanitizeHtml(formData.taste) : null,
            formData.appearance ? sanitizeHtml(formData.appearance) : null,
            formData.bacteriologicalQuality ? sanitizeHtml(formData.bacteriologicalQuality) : null,
            formData.totalMesophilicCount ? parseFloat(formData.totalMesophilicCount) : null,
            formData.totalColiformCount ? parseFloat(formData.totalColiformCount) : null,
            formData.fecalColiformCount ? parseFloat(formData.fecalColiformCount) : null,
            formData.sporeFormingBacteria ? parseFloat(formData.sporeFormingBacteria) : null,
            formData.escherichiaColi || null,
            formData.salmonellaDetection || null,
            userId
        ];

        const result = await sql`
            INSERT INTO diarylab.semi_cheese (
                sampling_date, analysis_date, sampling_time, responsible_analyst, sample_number,
                production_batch, production_date, expiration_date, product_temperature,
                cold_chamber_temperature, net_content, fat_content, ph_acidity, ph_temperature,
                color, odor, flavor, appearance, bacteriological_quality, total_mesophilic_count,
                total_coliform_count, fecal_coliform_count, spore_forming_bacteria, escherichia_coli,
                salmonella_detection, user_id
            ) VALUES (
                ${values[0]}, ${values[1]}, ${values[2]}, ${values[3]}, ${values[4]},
                ${values[5]}, ${values[6]}, ${values[7]}, ${values[8]}, ${values[9]},
                ${values[10]}, ${values[11]}, ${values[12]}, ${values[13]}, ${values[14]},
                ${values[15]}, ${values[16]}, ${values[17]}, ${values[18]}, ${values[19]},
                ${values[20]}, ${values[21]}, ${values[22]}, ${values[23]}, ${values[24]},
                ${values[25]}
            )
            RETURNING id
        `;

        return json({ message: 'Data uploaded successfully', id: result[0].id }, { status: 200 });
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
            const publicKey = await getPublicKey();
            decodedToken = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as { sub: string };
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

        const result = await sql`
            SELECT id, sampling_date, user_id, sample_number
            FROM diarylab.semi_cheese
            WHERE user_id = ${userId}
              AND sampling_date BETWEEN ${startDateObj} AND ${endDateObj}
            ORDER BY sampling_date ASC
        `;

        const reports = result.map((row: any) => ({
            id: row.id,
            date: row.sampling_date,
            userId: row.user_id,
            sampleNumber: row.sample_number
        }));

        return json({ reports }, { status: 200 });
    } catch (error) {
        console.error('Database query error (reports list):', error);
        return json({ error: 'Failed to fetch reports', details: error.message }, { status: 500 });
    }
};