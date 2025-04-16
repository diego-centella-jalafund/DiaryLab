import psycopg2
from psycopg2 import sql
import random
from datetime import datetime, timedelta, time

DB_HOST = "localhost"
DB_PORT = "5439"
DB_NAME = "midb"
DB_USER = "usuario"
DB_PASS = "clave"

def random_date():
    start_date = datetime.now() - timedelta(days=365)
    random_days = random.randint(0, 365)
    return start_date + timedelta(days=random_days)

def random_timeTarde():
    hour = random.randint(15, 18)  
    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    return time(hour, minute, second)

def random_timeMadrugada():
    hour = random.randint(3, 6)  
    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    return time(hour, minute, second)

def random_timeGmp2():
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

        fecha = random_date().date()
        fecha_analisis = fecha + timedelta(days=random.randint(0, 3))

    
        n_muestra_tarde = i
        n_muestra_madrugrada = i
        n_muestra_gmp2 = i

        hora_muestreo_tarde = random_timeTarde()
        hora_muestreo_madrugrada = random_timeMadrugada()
        hora_muestreo_gmp2 = random_timeGmp2()

        temp_muestreo_tarde = round(random.uniform(-2,5), 2)  
        temp_muestreo_madrugrada = round(random.uniform(20, 25), 2)
        temp_muestreo_gmp2 = round(random.uniform(-2, 5), 2)

        ph_20c_tarde = round(random.uniform(6.60, 6.80), 2)  
        ph_20c_madrugrada = round(random.uniform(6.60, 6.80), 2)
        ph_20c_gmp2 = round(random.uniform(6.60, 6.80), 2)

        temperatura_tarde = round(random.uniform(15, 25), 2)  
        temperatura_madrugrada = round(random.uniform(15, 25), 2)
        temperatura_gmp2 = round(random.uniform(15, 25), 2)

        acidez_tituable_tarde = round(random.uniform(0.13, 0.18), 2) 
        acidez_tituable_madrugrada = round(random.uniform(0.13, 0.18), 2)
        acidez_tituable_gmp2 = round(random.uniform(0.13, 0.18), 2)

        densidad_20c_tarde = round(random.uniform(1.028, 1.034), 3) 
        densidad_20c_madrugrada = round(random.uniform(1.028, 1.034), 3)
        densidad_20c_gmp2 = round(random.uniform(1.028, 1.034), 3)

        materia_grasa_tarde = round(random.uniform(3.0, 4.5), 2) 
        materia_grasa_madrugrada = round(random.uniform(3.0, 4.5), 2)
        materia_grasa_gmp2 = round(random.uniform(3.0, 4.5), 2)

        solidos_no_grasos_tarde = round(random.uniform(8.2, 9.0), 2) 
        solidos_no_grasos_madrugrada = round(random.uniform(8.2, 9.0), 2)
        solidos_no_grasos_gmp2 = round(random.uniform(8.2, 9.0), 2)

        alcoholimetria_tarde = random.choice(["positivo", "negativa"])  
        alcoholimetria_madrugrada = random.choice(["positivo", "negativa"])
        alcoholimetria_gmp2 = random.choice(["positivo", "negativa"])
     
        tram_tarde = round(random.uniform(1.0, 6), 2) 
        tram_madrugrada = round(random.uniform(1.0, 6), 2) 
        tram_gmp2 = round(random.uniform(1.0, 6), 2) 

        insert_query = """
            INSERT INTO leche_cruda (
                fecha, fecha_analisis,
                n_muestra_tarde, n_muestra_madrugrada, n_muestra_gmp2,
                hora_muestreo_tarde, hora_muestreo_madrugrada, hora_muestreo_gmp2,
                temp_muestreo_tarde, temp_muestreo_madrugrada, temp_muestreo_gmp2,
                ph_20c_tarde, ph_20c_madrugrada, ph_20c_gmp2,
                temperatura_tarde, temperatura_madrugrada, temperatura_gmp2,
                acidez_tituable_tarde, acidez_tituable_madrugrada, acidez_tituable_gmp2,
                densidad_20c_tarde, densidad_20c_madrugrada, densidad_20c_gmp2,
                materia_grasa_tarde, materia_grasa_madrugrada, materia_grasa_gmp2,
                solidos_no_grasos_tarde, solidos_no_grasos_madrugrada, solidos_no_grasos_gmp2,
                alcoholimetria_tarde, alcoholimetria_madrugrada, alcoholimetria_gmp2,
                tram_tarde, tram_madrugrada, tram_gmp2
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(insert_query, (
            fecha, fecha_analisis,
            n_muestra_tarde, n_muestra_madrugrada, n_muestra_gmp2,
            hora_muestreo_tarde, hora_muestreo_madrugrada, hora_muestreo_gmp2,
            temp_muestreo_tarde, temp_muestreo_madrugrada, temp_muestreo_gmp2,
            ph_20c_tarde, ph_20c_madrugrada, ph_20c_gmp2,
            temperatura_tarde, temperatura_madrugrada, temperatura_gmp2,
            acidez_tituable_tarde, acidez_tituable_madrugrada, acidez_tituable_gmp2,
            densidad_20c_tarde, densidad_20c_madrugrada, densidad_20c_gmp2,
            materia_grasa_tarde, materia_grasa_madrugrada, materia_grasa_gmp2,
            solidos_no_grasos_tarde, solidos_no_grasos_madrugrada, solidos_no_grasos_gmp2,
            alcoholimetria_tarde, alcoholimetria_madrugrada, alcoholimetria_gmp2,
            tram_tarde, tram_madrugrada, tram_gmp2
        ))

    conn.commit()
    print("Se insertaron 200 registros en la tabla leche_cruda")

except Exception as e:
    print(f"Error: {e}")
    conn.rollback()

finally:
    if cursor:
        cursor.close()
    if conn:
        conn.close()
    print("Conexión cerrada")