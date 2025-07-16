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
        const sanitizedFormData = {
            date: formData.date ? new Date(formData.date) : null,
            analysisDate: formData.analysisDate ? new Date(formData.analysisDate) : null,
            samplingTime: formData.samplingTime || null,
            responsibleAnalyst: formData.responsibleAnalyst ? sanitizeHtml(formData.responsibleAnalyst) : null,
            sampleNumber: formData.sampleNumber ? sanitizeHtml(formData.sampleNumber) : null,
            productionLot: formData.productionLot ? sanitizeHtml(formData.productionLot) : null,
            productionDate: formData.productionDate ? new Date(formData.productionDate) : null,
            expirationDate: formData.expirationDate ? new Date(formData.expirationDate) : null,
            temperature: formData.temperature ? parseFloat(formData.temperature) : 0,
            coldChamber: formData.coldChamber ? parseFloat(formData.coldChamber) : 0,
            netContent: formData.netContent ? parseFloat(formData.netContent) : 0,
            fatContent: formData.fatContent ? parseFloat(formData.fatContent) : 0,
            acidityPercent: formData.acidityPercent ? parseFloat(formData.acidityPercent) : 0,
            phAcidity: formData.phAcidity ? parseFloat(formData.phAcidity) : 0,
            phTemperature: formData.phTemperature ? parseFloat(formData.phTemperature) : 0,
            meltingPoint: formData.meltingPoint ? parseFloat(formData.meltingPoint) : 0,
            color: formData.color ? sanitizeHtml(formData.color) : '',
            odor: formData.odor ? sanitizeHtml(formData.odor) : '',
            taste: formData.taste ? sanitizeHtml(formData.taste) : '',
            texture: formData.texture ? sanitizeHtml(formData.texture) : '',
            bacteriologicalQuality: formData.bacteriologicalQuality ? sanitizeHtml(formData.bacteriologicalQuality) : '',
            totalMesophilicCount: formData.totalMesophilicCount ? parseFloat(formData.totalMesophilicCount) : 0,
            totalColiformCount: formData.totalColiformCount ? parseFloat(formData.totalColiformCount) : 0,
            moldYeastCount: formData.moldYeastCount ? parseFloat(formData.moldYeastCount) : 0,
            escherichiaColi: formData.escherichiaColi || false,
            salmonellaDetection: formData.salmonellaDetection || false
        };
      

        const result = await sql`
            INSERT INTO diarylab.butter (
                sampling_date, analysis_date, sampling_time, responsible_analyst, sample_number,
                production_batch, production_date, expiration_date, product_temperature,
                cold_chamber_temperature, net_content, fat_content, acidity_percent, ph_acidity,
                ph_temperature, melting_point, color, odor, flavor, texture,
                bacteriological_quality, total_mesophilic_count, total_coliform_count, mold_yeast_count,
                escherichia_coli, salmonella_detection, user_id
            ) VALUES (
                ${sanitizedFormData.date},
                ${sanitizedFormData.analysisDate},
                ${sanitizedFormData.samplingTime},
                ${sanitizedFormData.responsibleAnalyst},
                ${sanitizedFormData.sampleNumber},
                ${sanitizedFormData.productionLot},
                ${sanitizedFormData.productionDate},
                ${sanitizedFormData.expirationDate},
                ${sanitizedFormData.temperature},
                ${sanitizedFormData.coldChamber},
                ${sanitizedFormData.netContent},
                ${sanitizedFormData.fatContent},
                ${sanitizedFormData.acidityPercent},
                ${sanitizedFormData.phAcidity},
                ${sanitizedFormData.phTemperature},
                ${sanitizedFormData.meltingPoint},
                ${sanitizedFormData.color},
                ${sanitizedFormData.odor},
                ${sanitizedFormData.taste},
                ${sanitizedFormData.texture},
                ${sanitizedFormData.bacteriologicalQuality},
                ${sanitizedFormData.totalMesophilicCount},
                ${sanitizedFormData.totalColiformCount},
                ${sanitizedFormData.moldYeastCount},
                ${sanitizedFormData.escherichiaColi},
                ${sanitizedFormData.salmonellaDetection},
                ${userId}
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
            FROM butter
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