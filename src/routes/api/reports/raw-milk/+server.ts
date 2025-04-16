import { json } from '@sveltejs/kit';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    user: 'usuario',
    host: 'localhost',
    database: 'midb',
    password: 'clave',
    port: 5439
});

export async function GET() {
    try {
        const result = await pool.query(`
            SELECT 
                fecha,
                ph_20c_tarde, ph_20c_madrugrada, ph_20c_gmp2
            FROM leche_cruda
            ORDER BY fecha;
        `);

        const transformedData = result.rows.map(row => ({
            fecha: row.fecha,
            ph_20c: {
                tarde: row.ph_20c_tarde,
                madrugrada: row.ph_20c_madrugrada,
                gmp2: row.ph_20c_gmp2
            }
        }));

        return json({ success: true, data: transformedData }, { status: 200 });
    } catch (error) {
        console.error('Error fetching data:', error);
        return json({ success: false, error: error.message }, { status: 500 });
    }
}