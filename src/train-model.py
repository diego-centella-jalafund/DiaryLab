import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error
import joblib
import psycopg2
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
"""
df = pd.read_sql(query, conn)


conn.close()

data = []
reference_date = pd.to_datetime('2024-04-14').date()

for _, row in df.iterrows():
    fecha = row['fecha']
    days_since_start = (fecha - reference_date).days

    data.append({
        'days_since_start': days_since_start,
        'temperatura': row['temperatura_tarde'],
        'ph_20c': row['ph_20c_tarde'],
        'materia_grasa': row['materia_grasa_tarde'],
        'solidos_no_grasos': row['solidos_no_grasos_tarde'],
        'densidad_20c': row['densidad_20c_tarde'],
        'acidez_tituable': row['acidez_tituable_tarde'],
        'turno': 'tarde'
    })

    data.append({
        'days_since_start': days_since_start,
        'temperatura': row['temperatura_madrugrada'],
        'ph_20c': row['ph_20c_madrugrada'],
        'materia_grasa': row['materia_grasa_madrugrada'],
        'solidos_no_grasos': row['solidos_no_grasos_madrugrada'],
        'densidad_20c': row['densidad_20c_madrugrada'],
        'acidez_tituable': row['acidez_tituable_madrugrada'],
        'turno': 'madrugrada'
    })

    data.append({
        'days_since_start': days_since_start,
        'temperatura': row['temperatura_gmp2'],
        'ph_20c': row['ph_20c_gmp2'],
        'materia_grasa': row['materia_grasa_gmp2'],
        'solidos_no_grasos': row['solidos_no_grasos_gmp2'],
        'densidad_20c': row['densidad_20c_gmp2'],
        'acidez_tituable': row['acidez_tituable_gmp2'],
        'turno': 'gmp2'
    })

df_transformed = pd.DataFrame(data)

df_transformed = df_transformed.dropna()

features = ['days_since_start', 'temperatura', 'ph_20c', 'materia_grasa', 'solidos_no_grasos', 'densidad_20c']
target = 'acidez_tituable'

X = df_transformed[features]
y = df_transformed[target]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)

joblib.dump(model, 'acidity_model.pkl')
