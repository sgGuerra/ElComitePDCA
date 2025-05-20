"""
Script para verificar y actualizar la estructura de la base de datos.
Este script asegura que las tablas usuarios y procesos tengan todos los campos necesarios.
"""

import sqlite3
import logging
from datetime import datetime

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Ruta a la base de datos
DB_PATH = 'database.sqlite'

def check_and_update_users_table():
    """Verificar y actualizar la tabla de usuarios si es necesario."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Verificar si existen las columnas created_at y updated_at en la tabla users
    cursor.execute("PRAGMA table_info(users)")
    columns = cursor.fetchall()
    column_names = [column[1] for column in columns]
    
    logger.info(f"Columnas existentes en la tabla users: {column_names}")
    
    # Añadir columna created_at si no existe
    if 'created_at' not in column_names:
        logger.info("Añadiendo columna created_at a la tabla users")
        cursor.execute("ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    
    # Añadir columna updated_at si no existe
    if 'updated_at' not in column_names:
        logger.info("Añadiendo columna updated_at a la tabla users")
        cursor.execute("ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    
    # Verificar usuarios sin campos de fecha y actualizarlos
    cursor.execute("SELECT id FROM users WHERE created_at IS NULL OR updated_at IS NULL")
    users_to_update = cursor.fetchall()
    
    if users_to_update:
        logger.info(f"Actualizando {len(users_to_update)} usuarios sin fechas")
        current_time = datetime.utcnow().isoformat()
        
        for user_id in users_to_update:
            cursor.execute(
                "UPDATE users SET created_at = ?, updated_at = ? WHERE id = ?",
                (current_time, current_time, user_id[0])
            )
    
    # Confirmar cambios
    conn.commit()
    conn.close()
    logger.info("Verificación y actualización de la tabla users completada")

def check_and_update_processes_table():
    """Verificar y actualizar la tabla de procesos si es necesario."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Verificar columnas en la tabla processes
    cursor.execute("PRAGMA table_info(processes)")
    columns = cursor.fetchall()
    column_names = [column[1] for column in columns]
    
    logger.info(f"Columnas existentes en la tabla processes: {column_names}")
    
    # Añadir columnas necesarias si no existen
    if 'created_at' not in column_names:
        logger.info("Añadiendo columna created_at a la tabla processes")
        cursor.execute("ALTER TABLE processes ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    
    if 'updated_at' not in column_names:
        logger.info("Añadiendo columna updated_at a la tabla processes")
        cursor.execute("ALTER TABLE processes ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    
    # Actualizar procesos sin fechas
    cursor.execute("SELECT id FROM processes WHERE created_at IS NULL OR updated_at IS NULL")
    processes_to_update = cursor.fetchall()
    
    if processes_to_update:
        logger.info(f"Actualizando {len(processes_to_update)} procesos sin fechas")
        current_time = datetime.utcnow().isoformat()
        
        for process_id in processes_to_update:
            cursor.execute(
                "UPDATE processes SET created_at = ?, updated_at = ? WHERE id = ?",
                (current_time, current_time, process_id[0])
            )
    
    # Confirmar cambios
    conn.commit()
    conn.close()
    logger.info("Verificación y actualización de la tabla processes completada")

if __name__ == "__main__":
    logger.info("Iniciando verificación de estructura de la base de datos")
    try:
        check_and_update_users_table()
        check_and_update_processes_table()
        logger.info("Actualización de la base de datos completada correctamente")
    except Exception as e:
        logger.error(f"Error durante la actualización de la base de datos: {e}", exc_info=True)
