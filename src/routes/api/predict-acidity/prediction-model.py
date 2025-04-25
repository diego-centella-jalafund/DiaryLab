import pandas as pd
import joblib
from datetime import datetime, timedelta
import numpy as np

model = joblib.load('acidity_model.pkl')

last_date = datetime.now().date()
reference_date = pd.to_datetime('2024-04-14').date()
days_since_start = (last_date - reference_date).days

avg_temperature = 20.0 
avg_ph_20c = 6.7        
avg_fat_matter = 3.5 
avg_no_fatty_solids = 8.5 
avg_densidity = 1.030   

predictions = []
for i in range(1, 8):
    future_day = days_since_start + i
    future_date = last_date + timedelta(days=i)
    temperature = np.clip(avg_temperature + np.random.uniform(-0.5, 0.5), 15, 25)
    ph_20c = np.clip(avg_ph_20c + np.random.uniform(-0.02, 0.02), 6.60, 6.80)
    fat_matter = np.clip(avg_fat_matter + np.random.uniform(-0.1, 0.1), 3.0, 4.5)
    no_fatty_solids = np.clip(avg_no_fatty_solids + np.random.uniform(-0.1, 0.1), 8.2, 9.0)
    densidity = np.clip(avg_densidity + np.random.uniform(-0.001, 0.001), 1.028, 1.034)


    future_data = pd.DataFrame({
        'days_since_start': [future_day],
        'temperature': [temperature],
        'ph_20c': [ph_20c],
        'fat_matter': [fat_matter],
        'no_fatty_solids': [no_fatty_solids],
        'densidity': [densidity]
    })

    acidity_predicted = model.predict(future_data)[0]

    acidity_predicted = np.clip(acidity_predicted, 0.13, 0.18)

    predictions.append({
        'date': future_date,
        'titratable_acidity_predicted': round(acidity_predicted, 3)
    })

for pred in predictions:
    print(f"Date: {pred['date']}, Titratable Acidity Predicted: {pred['titratable_acidity_predicted']}")