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
DB_USER = "user"
DB_PASS = "password"

conn = psycopg2.connect(
    host=DB_HOST,
    port=DB_PORT,
    database=DB_NAME,
    user=DB_USER,
    password=DB_PASS
)

query = """
    SELECT 
        date,
        evening_temperature, early_morning_temperature, gmp2_temperature,
        ph_20c_evening, ph_20c_early_morning, ph_20c_gmp2,
        fat_content_evening, fat_content_early_morning, fat_content_gmp2,
        non_fat_solids_evening, non_fat_solids_early_morning, non_fat_solids_gmp2,
        density_20c_evening, density_20c_early_morning, density_20c_gmp2,
        titratable_acidity_evening, titratable_acidity_early_morning, titratable_acidity_gmp2
    FROM raw_milk
"""
df = pd.read_sql(query, conn)

conn.close()

data = []
reference_date = pd.to_datetime('2024-04-14').date()

for _, row in df.iterrows():
    date = row['date']
    days_since_start = (date - reference_date).days

    data.append({
        'days_since_start': days_since_start,
        'temperature': row['evening_temperature'],
        'ph_20c': row['ph_20c_evening'],
        'fat_matter': row['fat_content_evening'],
        'no_fatty_solids': row['non_fat_solids_evening'],
        'densidity': row['density_20c_evening'],
        'titratable_acidity': row['titratable_acidity_evening'],
        'shift': 'evening'
    })

    data.append({
        'days_since_start': days_since_start,
        'temperature': row['early_morning_temperature'],
        'ph_20c': row['ph_20c_early_morning'],
        'fat_matter': row['fat_content_early_morning'],
        'no_fatty_solids': row['non_fat_solids_early_morning'],
        'densidity': row['density_20c_early_morning'],
        'titratable_acidity': row['titratable_acidity_early_morning'],
        'shift': 'early_morning'
    })

    data.append({
        'days_since_start': days_since_start,
        'temperature': row['gmp2_temperature'],
        'ph_20c': row['ph_20c_gmp2'],
        'fat_matter': row['fat_content_gmp2'],
        'no_fatty_solids': row['non_fat_solids_gmp2'],
        'densidity': row['density_20c_gmp2'],
        'titratable_acidity': row['titratable_acidity_gmp2'],
        'shift': 'gmp2'
    })

df_transformed = pd.DataFrame(data)

df_transformed = df_transformed.dropna()

features = ['days_since_start', 'temperature', 'ph_20c', 'fat_matter', 'no_fatty_solids', 'densidity']
target = 'titratable_acidity'

X = df_transformed[features]
y = df_transformed[target]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)

joblib.dump(model, 'acidity_model.pkl')
