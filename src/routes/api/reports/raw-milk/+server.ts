import { json } from '@sveltejs/kit';
import pkg from 'pg';
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
const { Pool } = pkg;


const pool = new Pool({
  user: 'user',
  host: 'localhost',
  database: 'midb',
  password: 'password',
  port: 5439,
  options: '-c search_path=diarylab,public',
});

const jwk = {
    kty: 'RSA',
    n: 'q37khDwHgN98uMsZSBTbEHKD6zB-0EyL5cKcm9Q18SYpd24Q5Xobf5kEbSY45x-Uw9dJz54Qq35oseRs15anMLwdmcgInU4Sou7XTGkkjqwN9YIn7aB2CQjaiHygbO20vBQPeRILF5D7YC414twxHHIFJYgfRE8WJ2VmKIcXP-4AhfuAPFS8Yn3-2RNomHcIYucl1N80xVV8wlA2aSHdFs-gSCrU9TH0cVs3DCaeleZJsJtQ3F00Rdw7WplmEjCXftPosHsGtcYkurJTx_1IS97rZrVVaJhvk2dMtTTzuaH-CmVOVotiynXw4LLDAQwrwt5HAwSFcWxWWxxrqkECPQ', 
    e: 'AQAB', 
  };
const KEYCLOAK_PUBLIC_KEY = jwkToPem(jwk);

export async function GET({ request }) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return json({ success: false, error: 'No token provided' }, { status: 401 });
        }
    
        const token = authHeader.split(' ')[1];
    
        let userId: string | undefined;
        try {
          const decoded = jwt.verify(token, KEYCLOAK_PUBLIC_KEY, { algorithms: ['RS256'] }) as { sub: string };
          userId = decoded.sub;
        } catch (error) {
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