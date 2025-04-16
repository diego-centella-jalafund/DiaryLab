import pandas as pd
import joblib
from datetime import datetime, timedelta
import numpy as np

model = joblib.load('acidez_model.pkl')

last_date = datetime.now().date()
reference_date = pd.to_datetime('2024-04-14').date()
days_since_start = (last_date - reference_date).days

avg_temperatura = 20.0 
avg_ph_20c = 6.7        
avg_materia_grasa = 3.5 
avg_solidos_no_grasos = 8.5 
avg_densidad_20c = 1.030   

predictions = []
for i in range(1, 8):
    future_day = days_since_start + i
    future_date = last_date + timedelta(days=i)
    temperatura = np.clip(avg_temperatura + np.random.uniform(-0.5, 0.5), 15, 25)
    ph_20c = np.clip(avg_ph_20c + np.random.uniform(-0.02, 0.02), 6.60, 6.80)
    materia_grasa = np.clip(avg_materia_grasa + np.random.uniform(-0.1, 0.1), 3.0, 4.5)
    solidos_no_grasos = np.clip(avg_solidos_no_grasos + np.random.uniform(-0.1, 0.1), 8.2, 9.0)
    densidad_20c = np.clip(avg_densidad_20c + np.random.uniform(-0.001, 0.001), 1.028, 1.034)


    future_data = pd.DataFrame({
        'days_since_start': [future_day],
        'temperatura': [temperatura],
        'ph_20c': [ph_20c],
        'materia_grasa': [materia_grasa],
        'solidos_no_grasos': [solidos_no_grasos],
        'densidad_20c': [densidad_20c]
    })

    predicted_acidez = model.predict(future_data)[0]

    predicted_acidez = np.clip(predicted_acidez, 0.13, 0.18)

    predictions.append({
        'fecha': future_date,
        'acidez_tituable_predicha': round(predicted_acidez, 3)
    })

for pred in predictions:
    print(f"Fecha: {pred['fecha']}, Acidez Titulable Predicha: {pred['acidez_tituable_predicha']}")