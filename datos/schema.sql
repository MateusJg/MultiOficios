-- =============================================================================
-- MultiOficios: Esquema de Base de Datos Relacional SQLite (Versión 1.0.0)
-- Optimizado para despliegues ligeros en Docker y Hostinger VPS
-- =============================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL; -- Write-Ahead Logging para alta concurrencia
PRAGMA synchronous = NORMAL;

-- 1. Tabla de Colaboradores / Técnicos de Oficios Varios
CREATE TABLE IF NOT EXISTS colaboradores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(120) NOT NULL,
    avatar_url VARCHAR(255),
    especialidad VARCHAR(150) NOT NULL,
    categoria VARCHAR(60) NOT NULL, -- carpinteria, plomeria, albanileria, etc.
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    barrio VARCHAR(100) NOT NULL,
    ciudad VARCHAR(60) DEFAULT 'Bogotá D.C.',
    calificacion REAL DEFAULT 5.0,
    total_resenas INTEGER DEFAULT 0,
    anos_experiencia INTEGER DEFAULT 5,
    obras_completadas INTEGER DEFAULT 0,
    es_verificado BOOLEAN DEFAULT 1,
    disponibilidad VARCHAR(40) DEFAULT 'disponible_hoy',
    tarifa_jornal INTEGER NOT NULL, -- Valor jornal (8h) en COP
    tarifa_hora INTEGER DEFAULT 25000,
    bio TEXT,
    arl_nivel VARCHAR(20) DEFAULT 'Riesgo III',
    herramientas_json TEXT DEFAULT '[]',
    telefono VARCHAR(30),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Obras Contratadas (Servicios por Obra o Labor)
CREATE TABLE IF NOT EXISTS obras_contratadas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id VARCHAR(80) NOT NULL,
    cliente_nombre VARCHAR(120) NOT NULL,
    colaborador_id INTEGER NOT NULL,
    tipo_servicio VARCHAR(40) DEFAULT 'jornal', -- jornal, por_obra, horas
    descripcion TEXT NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    monto_base INTEGER NOT NULL,
    tarifa_arl INTEGER DEFAULT 12000,
    tarifa_custodia INTEGER DEFAULT 8000,
    monto_total INTEGER NOT NULL,
    estado VARCHAR(50) DEFAULT 'fondos_en_custodia', 
    -- solicitado, fondos_en_custodia, en_camino, en_sitio, en_ejecucion, revision_calidad, finalizado
    bitacora_json TEXT DEFAULT '[]',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
);

-- 3. Tabla de Pagos en Custodia Fiduciaria (Escrow)
CREATE TABLE IF NOT EXISTS pagos_custodia (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    obra_id INTEGER NOT NULL UNIQUE,
    monto INTEGER NOT NULL,
    metodo VARCHAR(40) DEFAULT 'pse', -- pse, tarjeta, billetera
    estado_custodia VARCHAR(50) DEFAULT 'fondos_retenidos', -- fondos_retenidos, liberado_al_colaborador, en_disputa
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_liberacion TIMESTAMP NULL,
    FOREIGN KEY (obra_id) REFERENCES obras_contratadas(id) ON DELETE CASCADE
);

-- 4. Tabla de Mensajes de Chat Privado con Cifrado E2EE
CREATE TABLE IF NOT EXISTS mensajes_chat (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    obra_id INTEGER NOT NULL,
    remitente_id VARCHAR(80) NOT NULL,
    remitente_rol VARCHAR(30) NOT NULL, -- cliente, colaborador
    texto TEXT NOT NULL,
    foto_url VARCHAR(255) NULL,
    es_cifrado BOOLEAN DEFAULT 1,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (obra_id) REFERENCES obras_contratadas(id) ON DELETE CASCADE
);

-- 5. Tabla de Calificaciones y Valoraciones Verificadas
CREATE TABLE IF NOT EXISTS valoraciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    colaborador_id INTEGER NOT NULL,
    cliente_id VARCHAR(80) NOT NULL,
    cliente_nombre VARCHAR(120) NOT NULL,
    estrellas INTEGER CHECK(estrellas >= 1 AND estrellas <= 5),
    comentario TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
);

-- Índices geoespaciales y de búsqueda para alto rendimiento
CREATE INDEX IF NOT EXISTS idx_colab_geo ON colaboradores(lat, lng);
CREATE INDEX IF NOT EXISTS idx_colab_categoria ON colaboradores(categoria);
CREATE INDEX IF NOT EXISTS idx_obras_cliente ON obras_contratadas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_obras_colaborador ON obras_contratadas(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_chat_obra ON mensajes_chat(obra_id);
