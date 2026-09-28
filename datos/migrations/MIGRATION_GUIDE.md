# Guía de Gestión de Migraciones de Base de Datos (SQLite) - MultiOficios

Este documento explica cómo evolucionar y versionar el esquema de base de datos de MultiOficios sin pérdida de datos en entornos de desarrollo, producción (Hostinger VPS) o contenedores Docker.

---

## 1. Arquitectura de Datos con SQLite

SQLite es ideal para despliegues ligeros y de alto rendimiento gracias a:
- **Zero-Configuration**: No requiere servicio daemon secundario consumiendo RAM excesiva.
- **Modo WAL (Write-Ahead Logging)**: Permite lecturas concurrentes sin bloquear escrituras.
- **Volumen Persistente en Docker**: La base de datos reside en `./datos/multioficios.db`, mapeada a un volumen para que los reinicios de contenedores no borren la información.

---

## 2. Gestión de Migraciones con Flask-Migrate (Alembic)

Recomendado para entornos con Python Flask:

### Paso 1: Configuración de Variables de Entorno
```bash
export FLASK_APP=backend/app.py
```

### Paso 2: Inicializar el repositorio de migraciones (solo la primera vez)
```bash
flask db init
```

### Paso 3: Detectar cambios en los modelos (`backend/models.py`)
Al añadir nuevos campos (por ejemplo, `campo_arl_vigencia`):
```bash
flask db migrate -m "Agregar vigencia de poliza ARL a colaboradores"
```
Esto genera un archivo de migración versionado en `migrations/versions/xxxx_nombre.py`.

### Paso 4: Aplicar la migración a SQLite
```bash
flask db upgrade
```

### Paso 5: Revertir una migración si ocurre un error
```bash
flask db downgrade
```

---

## 3. Protocolo de Respaldo Pre-Migración en Producción (Hostinger)

Antes de ejecutar cualquier migración en el servidor Hostinger, ejecute siempre el script de backup:

```bash
# Crear copia de seguridad con fecha y hora
python3 datos/backup_util.py create

# O copiar manualmente el archivo SQLite:
cp datos/multioficios.db datos/backups/multioficios_backup_$(date +%Y%m%d_%H%M%S).db
```

---

## 4. Ejecución en Contenedor Docker

Para correr migraciones dentro del contenedor backend en producción:
```bash
docker exec -it multioficios_backend flask db upgrade
```
