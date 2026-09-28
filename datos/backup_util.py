"""
MultiOficios Database Backup & Restore Utility
Manejo de copias de seguridad automáticas para SQLite
"""

import os
import shutil
import sqlite3
from datetime import datetime

BASE_DIR = os.path.dirname(__file__)
DB_FILE = os.path.join(BASE_DIR, 'multioficios.db')
BACKUPS_DIR = os.path.join(BASE_DIR, 'backups')

def ensure_backup_dir():
    if not os.path.exists(BACKUPS_DIR):
        os.makedirs(BACKUPS_DIR)

def create_backup():
    ensure_backup_dir()
    if not os.path.exists(DB_FILE):
        print("[!] No se encontró la base de datos para respaldar.")
        return

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = os.path.join(BACKUPS_DIR, f'multioficios_backup_{timestamp}.db')

    # Usar la API de backup de SQLite para garantizar consistencia atómica
    src = sqlite3.connect(DB_FILE)
    dst = sqlite3.connect(backup_file)
    with dst:
        src.backup(dst)
    dst.close()
    src.close()

    print(f"[✓] Copia de seguridad atómica creada exitosamente:\n    {backup_file}")

if __name__ == '__main__':
    create_backup()
