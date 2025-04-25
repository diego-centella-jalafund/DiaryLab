import { json } from '@sveltejs/kit';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    user: 'user',
    host: 'localhost',
    database: 'midb',
    password: 'password',
    port: 5439
});

export async function GET() {
    try {
        const result = await pool.query(`
            SELECT 
                date,
                ph_20c_evening, ph_20c_early_morning, ph_20c_gmp2
            FROM raw_milk
            ORDER BY date;
        `);

        const transformedData = result.rows.map(row => ({
            date: row.date,
            ph_20c: {
                evening: row.ph_20c_evening,
                earlyMorning: row.ph_20c_early_morning,
                gmp2: row.ph_20c_gmp2
            }
        }));

        return json({ success: true, data: transformedData }, { status: 200 });
    } catch (error) {
        return json({ success: false, error: error.message }, { status: 500 });
    }
}