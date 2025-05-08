import { json } from '@sveltejs/kit';
import pkg from 'pg'; 
const { Pool } = pkg; 

const pool = new Pool({
    user: 'user',
    host: 'localhost',
    database: 'midb',
    password: 'password',
    port: 5439,
    options: '-c search_path=diarylab,public'
});

export async function POST({ request }) {
    try {
        const formData = await request.json();
        const query = `
            INSERT INTO raw_milk (
                date, analysis_date,
                evening_sample_number, early_morning_sample_number, gmp2_sample_number,
                evening_sampling_time, early_morning_sampling_time, gmp2_sampling_time,
                evening_sampling_temperature, early_morning_sampling_temperature, gmp2_sampling_temperature,
                ph_20c_evening, ph_20c_early_morning, ph_20c_gmp2,
                evening_temperature, early_morning_temperature, gmp2_temperature,
                titratable_acidity_evening, titratable_acidity_early_morning, titratable_acidity_gmp2,
                density_20c_evening, density_20c_early_morning, density_20c_gmp2,
                fat_content_evening, fat_content_early_morning, fat_content_gmp2,
                non_fat_solids_evening, non_fat_solids_early_morning, non_fat_solids_gmp2,
                alcohol_test_evening, alcohol_test_early_morning, alcohol_test_gmp2,
                tram_evening, tram_early_morning, tram_gmp2
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
            formData.date || null,
            formData.analysisDate || null,
            formData.sampleNumber.evening || null,
            formData.sampleNumber.earlyMorning || null,
            formData.sampleNumber.gmp2 || null,
            formData.samplingTime.evening || null,
            formData.samplingTime.earlyMorning || null,
            formData.samplingTime.gmp2 || null,
            formData.samplingTemperature.evening || null,
            formData.samplingTemperature.earlyMorning || null,
            formData.samplingTemperature.gmp2 || null,
            formData.ph20C.evening || null,
            formData.ph20C.earlyMorning || null,
            formData.ph20C.gmp2 || null,
            formData.temperature.evening || null,
            formData.temperature.earlyMorning || null,
            formData.temperature.gmp2 || null,
            formData.titratableAcidity.evening || null,
            formData.titratableAcidity.earlyMorning || null,
            formData.titratableAcidity.gmp2 || null,
            formData.density20C.evening || null,
            formData.density20C.earlyMorning || null,
            formData.density20C.gmp2 || null,
            formData.fatContent.evening || null,
            formData.fatContent.earlyMorning || null,
            formData.fatContent.gmp2 || null,
            formData.nonFatSolids.evening || null,
            formData.nonFatSolids.earlyMorning || null,
            formData.nonFatSolids.gmp2 || null,
            formData.alcoholTest.evening || null,
            formData.alcoholTest.earlyMorning || null,
            formData.alcoholTest.gmp2 || null,
            formData.tram.evening || null,
            formData.tram.earlyMorning || null,
            formData.tram.gmp2 || null
        ];

        await pool.query(query, values);

        return json({ message: 'data upload success' }, { status: 200 });
    } catch (error) {
        return json({ error: 'error to upload data' }, { status: 500 });
    }
}