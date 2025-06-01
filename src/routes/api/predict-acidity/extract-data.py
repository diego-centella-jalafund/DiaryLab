import psycopg2
import pandas as pd
from datetime import datetime
import sys

if len(sys.argv) != 2:
    sys.exit(1)

user_id = sys.argv[1]

DB_HOST = "localhost"
DB_PORT = "5439"
DB_NAME = "midb"
DB_USER = "user"
DB_PASS = "password"

conn = psycopg2.connect(
    host=DB_HOST,
    port=DB_PORT,
    database=DB_NAME,
    user=DB_USER,
    password=DB_PASS
)
cursor = conn.cursor()

query = """
    SELECT 
        date,
        evening_temperature, early_morning_temperature, gmp2_temperature,
        ph_20c_evening, ph_20c_early_morning, ph_20c_gmp2,
        density_20c_evening, density_20c_early_morning, density_20c_gmp2,
        titratable_acidity_evening, titratable_acidity_early_morning, titratable_acidity_gmp2
    FROM diarylab.raw_milk
    WHERE date IS NOT NULL AND user_id = %s
    ORDER BY date;
"""

cursor.execute(query, (user_id,))
rows = cursor.fetchall()

cursor.close()
conn.close()

columns = [
    'date',
    'evening_temperature', 'early_morning_temperature', 'gmp2_temperature',
    'ph_20c_evening', 'ph_20c_early_morning', 'ph_20c_gmp2',
    'density_20c_evening', 'density_20c_early_morning', 'density_20c_gmp2',
    'titratable_acidity_evening', 'titratable_acidity_early_morning', 'titratable_acidity_gmp2'
]
df = pd.DataFrame(rows, columns=columns)

data = []
for _, row in df.iterrows():
    date = pd.to_datetime(row['date'])

    if pd.notnull(row['titratable_acidity_evening']):
        data.append({
            'date': date,
            'days_since_start': 0,
            'temperature': row['evening_temperature'],
            'ph_20c': row['ph_20c_evening'],
            'density_20c': row['density_20c_evening'],
            'titratable_acidity': row['titratable_acidity_evening']
        })

    if pd.notnull(row['titratable_acidity_early_morning']):
        data.append({
            'date': date,
            'days_since_start': 0,
            'temperature': row['early_morning_temperature'],
            'ph_20c': row['ph_20c_early_morning'],
            'density_20c': row['density_20c_early_morning'],
            'titratable_acidity': row['titratable_acidity_early_morning']
        })

    if pd.notnull(row['titratable_acidity_gmp2']):
        data.append({
            'date': date,
            'days_since_start': 0,
            'temperature': row['gmp2_temperature'],
            'ph_20c': row['ph_20c_gmp2'],
            'density_20c': row['density_20c_gmp2'],
            'titratable_acidity': row['titratable_acidity_gmp2']
        })

df_transformed = pd.DataFrame(data)
df_transformed = df_transformed.dropna(subset=['titratable_acidity', 'temperature', 'ph_20c', 'density_20c'])

reference_date = df_transformed['date'].min()
df_transformed['days_since_start'] = (df_transformed['date'] - reference_date).dt.days

df_transformed = df_transformed.drop(columns=['date'])

df_transformed.to_csv('raw_milk_data.csv', index=False)
