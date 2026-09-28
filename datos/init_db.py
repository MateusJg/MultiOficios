"""
Script de Inicialización y Poblado de Datos (Seed) para SQLite
MultiOficios Database Bootstrap
"""

import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'multioficios.db')
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), 'schema.sql')

def init_database():
    print(f"[*] Inicializando base de datos SQLite en: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Ejecutar esquema DDL
    with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
        cursor.executescript(f.read())
    print("[✓] Tablas creadas e índices configurados exitosamente.")

    # Insertar colaboradores iniciales si la tabla está vacía
    cursor.execute("SELECT COUNT(*) FROM colaboradores")
    if cursor.fetchone()[0] == 0:
        colaboradores_seed = [
            (
                "Hernán Darío Velásquez",
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
                "Maestro Carpintero, Ebanista y Muebles Modulares",
                "carpinteria",
                4.6295,
                -74.1520,
                "Kennedy / Castilla",
                "Bogotá D.C.",
                4.9,
                31,
                14,
                39,
                1,
                "disponible_24h",
                125000,
                25000,
                "14 años de experiencia fabricando, armando e instalando cocinas integrales, closets empotrados y puertas entamboradas.",
                "Riesgo III",
                json.dumps(["Sierra circular", "Taladro percutor", "Router", "Nivel láser"]),
                "+57 312 458 9021"
            ),
            (
                "Wilson Alfonso Parra",
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
                "Técnico Certificado en Redes de Gas y Estufas Residenciales",
                "plomeria",
                4.6185,
                -74.1210,
                "Puente Aranda / Ciudad Montes",
                "Bogotá D.C.",
                4.9,
                71,
                16,
                82,
                1,
                "disponible_hoy",
                135000,
                28000,
                "16 años de experiencia en gasodomésticos. Certificación en redes de gas y mantenimiento de calentadores paso a paso.",
                "Riesgo III",
                json.dumps(["Detector de gas digital", "Manómetro diferencial", "Llaves Stillson"]),
                "+57 310 889 1234"
            ),
            (
                "Ingrid Tatiana Suárez",
                "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
                "Técnica Electricista Certificada Conteq - Redes y Tableros",
                "electricidad",
                4.6410,
                -74.0950,
                "Teusaquillo / Salitre",
                "Bogotá D.C.",
                5.0,
                52,
                9,
                58,
                1,
                "disponible_hoy",
                140000,
                30000,
                "Electricista matriculada con CONTE TE-1. Cableado estructurado, balanceo de tableros y certificación RETIE.",
                "Riesgo IV",
                json.dumps(["Multímetro Fluke", "Detector de tensión", "Destornilladores 1000V VDE"]),
                "+57 320 667 8901"
            )
        ]

        cursor.executemany("""
            INSERT INTO colaboradores (
                nombre, avatar_url, especialidad, categoria, lat, lng, barrio, ciudad,
                calificacion, total_resenas, anos_experiencia, obras_completadas, es_verificado,
                disponibilidad, tarifa_jornal, tarifa_hora, bio, arl_nivel, herramientas_json, telefono
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, colaboradores_seed)

        conn.commit()
        print(f"[✓] {len(colaboradores_seed)} colaboradores iniciales insertados con éxito.")

    conn.close()
    print("[✓] Inicialización de datos completada.")

if __name__ == '__main__':
    init_database()
