import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import Papa from 'papaparse';
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';

const prisma = new PrismaClient();

const tempDir = path.join('/tmp', 'temp');
const cleanedFileName = 'fileTest_cleaned.csv';

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

export const POST: RequestHandler = async ({ request }) => {
    try {
        await fs.mkdir(tempDir, { recursive: true });
        const formData = await request.formData();
        const csvFile = formData.get('csvFile');

        if (!csvFile || !(csvFile instanceof File) || !csvFile.name.endsWith('.csv')) {
            return json({ error: 'Only CSV files are allowed.' }, { status: 400 });
        }

        const tempFilePath = path.join(tempDir, csvFile.name);
        const arrayBuffer = await csvFile.arrayBuffer();
        await fs.writeFile(tempFilePath, Buffer.from(arrayBuffer));

        const pythonScriptPath = path.join(process.cwd(), 'src/clean_automate_csv.py');
        const cleanedFilePath = path.join(tempDir, cleanedFileName);

        const pythonCommand = `python3 ${pythonScriptPath} ${tempFilePath}`;
        await new Promise((resolve, reject) => {
            exec(pythonCommand, { cwd: tempDir }, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing Python script: ${error.message}`);
                    reject(error);
                    return;
                }
                if (stderr) {
                    console.error(`Python script stderr: ${stderr}`);
                    reject(new Error(stderr));
                    return;
                }
                console.log(`Python script stdout: ${stdout}`);
                resolve(stdout);
            });
        });

        await fs.access(cleanedFilePath);
        const cleanedCsvData = await fs.readFile(cleanedFilePath, 'utf-8');

        const parsed = Papa.parse(cleanedCsvData, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header: string) => header.trim(),
            transform: (value: string) => value.trim(),
            dynamicTyping: false,
        });

        if (!parsed.data || parsed.data.length === 0) {
            return json({ error: 'No data found in the cleaned CSV file.' }, { status: 400 });
        }

        const expectedColumns: string[] = [
            'date', 'analysis_date', 'evening_sample_number', 'early_morning_sample_number', 'gmp2_sample_number',
            'evening_sampling_time', 'early_morning_sampling_time', 'gmp2_sampling_time',
            'evening_sampling_temperature', 'early_morning_sampling_temperature', 'gmp2_sampling_temperature',
            'ph_20c_evening', 'ph_20c_early_morning', 'ph_20c_gmp2',
            'evening_temperature', 'early_morning_temperature', 'gmp2_temperature',
            'titratable_acidity_evening', 'titratable_acidity_early_morning', 'titratable_acidity_gmp2',
            'density_20c_evening', 'density_20c_early_morning', 'density_20c_gmp2',
            'fat_content_evening', 'fat_content_early_morning', 'fat_content_gmp2',
            'non_fat_solids_evening', 'non_fat_solids_early_morning', 'non_fat_solids_gmp2',
            'alcohol_test_evening', 'alcohol_test_early_morning', 'alcohol_test_gmp2',
            'tram_evening', 'tram_early_morning', 'tram_gmp2'
        ];

        const csvColumns = Object.keys(parsed.data[0] || {});
        const extra = csvColumns.filter(col => !expectedColumns.includes(col));
        if (extra.length) {
            const errorMsg = `CSV contains unexpected columns: ${extra.join(', ')}.`;
            return json({ error: errorMsg }, { status: 400 });
        }

        const numericColumns = [
            'evening_sampling_temperature', 'early_morning_sampling_temperature', 'gmp2_sampling_temperature',
            'ph_20c_evening', 'ph_20c_early_morning', 'ph_20c_gmp2',
            'evening_temperature', 'early_morning_temperature', 'gmp2_temperature',
            'titratable_acidity_evening', 'titratable_acidity_early_morning', 'titratable_acidity_gmp2',
            'density_20c_evening', 'density_20c_early_morning', 'density_20c_gmp2',
            'fat_content_evening', 'fat_content_early_morning', 'fat_content_gmp2',
            'non_fat_solids_evening', 'non_fat_solids_early_morning', 'non_fat_solids_gmp2'
        ];

        const stringColumns = [
            'evening_sample_number', 'early_morning_sample_number', 'gmp2_sample_number',
            'alcohol_test_evening', 'alcohol_test_early_morning', 'alcohol_test_gmp2',
            'tram_evening', 'tram_early_morning', 'tram_gmp2'
        ];

        
        const authHeader = request.headers.get('Authorization');
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
                }
        
                const token = authHeader.replace('Bearer ', '');
                let decodedToken;
                try {
                    decodedToken = jwt.verify(token, KEYCLOAK_PUBLIC_KEY, { algorithms: ['RS256'] }) as { sub: string };
                } catch (error) {
                    console.error('Token verification failed:', error);
                    return json({ error: 'Invalid token', reason: 'token_invalid' }, { status: 401 });
                }

                const dataToInsert = parsed.data.map((row: { [key: string]: string }, index: number) => {
                  const record: { [key: string]: string | number | Date | null } = {};
                  for (const column of expectedColumns) {
                      const value = row[column];
                      if (value === '' || value === undefined || value === null) {
                          record[column] = null;
                      } else if (column === 'date' || column === 'analysis_date') {
                          const dateStr = value.trim();
                          const [year, month, day] = dateStr.split('-').map(Number);
                          const date = new Date(year, month - 1, day);
                          if (isNaN(date.getTime()) || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                              console.warn(`Invalid date value at row ${index + 2} for column ${column}: "${value}"`);
                              record[column] = null;
                              continue;
                          }
                          record[column] = date;
                      } else if (column === 'evening_sampling_time' || column === 'early_morning_sampling_time' || column === 'gmp2_sampling_time') {
                          const timeStr = value.trim();
                          const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/i);
                          if (!timeMatch) {
                              console.warn(`Invalid time value at row ${index + 2} for column ${column}: "${value}"`);
                              record[column] = null;
                              continue;
                          }
      
                          const [, hours, minutes, seconds, period] = timeMatch;
                          let hour = parseInt(hours, 10);
                          const minute = parseInt(minutes, 10);
                          const second = parseInt(seconds, 10);
                          if (period.toUpperCase() === 'PM' && hour !== 12) {
                              hour += 12;
                          } else if (period.toUpperCase() === 'AM' && hour === 12) {
                              hour = 0;
                          }
                          if (hour > 23 || minute > 59 || second > 59) {
                              console.warn(`Time value out of range at row ${index + 2} for column ${column}: "${value}"`);
                              record[column] = null;
                              continue;
                          }
      
                          const baseDate = record['date'] instanceof Date ? record['date'] : new Date('2024-01-01T00:00:00Z');
                          const timeDate = new Date(baseDate);
                          timeDate.setUTCHours(hour, minute, second, 0); 
      
                          record[column] = timeDate; 
                      } else if (numericColumns.includes(column)) {
                          const floatValue = parseFloat(value);
                          record[column] = isNaN(floatValue) ? null : floatValue;
                      } else if (stringColumns.includes(column)) {
                          record[column] = String(value);
                      } else {
                          record[column] = String(value);
                      }
                  }
                  record['user_id'] = decodedToken.sub;
                  return record;
              });
        console.log('Data to insert:', dataToInsert);

        await prisma.raw_milk.createMany({ data: dataToInsert });
        await fs.unlink(tempFilePath);
        await fs.unlink(cleanedFilePath);

        return json({ message: 'File uploaded', rowCount: dataToInsert.length });
    } catch (error: unknown) {
        console.error('Error processing CSV:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        try {
            await fs.unlink(path.join(tempDir, csvFile.name)).catch(() => {});
            await fs.unlink(path.join(tempDir, cleanedFileName)).catch(() => {});
        } catch (cleanupError) {
            console.error('Error cleaning up temp files:', cleanupError);
        }
        return json({ error: `Error processing file: ${errorMessage}` }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
};