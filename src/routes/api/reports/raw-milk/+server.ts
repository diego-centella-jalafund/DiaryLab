import { json } from '@sveltejs/kit';
import pkg from 'pg';
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
const { Pool } = pkg;


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
async function getPublicKey(): Promise<string> {
    const response = await fetch(`${process.env.KEYCLOAK_URL}/realms/diarylab/protocol/openid-connect/certs`);
    const jwks = await response.json();
    const jwk = jwks.keys.find((key: any) => key.use === 'sig' && key.kty === 'RSA');
    return jwkToPem(jwk);
}

let KEYCLOAK_PUBLIC_KEY: string | null = null;
(async () => {
    try {
        KEYCLOAK_PUBLIC_KEY = await getPublicKey();
        console.log('Keycloak public key fetched successfully');
    } catch (error) {
        console.error('Failed to initialize Keycloak public key:', error);
    }
})();

export async function GET({ request }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ success: false, error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    let userId;
    try {
      const decoded = jwt.verify(token, KEYCLOAK_PUBLIC_KEY, { algorithms: ['RS256'] });
      userId = decoded.sub;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return json({ success: false, error: 'Token expired', reason: 'token_expired' }, { status: 401 });
      }
      return json({ success: false, error: 'Invalid token: ' + error.message }, { status: 401 });
    }

    if (!userId) {
      return json({ success: false, error: 'User not identified' }, { status: 401 });
    }

    try {
      const result = await pool.query(
        `
        SELECT date, titratable_acidity_evening, titratable_acidity_early_morning, titratable_acidity_gmp2
        FROM raw_milk
        WHERE user_id = $1
        ORDER BY date;
      `,
        [userId]
      );
      const transformedData = result.rows.map((row) => ({
        date: row.date,
        titratable_acidity: {
          evening: row.titratable_acidity_evening,
          earlyMorning: row.titratable_acidity_early_morning,
          gmp2: row.titratable_acidity_gmp2,
        },
      }));

      return json({ success: true, data: transformedData }, { status: 200 });
    } catch (dbError) {
      return json({ success: false, error: 'Database error: ' + dbError.message }, { status: 500 });
    }
  } catch (error) {
    return json({ success: false, error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}