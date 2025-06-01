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
  n: 'hcL1hF1k7uEdBLBJyjAb_mNTOXo6v-6hkx09rEBGZ_xA5pe3DfArudoYcW1s_p5_RiyRTtI05WanBsDHy4A5uYYOPE84iYnj7W2f9wbEduZs8RIpvaUgF2NO4UP54zqRDOkQKHkB6KBMH-fMfA-n3aUf3fG-i0iNndUo5s1UxP8zLyrBapMVRaHOJbXknCtwr0OgN8ukZro502U_eaC57-aEwPaze358-YdBBFtZY8F346JppKirXB_zgPH7gHth4cw0UhewVN5ifK837-CsBs6tfGKpPOnEHXNdNYH0YorDZSl6tj0omaPxbt9UfKeild3e9nkCeSr1diGMqfwzjw',
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