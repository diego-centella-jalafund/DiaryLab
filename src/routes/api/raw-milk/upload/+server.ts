import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import Papa from 'papaparse';

const prisma = new PrismaClient();

export const POST: RequestHandler = async ({request}) => {
  try {

    const data = await request.formData();
    const csvFile = data.get('csvFile');

    if (!csvFile || !(csvFile instanceof File) || !csvFile.name.endsWith('.csv')) {
      return json({ error: 'Only CSV files are allowed.' }, { status: 400 });
    }

    const csvData = await csvFile.text();

    const parsed = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      transform: (value: string) => value.trim(),
      dynamicTyping: false,
    });

    if (!parsed.data || parsed.data.length === 0) {
      return json({ error: 'No data found in the CSV file.' }, { status: 400 });
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

    return json({ message: 'Data uploaded correctly' }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error processing CSV:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return json({ error: `Error processing file: ${errorMessage}` }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};