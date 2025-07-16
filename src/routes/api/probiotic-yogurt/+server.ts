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
            sampleNumber1: formData.sampleNumber1 ? sanitizeHtml(formData.sampleNumber1) : null,
            lot1: formData.lot1 ? sanitizeHtml(formData.lot1) : null,
            flavor1: formData.flavor1 ? sanitizeHtml(formData.flavor1) : null,
            productionDate1: formData.productionDate1 ? new Date(formData.productionDate1) : null,
            expirationDate1: formData.expirationDate1 ? new Date(formData.expirationDate1) : null,
            productionTemperature1: formData.productionTemperature1 ? parseFloat(formData.productionTemperature1) : null,
            coldChamberTemperature1: formData.coldChamberTemperature1 ? parseFloat(formData.coldChamberTemperature1) : null,
            samplingTime1: formData.samplingTime1 ? sanitizeHtml(formData.samplingTime1) : null,
            netContent1: formData.netContent1 ? parseFloat(formData.netContent1) : null,
            sampleNumber2: formData.sampleNumber2 ? sanitizeHtml(formData.sampleNumber2) : null,
            lot2: formData.lot2 ? sanitizeHtml(formData.lot2) : null,
            flavor2: formData.flavor2 ? sanitizeHtml(formData.flavor2) : null,
            productionDate2: formData.productionDate2 ? new Date(formData.productionDate2) : null,
            expirationDate2: formData.expirationDate2 ? new Date(formData.expirationDate2) : null,
            productionTemperature2: formData.productionTemperature2 ? parseFloat(formData.productionTemperature2) : null,
            coldChamberTemperature2: formData.coldChamberTemperature2 ? parseFloat(formData.coldChamberTemperature2) : null,
            samplingTime2: formData.samplingTime2 ? sanitizeHtml(formData.samplingTime2) : null,
            netContent2: formData.netContent2 ? parseFloat(formData.netContent2) : null,
            sampleNumber3: formData.sampleNumber3 ? sanitizeHtml(formData.sampleNumber3) : null,
            lot3: formData.lot3 ? sanitizeHtml(formData.lot3) : null,
            flavor3: formData.flavor3 ? sanitizeHtml(formData.flavor3) : null,
            productionDate3: formData.productionDate3 ? new Date(formData.productionDate3) : null,
            expirationDate3: formData.expirationDate3 ? new Date(formData.expirationDate3) : null,
            productionTemperature3: formData.productionTemperature3 ? parseFloat(formData.productionTemperature3) : null,
            coldChamberTemperature3: formData.coldChamberTemperature3 ? parseFloat(formData.coldChamberTemperature3) : null,
            samplingTime3: formData.samplingTime3 ? sanitizeHtml(formData.samplingTime3) : null,
            netContent3: formData.netContent3 ? parseFloat(formData.netContent3) : null,
            fatContentM1: formData.fatContentM1 ? parseFloat(formData.fatContentM1) : null,
            fatContentM2: formData.fatContentM2 ? parseFloat(formData.fatContentM2) : null,
            fatContentM3: formData.fatContentM3 ? parseFloat(formData.fatContentM3) : null,
            fatContentObservation: formData.fatContentObservation ? sanitizeHtml(formData.fatContentObservation) : null,
            sngM1: formData.sngM1 ? parseFloat(formData.sngM1) : null,
            sngM2: formData.sngM2 ? parseFloat(formData.sngM2) : null,
            sngM3: formData.sngM3 ? parseFloat(formData.sngM3) : null,
            sngObservation: formData.sngObservation ? sanitizeHtml(formData.sngObservation) : null,
            titratableAcidityM1: formData.titratableAcidityM1 ? parseFloat(formData.titratableAcidityM1) : null,
            titratableAcidityM2: formData.titratableAcidityM2 ? parseFloat(formData.titratableAcidityM2) : null,
            titratableAcidityM3: formData.titratableAcidityM3 ? parseFloat(formData.titratableAcidityM3) : null,
            titratableAcidityObservation: formData.titratableAcidityObservation ? sanitizeHtml(formData.titratableAcidityObservation) : null,
            phM1: formData.phM1 ? parseFloat(formData.phM1) : null,
            phM2: formData.phM2 ? parseFloat(formData.phM2) : null,
            phM3: formData.phM3 ? parseFloat(formData.phM3) : null,
            phObservation: formData.phObservation ? sanitizeHtml(formData.phObservation) : null,
            phTemperatureM1: formData.phTemperatureM1 ? parseFloat(formData.phTemperatureM1) : null,
            phTemperatureM2: formData.phTemperatureM2 ? parseFloat(formData.phTemperatureM2) : null,
            phTemperatureM3: formData.phTemperatureM3 ? parseFloat(formData.phTemperatureM3) : null,
            phTemperatureObservation: formData.phTemperatureObservation ? sanitizeHtml(formData.phTemperatureObservation) : null,
            colorM1: formData.colorM1 ? sanitizeHtml(formData.colorM1) : null,
            colorM2: formData.colorM2 ? sanitizeHtml(formData.colorM2) : null,
            colorM3: formData.colorM3 ? sanitizeHtml(formData.colorM3) : null,
            colorObservation: formData.colorObservation ? sanitizeHtml(formData.colorObservation) : null,
            smellM1: formData.smellM1 ? sanitizeHtml(formData.smellM1) : null,
            smellM2: formData.smellM2 ? sanitizeHtml(formData.smellM2) : null,
            smellM3: formData.smellM3 ? sanitizeHtml(formData.smellM3) : null,
            smellObservation: formData.smellObservation ? sanitizeHtml(formData.smellObservation) : null,
            tasteM1: formData.tasteM1 ? sanitizeHtml(formData.tasteM1) : null,
            tasteM2: formData.tasteM2 ? sanitizeHtml(formData.tasteM2) : null,
            tasteM3: formData.tasteM3 ? sanitizeHtml(formData.tasteM3) : null,
            tasteObservation: formData.tasteObservation ? sanitizeHtml(formData.tasteObservation) : null,
            appearanceM1: formData.appearanceM1 ? sanitizeHtml(formData.appearanceM1) : null,
            appearanceM2: formData.appearanceM2 ? sanitizeHtml(formData.appearanceM2) : null,
            appearanceM3: formData.appearanceM3 ? sanitizeHtml(formData.appearanceM3) : null,
            appearanceObservation: formData.appearanceObservation ? sanitizeHtml(formData.appearanceObservation) : null,
            probioticCountM1: formData.probioticCountM1 ? parseFloat(formData.probioticCountM1) : null,
            probioticCountM2: formData.probioticCountM2 ? parseFloat(formData.probioticCountM2) : null,
            probioticCountM3: formData.probioticCountM3 ? parseFloat(formData.probioticCountM3) : null,
            coliformCountM1: formData.coliformCountM1 ? parseInt(formData.coliformCountM1, 10) : null,
            coliformCountM2: formData.coliformCountM2 ? parseInt(formData.coliformCountM2, 10) : null,
            coliformCountM3: formData.coliformCountM3 ? parseInt(formData.coliformCountM3, 10) : null,
            fecalColiformCountM1: formData.fecalColiformCountM1 ? parseInt(formData.fecalColiformCountM1, 10) : null,
            fecalColiformCountM2: formData.fecalColiformCountM2 ? parseInt(formData.fecalColiformCountM2, 10) : null,
            fecalColiformCountM3: formData.fecalColiformCountM3 ? parseInt(formData.fecalColiformCountM3, 10) : null,
            eColiPresenceM1: formData.eColiPresenceM1 || null,
            eColiPresenceM2: formData.eColiPresenceM2 || null,
            eColiPresenceM3: formData.eColiPresenceM3 || null,
            moldYeastCountM1: formData.moldYeastCountM1 ? parseInt(formData.moldYeastCountM1, 10) : null,
            moldYeastCountM2: formData.moldYeastCountM2 ? parseInt(formData.moldYeastCountM2, 10) : null,
            moldYeastCountM3: formData.moldYeastCountM3 ? parseInt(formData.moldYeastCountM3, 10) : null,
            analysisTime: formData.analysisTime ? sanitizeHtml(formData.analysisTime) : null
        };

        const result = await sql`
            INSERT INTO diarylab.probiotic_yogurt (
                date, analysis_date,
                sample_number1, lot1, flavor1, production_date1, expiration_date1,
                production_temperature1, cold_chamber_temperature1, sampling_time1, net_content1,
                sample_number2, lot2, flavor2, production_date2, expiration_date2,
                production_temperature2, cold_chamber_temperature2, sampling_time2, net_content2,
                sample_number3, lot3, flavor3, production_date3, expiration_date3,
                production_temperature3, cold_chamber_temperature3, sampling_time3, net_content3,
                fat_content_m1, fat_content_m2, fat_content_m3, fat_content_observation,
                sng_m1, sng_m2, sng_m3, sng_observation,
                titratable_acidity_m1, titratable_acidity_m2, titratable_acidity_m3, titratable_acidity_observation,
                ph_m1, ph_m2, ph_m3, ph_observation,
                ph_temperature_m1, ph_temperature_m2, ph_temperature_m3, ph_temperature_observation,
                color_m1, color_m2, color_m3, color_observation,
                smell_m1, smell_m2, smell_m3, smell_observation,
                taste_m1, taste_m2, taste_m3, taste_observation,
                appearance_m1, appearance_m2, appearance_m3, appearance_observation,
                probiotic_count_m1, probiotic_count_m2, probiotic_count_m3,
                coliform_count_m1, coliform_count_m2, coliform_count_m3,
                fecal_coliform_count_m1, fecal_coliform_count_m2, fecal_coliform_count_m3,
                e_coli_presence_m1, e_coli_presence_m2, e_coli_presence_m3,
                mold_yeast_count_m1, mold_yeast_count_m2, mold_yeast_count_m3,
                analysis_time, user_id
            ) VALUES (
                ${sanitizedFormData.date},
                ${sanitizedFormData.analysisDate},
                ${sanitizedFormData.sampleNumber1},
                ${sanitizedFormData.lot1},
                ${sanitizedFormData.flavor1},
                ${sanitizedFormData.productionDate1},
                ${sanitizedFormData.expirationDate1},
                ${sanitizedFormData.productionTemperature1},
                ${sanitizedFormData.coldChamberTemperature1},
                ${sanitizedFormData.samplingTime1},
                ${sanitizedFormData.netContent1},
                ${sanitizedFormData.sampleNumber2},
                ${sanitizedFormData.lot2},
                ${sanitizedFormData.flavor2},
                ${sanitizedFormData.productionDate2},
                ${sanitizedFormData.expirationDate2},
                ${sanitizedFormData.productionTemperature2},
                ${sanitizedFormData.coldChamberTemperature2},
                ${sanitizedFormData.samplingTime2},
                ${sanitizedFormData.netContent2},
                ${sanitizedFormData.sampleNumber3},
                ${sanitizedFormData.lot3},
                ${sanitizedFormData.flavor3},
                ${sanitizedFormData.productionDate3},
                ${sanitizedFormData.expirationDate3},
                ${sanitizedFormData.productionTemperature3},
                ${sanitizedFormData.coldChamberTemperature3},
                ${sanitizedFormData.samplingTime3},
                ${sanitizedFormData.netContent3},
                ${sanitizedFormData.fatContentM1},
                ${sanitizedFormData.fatContentM2},
                ${sanitizedFormData.fatContentM3},
                ${sanitizedFormData.fatContentObservation},
                ${sanitizedFormData.sngM1},
                ${sanitizedFormData.sngM2},
                ${sanitizedFormData.sngM3},
                ${sanitizedFormData.sngObservation},
                ${sanitizedFormData.titratableAcidityM1},
                ${sanitizedFormData.titratableAcidityM2},
                ${sanitizedFormData.titratableAcidityM3},
                ${sanitizedFormData.titratableAcidityObservation},
                ${sanitizedFormData.phM1},
                ${sanitizedFormData.phM2},
                ${sanitizedFormData.phM3},
                ${sanitizedFormData.phObservation},
                ${sanitizedFormData.phTemperatureM1},
                ${sanitizedFormData.phTemperatureM2},
                ${sanitizedFormData.phTemperatureM3},
                ${sanitizedFormData.phTemperatureObservation},
                ${sanitizedFormData.colorM1},
                ${sanitizedFormData.colorM2},
                ${sanitizedFormData.colorM3},
                ${sanitizedFormData.colorObservation},
                ${sanitizedFormData.smellM1},
                ${sanitizedFormData.smellM2},
                ${sanitizedFormData.smellM3},
                ${sanitizedFormData.smellObservation},
                ${sanitizedFormData.tasteM1},
                ${sanitizedFormData.tasteM2},
                ${sanitizedFormData.tasteM3},
                ${sanitizedFormData.tasteObservation},
                ${sanitizedFormData.appearanceM1},
                ${sanitizedFormData.appearanceM2},
                ${sanitizedFormData.appearanceM3},
                ${sanitizedFormData.appearanceObservation},
                ${sanitizedFormData.probioticCountM1},
                ${sanitizedFormData.probioticCountM2},
                ${sanitizedFormData.probioticCountM3},
                ${sanitizedFormData.coliformCountM1},
                ${sanitizedFormData.coliformCountM2},
                ${sanitizedFormData.coliformCountM3},
                ${sanitizedFormData.fecalColiformCountM1},
                ${sanitizedFormData.fecalColiformCountM2},
                ${sanitizedFormData.fecalColiformCountM3},
                ${sanitizedFormData.eColiPresenceM1},
                ${sanitizedFormData.eColiPresenceM2},
                ${sanitizedFormData.eColiPresenceM3},
                ${sanitizedFormData.moldYeastCountM1},
                ${sanitizedFormData.moldYeastCountM2},
                ${sanitizedFormData.moldYeastCountM3},
                ${sanitizedFormData.analysisTime},
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
            SELECT id, date, user_id, sample_number1
            FROM diarylab.probiotic_yogurt
            WHERE user_id = ${userId}
              AND date BETWEEN ${startDateObj} AND ${endDateObj}
            ORDER BY date ASC
        `;

        const reports = result.map((row: any) => ({
            id: row.id,
            date: row.date,
            userId: row.user_id,
            sampleNumber1: row.sample_number1
        }));

        return json({ reports }, { status: 200 });
    } catch (error) {
        console.error('Database query error (reports list):', error);
        return json({ error: 'Failed to fetch reports', details: error.message }, { status: 500 });
    }
};