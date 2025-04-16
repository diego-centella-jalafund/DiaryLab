import psycopg2
import pandas as pd
from datetime import datetime

DB_HOST = "localhost"
DB_PORT = "5439"
DB_NAME = "midb"
DB_USER = "usuario"
DB_PASS = "clave"

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
        fecha,
        temperatura_tarde, temperatura_madrugrada, temperatura_gmp2,
        ph_20c_tarde, ph_20c_madrugrada, ph_20c_gmp2,
        materia_grasa_tarde, materia_grasa_madrugrada, materia_grasa_gmp2,
        solidos_no_grasos_tarde, solidos_no_grasos_madrugrada, solidos_no_grasos_gmp2,
        densidad_20c_tarde, densidad_20c_madrugrada, densidad_20c_gmp2,
        acidez_tituable_tarde, acidez_tituable_madrugrada, acidez_tituable_gmp2
    FROM leche_cruda
    WHERE fecha IS NOT NULL
    ORDER BY fecha;
"""
cursor.execute(query)
rows = cursor.fetchall()

cursor.close()
conn.close()

columns = [
    'fecha',
    'temperatura_tarde', 'temperatura_madrugrada', 'temperatura_gmp2',
    'ph_20c_tarde', 'ph_20c_madrugrada', 'ph_20c_gmp2',
    'materia_grasa_tarde', 'materia_grasa_madrugrada', 'materia_grasa_gmp2',
    'solidos_no_grasos_tarde', 'solidos_no_grasos_madrugrada', 'solidos_no_grasos_gmp2',
    'densidad_20c_tarde', 'densidad_20c_madrugrada', 'densidad_20c_gmp2',
    'acidez_tituable_tarde', 'acidez_tituable_madrugrada', 'acidez_tituable_gmp2'
]
df = pd.DataFrame(rows, columns=columns)

data = []
for _, row in df.iterrows():
    fecha = pd.to_datetime(row['fecha'])

    if pd.notnull(row['acidez_tituable_tarde']):
        data.append({
            'fecha': fecha,
            'days_since_start': 0, 
            'temperatura': row['temperatura_tarde'],
            'ph_20c': row['ph_20c_tarde'],
            'materia_grasa': row['materia_grasa_tarde'],
            'solidos_no_grasos': row['solidos_no_grasos_tarde'],
            'densidad_20c': row['densidad_20c_tarde'],
            'acidez_tituable': row['acidez_tituable_tarde']
        })

    if pd.notnull(row['acidez_tituable_madrugrada']):
        data.append({
            'fecha': fecha,
            'days_since_start': 0,  
            'temperatura': row['temperatura_madrugrada'],
            'ph_20c': row['ph_20c_madrugrada'],
            'materia_grasa': row['materia_grasa_madrugrada'],
            'solidos_no_grasos': row['solidos_no_grasos_madrugrada'],
            'densidad_20c': row['densidad_20c_madrugrada'],
            'acidez_tituable': row['acidez_tituable_madrugrada']
        })

    if pd.notnull(row['acidez_tituable_gmp2']):
        data.append({
            'fecha': fecha,
            'days_since_start': 0,  
            'temperatura': row['temperatura_gmp2'],
            'ph_20c': row['ph_20c_gmp2'],
            'materia_grasa': row['materia_grasa_gmp2'],
            'solidos_no_grasos': row['solidos_no_grasos_gmp2'],
            'densidad_20c': row['densidad_20c_gmp2'],
            'acidez_tituable': row['acidez_tituable_gmp2']
        })

df_transformed = pd.DataFrame(data)
df_transformed = df_transformed.dropna(subset=['acidez_tituable', 'temperatura', 'ph_20c', 'materia_grasa', 'solidos_no_grasos', 'densidad_20c'])

reference_date = df_transformed['fecha'].min()
df_transformed['days_since_start'] = (df_transformed['fecha'] - reference_date).dt.days

df_transformed = df_transformed.drop(columns=['fecha'])

df_transformed.to_csv('leche_cruda_data.csv', index=False)

print("Datos extraídos y guardados en leche_cruda_data.csv")