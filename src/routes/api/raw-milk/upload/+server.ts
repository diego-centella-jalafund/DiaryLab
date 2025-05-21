import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import Papa from 'papaparse';

const prisma = new PrismaClient();

const tempDir = path.join(process.cwd(), 'temp');
const cleanedFileName = 'fileTest_cleaned.csv';

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
      'evening_sampling_time', 'early_morning_sampling_time', 'gmp2_sampling_time',
      'alcohol_test_evening', 'alcohol_test_early_morning', 'alcohol_test_gmp2',
      'tram_evening', 'tram_early_morning', 'tram_gmp2'
    ];

    const dataToInsert = parsed.data.map((row: { [key: string]: string }) => {
      const record: { [key: string]: string | number | Date | null } = {};
      for (const column of expectedColumns) {
        const value = row[column];
        if (value === '' || value === undefined || value === null) {
          record[column] = null;
        } else if (column === 'date' || column === 'analysis_date') {
          const date = new Date(value);
          record[column] = isNaN(date.getTime()) ? null : date;
        } else if (numericColumns.includes(column)) {
          const floatValue = parseFloat(value);
          record[column] = isNaN(floatValue) ? null : floatValue;
        } else if (stringColumns.includes(column)) {
          record[column] = String(value);
        } else {
          record[column] = String(value);
        }
      }
      return record;
    });

    await prisma.raw_milk.createMany({ data: dataToInsert });
    await fs.unlink(tempFilePath);
    await fs.unlink(cleanedFilePath);

    return json({ message: 'File uploaded' });
  } catch (error: unknown) {
    console.error('Error processing CSV:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    try {
      await fs.unlink(path.join(tempDir, csvFile.name));
      await fs.unlink(path.join(tempDir, cleanedFileName));
    } catch (cleanupError) {
      console.error('Error cleaning up temp files:', cleanupError);
    }
    return json({ error: `Error processing file: ${errorMessage}` }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};