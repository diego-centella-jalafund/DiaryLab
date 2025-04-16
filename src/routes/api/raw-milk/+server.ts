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

export async function POST({ request }) {
    try {
        const formData = await request.json();
        const query = `
            INSERT INTO leche_cruda (
                fecha, fecha_analisis,
                n_muestra_tarde, n_muestra_madrugrada, n_muestra_gmp2,
                hora_muestreo_tarde, hora_muestreo_madrugrada, hora_muestreo_gmp2,
                temp_muestreo_tarde, temp_muestreo_madrugrada, temp_muestreo_gmp2,
                ph_20c_tarde, ph_20c_madrugrada, ph_20c_gmp2,
                temperatura_tarde, temperatura_madrugrada, temperatura_gmp2,
                acidez_tituable_tarde, acidez_tituable_madrugrada, acidez_tituable_gmp2,
                densidad_20c_tarde, densidad_20c_madrugrada, densidad_20c_gmp2,
                materia_grasa_tarde, materia_grasa_madrugrada, materia_grasa_gmp2,
                solidos_no_grasos_tarde, solidos_no_grasos_madrugrada, solidos_no_grasos_gmp2,
                alcoholimetria_tarde, alcoholimetria_madrugrada, alcoholimetria_gmp2,
                tram_tarde, tram_madrugrada, tram_gmp2
            ) VALUES (
                $1, $2,
                $3, $4, $5,
                $6, $7, $8,
                $9, $10, $11,
                $12, $13, $14,
                $15, $16, $17,
                $18, $19, $20,
                $21, $22, $23,
                $24, $25, $26,
                $27, $28, $29,
                $30, $31, $32,
                $33, $34, $35
            )
        `;
        const values = [
            formData.fecha || null,
            formData.fechaAnalisis || null,
            formData.nMuestra.tarde || null,
            formData.nMuestra.madrugrada || null,
            formData.nMuestra.gmp2 || null,
            formData.horaMuestreo.tarde || null,
            formData.horaMuestreo.madrugrada || null,
            formData.horaMuestreo.gmp2 || null,
            formData.tempMuestreo.tarde || null,
            formData.tempMuestreo.madrugrada || null,
            formData.tempMuestreo.gmp2 || null,
            formData.ph20C.tarde || null,
            formData.ph20C.madrugrada || null,
            formData.ph20C.gmp2 || null,
            formData.temperatura.tarde || null,
            formData.temperatura.madrugrada || null,
            formData.temperatura.gmp2 || null,
            formData.acidezTituable.tarde || null,
            formData.acidezTituable.madrugrada || null,
            formData.acidezTituable.gmp2 || null,
            formData.densidad20C.tarde || null,
            formData.densidad20C.madrugrada || null,
            formData.densidad20C.gmp2 || null,
            formData.materiaGrasa.tarde || null,
            formData.materiaGrasa.madrugrada || null,
            formData.materiaGrasa.gmp2 || null,
            formData.solidosNoGrasos.tarde || null,
            formData.solidosNoGrasos.madrugrada || null,
            formData.solidosNoGrasos.gmp2 || null,
            formData.alcoholimetria.tarde || null,
            formData.alcoholimetria.madrugrada || null,
            formData.alcoholimetria.gmp2 || null,
            formData.tram.tarde || null,
            formData.tram.madrugrada || null,
            formData.tram.gmp2 || null
        ];

        await pool.query(query, values);

        return json({ message: 'Datos guardados exitosamente' }, { status: 200 });
    } catch (error) {
        console.error('Error saving raw milk data:', error);
        return json({ error: 'Error al guardar los datos' }, { status: 500 });
    }
}