-- Migration 001: Initial Schema
-- Aplicada: 2026-03-20
-- Descripción: Creación de tablas de colaboradores, obras_contratadas, pagos_custodia, mensajes_chat y valoraciones.

CREATE TABLE IF NOT EXISTS _schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO _schema_migrations (version) VALUES ('001_initial_schema');
