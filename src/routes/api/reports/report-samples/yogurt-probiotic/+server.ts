import { json } from '@sveltejs/kit';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import sanitizeHtml from 'sanitize-html';
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

export async function GET({ request, url }) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return json({ success: false, error: 'No token provided' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
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

        if (!userId) {
            return json({ success: false, error: 'User not identified' }, { status: 401 });
        }

        const startDate = sanitizeHtml(url.searchParams.get('startDate') || '');
        const endDate = sanitizeHtml(url.searchParams.get('endDate') || '');
        if (!startDate || !endDate) {
            return json({ success: false, error: 'Missing startDate or endDate' }, { status: 400 });
        }

        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
            return json({ success: false, error: 'Invalid date format' }, { status: 400 });
        }

        try {
            const result = await sql`
                SELECT date, titratable_acidity_m1, titratable_acidity_m2, titratable_acidity_m3
                FROM diarylab.probiotic_yogurt
                WHERE user_id = ${userId}
                  AND date BETWEEN ${startDateObj} AND ${endDateObj}
                ORDER BY date ASC
            `;
            
            const transformedData = result.map((row: any) => ({
                sampling_date: row.date,
                titratableAcidityM1: row.titratable_acidity_m1 ?? null,
                titratableAcidityM2: row.titratable_acidity_m2 ?? null,
                titratableAcidityM3: row.titratable_acidity_m3 ?? null,
            }));

            return json({ success: true, data: transformedData }, { status: 200 });
        } catch (dbError) {
            console.error('Database error:', dbError);
            return json({ success: false, error: `Database error: ${(dbError as Error).message}` }, { status: 500 });
        }
    } catch (error) {
        console.error('Unexpected error:', error);
        return json({ success: false, error: `Internal server error: ${(error as Error).message}` }, { status: 500 });
    }
}