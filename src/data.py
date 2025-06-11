import psycopg2
from psycopg2 import sql
import random
from datetime import datetime, timedelta, time

DB_HOST = "localhost"
DB_PORT = "5439"
DB_NAME = "midb"
DB_USER = "user"
DB_PASS = "password"

def random_date():
    start_date = datetime.now() - timedelta(days=365)
    random_days = random.randint(0, 365)
    return start_date + timedelta(days=random_days)

def random_time_evening():
    hour = random.randint(15, 18)  
    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    return time(hour, minute, second)

def random_time_early_morning():
    hour = random.randint(3, 6)  
    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    return time(hour, minute, second)

def random_time_gmp2():
    hour = random.randint(4, 8)  
    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    return time(hour, minute, second)

try:
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )
    cursor = conn.cursor()

    for i in range(200):
        user_id = f"dc9790fb-d3dd-46d3-8c66-00f0b78f178e"

        date = random_date().date()
        analysis_date = date + timedelta(days=random.randint(0, 3))

        sample_number_evening = i
        sample_number_early_morning = i
        sample_number_gmp2 = i

        sampling_time_evening = random_time_evening()
        sampling_time_early_morning = random_time_early_morning()
        sampling_time_gmp2 = random_time_gmp2()

        sampling_temperature_evening = round(random.uniform(-2, 5), 2)  
        sampling_temperature_early_morning = round(random.uniform(20, 25), 2)
        sampling_temperature_gmp2 = round(random.uniform(-2, 5), 2)

        ph_20c_evening = round(random.uniform(6.60, 6.80), 2)  
        ph_20c_early_morning = round(random.uniform(6.60, 6.80), 2)
        ph_20c_gmp2 = round(random.uniform(6.60, 6.80), 2)

        temperature_evening = round(random.uniform(15, 25), 2)  
        temperature_early_morning = round(random.uniform(15, 25), 2)
        temperature_gmp2 = round(random.uniform(15, 25), 2)

        titratable_acidity_evening = round(random.uniform(0.13, 0.18), 2) 
        titratable_acidity_early_morning = round(random.uniform(0.13, 0.18), 2)
        titratable_acidity_gmp2 = round(random.uniform(0.13, 0.18), 2)

        density_20c_evening = round(random.uniform(1.028, 1.034), 3) 
        density_20c_early_morning = round(random.uniform(1.028, 1.034), 3)
        density_20c_gmp2 = round(random.uniform(1.028, 1.034), 3)

        fat_content_evening = round(random.uniform(3.0, 4.5), 2) 
        fat_content_early_morning = round(random.uniform(3.0, 4.5), 2)
        fat_content_gmp2 = round(random.uniform(3.0, 4.5), 2)

        non_fat_solids_evening = round(random.uniform(8.2, 9.0), 2) 
        non_fat_solids_early_morning = round(random.uniform(8.2, 9.0), 2)
        non_fat_solids_gmp2 = round(random.uniform(8.2, 9.0), 2)

        alcohol_test_evening = random.choice(["positive", "negative"])  
        alcohol_test_early_morning = random.choice(["positive", "negative"])
        alcohol_test_gmp2 = random.choice(["positive", "negative"])
     
        tram_evening = round(random.uniform(1.0, 6), 2) 
        tram_early_morning = round(random.uniform(1.0, 6), 2) 
        tram_gmp2 = round(random.uniform(1.0, 6), 2)

        insert_query = """
            INSERT INTO diarylab.raw_milk (
                date, analysis_date,
                evening_sample_number, early_morning_sample_number, gmp2_sample_number,
                evening_sampling_time, early_morning_sampling_time, gmp2_sampling_time,
                evening_sampling_temperature, early_morning_sampling_temperature, gmp2_sampling_temperature,
                ph_20c_evening, ph_20c_early_morning, ph_20c_gmp2,
                evening_temperature, early_morning_temperature, gmp2_temperature,
                titratable_acidity_evening, titratable_acidity_early_morning, titratable_acidity_gmp2,
                density_20c_evening, density_20c_early_morning, density_20c_gmp2,
                fat_content_evening, fat_content_early_morning, fat_content_gmp2,
                non_fat_solids_evening, non_fat_solids_early_morning, non_fat_solids_gmp2,
                alcohol_test_evening, alcohol_test_early_morning, alcohol_test_gmp2,
                tram_evening, tram_early_morning, tram_gmp2, user_id
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(insert_query, (
            date, analysis_date,
            sample_number_evening, sample_number_early_morning, sample_number_gmp2,
            sampling_time_evening, sampling_time_early_morning, sampling_time_gmp2,
            sampling_temperature_evening, sampling_temperature_early_morning, sampling_temperature_gmp2,
            ph_20c_evening, ph_20c_early_morning, ph_20c_gmp2,
            temperature_evening, temperature_early_morning, temperature_gmp2,
            titratable_acidity_evening, titratable_acidity_early_morning, titratable_acidity_gmp2,
            density_20c_evening, density_20c_early_morning, density_20c_gmp2,
            fat_content_evening, fat_content_early_morning, fat_content_gmp2,
            non_fat_solids_evening, non_fat_solids_early_morning, non_fat_solids_gmp2,
            alcohol_test_evening, alcohol_test_early_morning, alcohol_test_gmp2,
            tram_evening, tram_early_morning, tram_gmp2, user_id
        ))

    conn.commit()
    print("data uploaded success")

except Exception as e:
    print(f"Error: {e}")
    conn.rollback()

finally:
    if cursor:
        cursor.close()
    if conn:
        conn.close()
    print("connection close")