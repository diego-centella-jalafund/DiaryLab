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

        const values = [
            formData.date ? new Date(formData.date) : null,
            formData.analysisDate ? new Date(formData.analysisDate) : null,
            formData.sampleNumber1 ? sanitizeHtml(formData.sampleNumber1) : null,
            formData.productionDate1 ? new Date(formData.productionDate1) : null,
            formData.expirationDate1 ? new Date(formData.expirationDate1) : null,
            formData.samplingTime1 ? sanitizeHtml(formData.samplingTime1) : null,
            formData.productTemperature1 ? parseFloat(formData.productTemperature1) : null,
            formData.coldChamberTemperature1 ? parseFloat(formData.coldChamberTemperature1) : null,
            formData.netContent1 ? parseFloat(formData.netContent1) : null,
            formData.sampleNumber2 ? sanitizeHtml(formData.sampleNumber2) : null,
            formData.productionDate2 ? new Date(formData.productionDate2) : null,
            formData.expirationDate2 ? new Date(formData.expirationDate2) : null,
            formData.samplingTime2 ? sanitizeHtml(formData.samplingTime2) : null,
            formData.productTemperature2 ? parseFloat(formData.productTemperature2) : null,
            formData.coldChamberTemperature2 ? parseFloat(formData.coldChamberTemperature2) : null,
            formData.netContent2 ? parseFloat(formData.netContent2) : null,
            formData.sampleNumber3 ? sanitizeHtml(formData.sampleNumber3) : null,
            formData.productionDate3 ? new Date(formData.productionDate3) : null,
            formData.expirationDate3 ? new Date(formData.expirationDate3) : null,
            formData.samplingTime3 ? sanitizeHtml(formData.samplingTime3) : null,
            formData.productTemperature3 ? parseFloat(formData.productTemperature3) : null,
            formData.coldChamberTemperature3 ? parseFloat(formData.coldChamberTemperature3) : null,
            formData.netContent3 ? parseFloat(formData.netContent3) : null,
            formData.sampleNumber4 ? sanitizeHtml(formData.sampleNumber4) : null,
            formData.productionDate4 ? new Date(formData.productionDate4) : null,
            formData.expirationDate4 ? new Date(formData.expirationDate4) : null,
            formData.samplingTime4 ? sanitizeHtml(formData.samplingTime4) : null,
            formData.productTemperature4 ? parseFloat(formData.productTemperature4) : null,
            formData.coldChamberTemperature4 ? parseFloat(formData.coldChamberTemperature4) : null,
            formData.netContent4 ? parseFloat(formData.netContent4) : null,
            formData.sampleNumber5 ? sanitizeHtml(formData.sampleNumber5) : null,
            formData.productionDate5 ? new Date(formData.productionDate5) : null,
            formData.expirationDate5 ? new Date(formData.expirationDate5) : null,
            formData.samplingTime5 ? sanitizeHtml(formData.samplingTime5) : null,
            formData.productTemperature5 ? parseFloat(formData.productTemperature5) : null,
            formData.coldChamberTemperature5 ? parseFloat(formData.coldChamberTemperature5) : null,
            formData.netContent5 ? parseFloat(formData.netContent5) : null,
            formData.fatContentM1 ? parseFloat(formData.fatContentM1) : null,
            formData.fatContentM2 ? parseFloat(formData.fatContentM2) : null,
            formData.fatContentM3 ? parseFloat(formData.fatContentM3) : null,
            formData.fatContentM4 ? parseFloat(formData.fatContentM4) : null,
            formData.fatContentM5 ? parseFloat(formData.fatContentM5) : null,
            formData.fatContentObservation ? sanitizeHtml(formData.fatContentObservation) : null,
            formData.sngM1 ? parseFloat(formData.sngM1) : null,
            formData.sngM2 ? parseFloat(formData.sngM2) : null,
            formData.sngM3 ? parseFloat(formData.sngM3) : null,
            formData.sngM4 ? parseFloat(formData.sngM4) : null,
            formData.sngM5 ? parseFloat(formData.sngM5) : null,
            formData.sngObservation ? sanitizeHtml(formData.sngObservation) : null,
            formData.titratableAcidityM1 ? parseFloat(formData.titratableAcidityM1) : null,
            formData.titratableAcidityM2 ? parseFloat(formData.titratableAcidityM2) : null,
            formData.titratableAcidityM3 ? parseFloat(formData.titratableAcidityM3) : null,
            formData.titratableAcidityM4 ? parseFloat(formData.titratableAcidityM4) : null,
            formData.titratableAcidityM5 ? parseFloat(formData.titratableAcidityM5) : null,
            formData.titratableAcidityObservation ? sanitizeHtml(formData.titratableAcidityObservation) : null,
            formData.phM1 ? parseFloat(formData.phM1) : null,
            formData.phM2 ? parseFloat(formData.phM2) : null,
            formData.phM3 ? parseFloat(formData.phM3) : null,
            formData.phM4 ? parseFloat(formData.phM4) : null,
            formData.phM5 ? parseFloat(formData.phM5) : null,
            formData.phObservation ? sanitizeHtml(formData.phObservation) : null,
            formData.phTemperatureM1 ? parseFloat(formData.phTemperatureM1) : null,
            formData.phTemperatureM2 ? parseFloat(formData.phTemperatureM2) : null,
            formData.phTemperatureM3 ? parseFloat(formData.phTemperatureM3) : null,
            formData.phTemperatureM4 ? parseFloat(formData.phTemperatureM4) : null,
            formData.phTemperatureM5 ? parseFloat(formData.phTemperatureM5) : null,
            formData.phTemperatureObservation ? sanitizeHtml(formData.phTemperatureObservation) : null,
            formData.colorM1 ? sanitizeHtml(formData.colorM1) : null,
            formData.colorM2 ? sanitizeHtml(formData.colorM2) : null,
            formData.colorM3 ? sanitizeHtml(formData.colorM3) : null,
            formData.colorM4 ? sanitizeHtml(formData.colorM4) : null,
            formData.colorM5 ? sanitizeHtml(formData.colorM5) : null,
            formData.colorObservation ? sanitizeHtml(formData.colorObservation) : null,
            formData.smellM1 ? sanitizeHtml(formData.smellM1) : null,
            formData.smellM2 ? sanitizeHtml(formData.smellM2) : null,
            formData.smellM3 ? sanitizeHtml(formData.smellM3) : null,
            formData.smellM4 ? sanitizeHtml(formData.smellM4) : null,
            formData.smellM5 ? sanitizeHtml(formData.smellM5) : null,
            formData.smellObservation ? sanitizeHtml(formData.smellObservation) : null,
            formData.tasteM1 ? sanitizeHtml(formData.tasteM1) : null,
            formData.tasteM2 ? sanitizeHtml(formData.tasteM2) : null,
            formData.tasteM3 ? sanitizeHtml(formData.tasteM3) : null,
            formData.tasteM4 ? sanitizeHtml(formData.tasteM4) : null,
            formData.tasteM5 ? sanitizeHtml(formData.tasteM5) : null,
            formData.tasteObservation ? sanitizeHtml(formData.tasteObservation) : null,
            formData.appearanceM1 ? sanitizeHtml(formData.appearanceM1) : null,
            formData.appearanceM2 ? sanitizeHtml(formData.appearanceM2) : null,
            formData.appearanceM3 ? sanitizeHtml(formData.appearanceM3) : null,
            formData.appearanceM4 ? sanitizeHtml(formData.appearanceM4) : null,
            formData.appearanceM5 ? sanitizeHtml(formData.appearanceM5) : null,
            formData.appearanceObservation ? sanitizeHtml(formData.appearanceObservation) : null,
            formData.bacteriologicalQualityM1 ? sanitizeHtml(formData.bacteriologicalQualityM1) : null,
            formData.bacteriologicalQualityM2 ? sanitizeHtml(formData.bacteriologicalQualityM2) : null,
            formData.bacteriologicalQualityM3 ? sanitizeHtml(formData.bacteriologicalQualityM3) : null,
            formData.bacteriologicalQualityM4 ? sanitizeHtml(formData.bacteriologicalQualityM4) : null,
            formData.bacteriologicalQualityM5 ? sanitizeHtml(formData.bacteriologicalQualityM5) : null,
            formData.coliformCountM1 ? parseInt(formData.coliformCountM1, 10) : null,
            formData.coliformCountM2 ? parseInt(formData.coliformCountM2, 10) : null,
            formData.coliformCountM3 ? parseInt(formData.coliformCountM3, 10) : null,
            formData.coliformCountM4 ? parseInt(formData.coliformCountM4, 10) : null,
            formData.coliformCountM5 ? parseInt(formData.coliformCountM5, 10) : null,
            formData.fecalColiformCountM1 ? parseInt(formData.fecalColiformCountM1, 10) : null,
            formData.fecalColiformCountM2 ? parseInt(formData.fecalColiformCountM2, 10) : null,
            formData.fecalColiformCountM3 ? parseInt(formData.fecalColiformCountM3, 10) : null,
            formData.fecalColiformCountM4 ? parseInt(formData.fecalColiformCountM4, 10) : null,
            formData.fecalColiformCountM5 ? parseInt(formData.fecalColiformCountM5, 10) : null,
            formData.eColiPresenceM1 || null,
            formData.eColiPresenceM2 || null,
            formData.eColiPresenceM3 || null,
            formData.eColiPresenceM4 || null,
            formData.eColiPresenceM5 || null,
            formData.moldYeastCountM1 ? parseInt(formData.moldYeastCountM1, 10) : null,
            formData.moldYeastCountM2 ? parseInt(formData.moldYeastCountM2, 10) : null,
            formData.moldYeastCountM3 ? parseInt(formData.moldYeastCountM3, 10) : null,
            formData.moldYeastCountM4 ? parseInt(formData.moldYeastCountM4, 10) : null,
            formData.moldYeastCountM5 ? parseInt(formData.moldYeastCountM5, 10) : null,
            userId
        ];

        const result = await sql`
            INSERT INTO diarylab.yogurt_fruited (
                sampling_date, analysis_date,
                sample_number1, production_date1, expiration_date1, sampling_time1, product_temperature1, cold_chamber_temperature1, net_content1,
                sample_number2, production_date2, expiration_date2, sampling_time2, product_temperature2, cold_chamber_temperature2, net_content2,
                sample_number3, production_date3, expiration_date3, sampling_time3, product_temperature3, cold_chamber_temperature3, net_content3,
                sample_number4, production_date4, expiration_date4, sampling_time4, product_temperature4, cold_chamber_temperature4, net_content4,
                sample_number5, production_date5, expiration_date5, sampling_time5, product_temperature5, cold_chamber_temperature5, net_content5,
                fat_content_m1, fat_content_m2, fat_content_m3, fat_content_m4, fat_content_m5, fat_content_observation,
                sng_m1, sng_m2, sng_m3, sng_m4, sng_m5, sng_observation,
                titratable_acidity_m1, titratable_acidity_m2, titratable_acidity_m3, titratable_acidity_m4, titratable_acidity_m5, titratable_acidity_observation,
                ph_m1, ph_m2, ph_m3, ph_m4, ph_m5, ph_observation,
                ph_temperature_m1, ph_temperature_m2, ph_temperature_m3, ph_temperature_m4, ph_temperature_m5, ph_temperature_observation,
                color_m1, color_m2, color_m3, color_m4, color_m5, color_observation,
                smell_m1, smell_m2, smell_m3, smell_m4, smell_m5, smell_observation,
                taste_m1, taste_m2, taste_m3, taste_m4, taste_m5, taste_observation,
                appearance_m1, appearance_m2, appearance_m3, appearance_m4, appearance_m5, appearance_observation,
                bacteriological_quality_m1, bacteriological_quality_m2, bacteriological_quality_m3, bacteriological_quality_m4, bacteriological_quality_m5,
                coliform_count_m1, coliform_count_m2, coliform_count_m3, coliform_count_m4, coliform_count_m5,
                fecal_coliform_count_m1, fecal_coliform_count_m2, fecal_coliform_count_m3, fecal_coliform_count_m4, fecal_coliform_count_m5,
                e_coli_presence_m1, e_coli_presence_m2, e_coli_presence_m3, e_coli_presence_m4, e_coli_presence_m5,
                mold_yeast_count_m1, mold_yeast_count_m2, mold_yeast_count_m3, mold_yeast_count_m4, mold_yeast_count_m5,
                user_id
            ) VALUES (
                ${values[0]}, ${values[1]}, ${values[2]}, ${values[3]}, ${values[4]}, ${values[5]}, ${values[6]}, ${values[7]}, ${values[8]},
                ${values[9]}, ${values[10]}, ${values[11]}, ${values[12]}, ${values[13]}, ${values[14]}, ${values[15]},
                ${values[16]}, ${values[17]}, ${values[18]}, ${values[19]}, ${values[20]}, ${values[21]}, ${values[22]},
                ${values[23]}, ${values[24]}, ${values[25]}, ${values[26]}, ${values[27]}, ${values[28]}, ${values[29]},
                ${values[30]}, ${values[31]}, ${values[32]}, ${values[33]}, ${values[34]}, ${values[35]}, ${values[36]},
                ${values[37]}, ${values[38]}, ${values[39]}, ${values[40]}, ${values[41]}, ${values[42]},
                ${values[43]}, ${values[44]}, ${values[45]}, ${values[46]}, ${values[47]}, ${values[48]},
                ${values[49]}, ${values[50]}, ${values[51]}, ${values[52]}, ${values[53]}, ${values[54]},
                ${values[55]}, ${values[56]}, ${values[57]}, ${values[58]}, ${values[59]}, ${values[60]},
                ${values[61]}, ${values[62]}, ${values[63]}, ${values[64]}, ${values[65]}, ${values[66]},
                ${values[67]}, ${values[68]}, ${values[69]}, ${values[70]}, ${values[71]}, ${values[72]},
                ${values[73]}, ${values[74]}, ${values[75]}, ${values[76]}, ${values[77]}, ${values[78]},
                ${values[79]}, ${values[80]}, ${values[81]}, ${values[82]}, ${values[83]}, ${values[84]},
                ${values[85]}, ${values[86]}, ${values[87]}, ${values[88]}, ${values[89]},
                ${values[90]}, ${values[91]}, ${values[92]}, ${values[93]}, ${values[94]},
                ${values[95]}, ${values[96]}, ${values[97]}, ${values[98]}, ${values[99]},
                ${values[100]}, ${values[101]}, ${values[102]}, ${values[103]}, ${values[104]},
                ${values[105]}, ${values[106]}, ${values[107]}, ${values[108]}, ${values[109]},
                ${values[110]}, ${values[111]}, ${values[112]}, ${values[113]}, ${values[114]},
                ${values[115]}, ${values[116]}
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
            SELECT id, sampling_date, user_id, sample_number1
            FROM diarylab.yogurt_fruited
            WHERE user_id = ${userId}
              AND sampling_date BETWEEN ${startDateObj} AND ${endDateObj}
            ORDER BY sampling_date ASC
        `;

        const reports = result.map((row: any) => ({
            id: row.id,
            date: row.sampling_date,
            userId: row.user_id,
            sampleNumber1: row.sample_number1
        }));

        return json({ reports }, { status: 200 });
    } catch (error) {
        console.error('Database query error (reports list):', error);
        return json({ error: 'Failed to fetch reports', details: error.message }, { status: 500 });
    }
};