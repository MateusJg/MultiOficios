# 👷 MultiOficios - Plataforma de Contratación de Oficios Varios por Obra o Labor

Plataforma web progresiva (PWA) de alto rendimiento para conectar clientes con técnicos y operarios independientes de oficios varios (albañilería, plomería, electricidad, pintura, carpintería, cerrajería, refrigeración, mantenimiento de lavadoras, cómputo, belleza y más) con **geolocalización en tiempo real**, **cálculo de distancias con la fórmula de Haversine**, **contratación por obra o labor con retención en custodia fiduciaria (Escrow)**, **pasarela de pagos PSE con más de 40 bancos colombianos**, **cobertura ARL**, **espacio de trabajo para técnicos**, **chat cifrado con notificaciones emergentes** y **consola de administración auditada**.

Construida con un **Stack Unificado 100% en TypeScript** (`React 19 + Vite + Tailwind CSS + Express + Node.js 22`), modular y contenedorizada con **Docker** y **Docker Compose**, lista para producción tanto en entornos cloud (Cloud Run / AI Studio) como en servidores VPS (**Hostinger**, Ubuntu 22.04/24.04 LTS).

---

## 🚀 1. Funcionalidades Principales de la Aplicación

### 📍 Geolocalización y Búsqueda Inteligente
* **Mapa Interactivo con Leaflet y OpenStreetMap**: Visualización de técnicos cercanos al usuario con pines personalizados según su oficio o especialidad.
* **Filtro de Radio Dinámico**: Ajuste del radio de búsqueda de 1 a 50 km con cálculo instantáneo de distancia mediante la **fórmula de Haversine** implementada en TypeScript.
* **Filtro por Categorías y Búsqueda en Vivo**: Búsqueda por texto (nombre, oficio, biografía, tarifa) y selección rápida por categorías de oficios varios.
* **Selector Manual de Ubicación**: Posibilidad de cambiar la ubicación de referencia en cualquier momento para cotizar servicios en diferentes barrios o ciudades.

### 🛡️ Contratación Segura por Obra o Labor (Escrow Fiduciario)
* **Retención de Fondos en Custodia**: El cliente abona el valor acordado al iniciar el contrato; el dinero permanece retenido y **solo se libera cuando el cliente aprueba y firma digitalmente el acta de entrega**.
* **Gestión de Póliza ARL**: Cobertura obligatoria de riesgos laborales para trabajos técnicos y de construcción.
* **Seguimiento de Obra en Vivo**: Bitácora cronológica con 5 estados del servicio:
  1. `Solicitado`: Contrato creado y fondos retenidos en custodia.
  2. `En Camino`: El técnico se desplaza al lugar de la obra.
  3. `En Progreso`: Ejecución de los trabajos en sitio.
  4. `Finalizado`: El técnico sube la evidencia fotográfica del trabajo completado.
  5. `Aprobado y Pagado`: El cliente revisa, califica y firma digitalmente el acta de entrega, liberando los fondos fiduciarios al técnico.

### 💳 Pasarela de Pagos Segura (PSE y Billeteras Digitales de Colombia)
* **Integración PSE con más de 40 entidades financieras**: Bancolombia, Nequi, Davivienda, Daviplata, Banco de Bogotá, BBVA, Scotiabank Colpatria, Nubank, Lulo Bank, Dale, Movii, Ualá, cooperativas financieras y más.
* **Emisión de Timbre Fiduciario Criptográfico**: Cada transacción genera un comprobante con identificador único (`AUTH-...`), código fiduciario (`FID-...`) y garantía legal de respaldo.

### 💼 Espacio de Trabajo del Técnico (`TechnicianWorkspace`)
* **Control de Disponibilidad en Vivo**: El colaborador puede alternar su estado entre *Disponible*, *Ocupado* o *Inactivo*.
* **Buzón de Mensajes y Solicitudes**: Bandeja centralizada de clientes interesados y cotizaciones activas.
* **Gestor de Trabajos en Curso**: Panel para actualizar el estado del servicio y reportar la finalización de la obra con notas y fotos.
* **Perfil Profesional y QR de Validación**: Código QR interactivo generado dinámicamente con la librería `qrcode` para que los clientes verifiquen la autenticidad y antecedentes del colaborador.

### 💬 Chat Privado Cifrado y Notificaciones
* **Mensajería Instantánea**: Canal de comunicación directo entre cliente y técnico vinculado a la obra o cotización.
* **Notificaciones Emergentes (Web Notification API)**: Alertas nativas en pantalla y teléfono móvil para nuevos mensajes o cambios en el estado del contrato.
* **Aviso Sonoro**: Retroalimentación acústica mediante la **Web Audio API** para alertar al usuario en tiempo real.

### 👑 Consola de Administración y Auditoría (`AdminPanel`)
* **Auditoría de Colaboradores**: Aprobación, rechazo, edición y verificación de identidad con cédula de ciudadanía.
* **Monitor de Contratos y Fondos en Custodia**: Visualización de todas las obras activas, montos en custodia y estado del Escrow.
* **Autenticación Protegida en Servidor**: Validación contra endpoint seguro `POST /api/admin/login` con emisión de tokens de sesión (`HMAC-SHA256`) válidos por 24 horas.

### 📱 PWA (Progressive Web App) y Modo Offline
* **Instalable en Móvil y Escritorio**: Web App Manifest completo con iconos adaptativos y banner asistido paso a paso para iOS (Safari), Android (Chrome) y navegadores integrados.
* **Service Worker con Workbox**: Almacenamiento en caché de activos estáticos e interfaz, con indicador visual de modo sin conexión (`OfflineIndicator`).

---

## 📁 2. Estructura del Código

```text
├── server.ts              # Servidor Full-Stack Express + Vite Middleware (desarrollo y producción)
├── vite.config.ts         # Configuración Vite + Tailwind CSS + PWA (Node.js 22 compatible)
├── package.json           # Dependencias de frontend y backend unificadas en TypeScript
├── tsconfig.json          # Configuración TypeScript estricta con Bundler, esModuleInterop y resolveJsonModule
├── index.html             # Entrypoint HTML con estilos, Leaflet y Preamble seguro
├── Dockerfile             # Multi-stage build (Node 22 Alpine -> Nginx) para el Frontend
├── Dockerfile.backend     # Contenedor para el Microservicio Backend Express (Node 22 Alpine + TSX)
├── docker-compose.yml     # Orquestación Docker para Frontend (Nginx 80) y Backend (Express 5000/5001)
├── nginx.conf             # Servidor web Nginx con compresión gzip, proxy inverso /api/ y headers de seguridad
├── metadata.json          # Metadatos del applet y configuración de permisos
├── firebase-applet-config.json # Credenciales de conexión a Firebase Firestore
├── firebase-blueprint.json # Esquema fiduciario de datos para Firebase
├── firestore.rules        # Reglas de seguridad para Firestore (acceso estricto)
│
├── src/                   # Código Fuente de la Aplicación React 19
│   ├── main.tsx           # Montaje de la app y registro del Service Worker PWA
│   ├── App.tsx            # Componente raíz con orquestación de estado global y vistas
│   ├── types.ts           # Definiciones de tipos (Colaboradores, Contratos, Oficios, Perfiles)
│   ├── index.css          # Estilos globales con Tailwind CSS
│   ├── vite-env.d.ts      # Declaraciones ambientales de TypeScript (PWA, Assets, QRCode)
│   │
│   ├── components/        # Componentes Modulares de la Interfaz
│   │   ├── Header.tsx                 # Barra superior de navegación y selector de perfiles
│   │   ├── InteractiveMap.tsx         # Mapa Leaflet con marcadores, radios y geocálculos
│   │   ├── CollaboratorCard.tsx       # Tarjetas de técnicos con distancia, estrellas y tarifas
│   │   ├── CollaboratorProfileModal.tsx # Perfil completo con experiencia, galería y QR
│   │   ├── HireModal.tsx              # Modal de contratación con Escrow, ARL y pasarela PSE (con banner Sandbox)
│   │   ├── TrackingModal.tsx          # Bitácora de seguimiento de obra y firma de acta (con banner Sandbox)
│   │   ├── PrivateChatModal.tsx       # Chat cifrado con soporte de audio y notificaciones
│   │   ├── TechnicianWorkspace.tsx    # Espacio de trabajo dedicado para colaboradores
│   │   ├── CollaboratorInboxModal.tsx # Bandeja de entrada de mensajes para técnicos
│   │   ├── CollaboratorPortalModal.tsx # Formulario de vinculación para nuevos operarios
│   │   ├── AdminPanelModal.tsx        # Consola administrativa para auditar técnicos y contratos
│   │   ├── AdminAuthModal.tsx         # Modal de autenticación administrativa protegida
│   │   ├── ProfileSelectModal.tsx     # Selector de rol (Modo Cliente vs. Modo Técnico)
│   │   ├── DockerArchitectureModal.tsx # Documentación interactiva de la arquitectura en Docker
│   │   ├── LocationModal.tsx          # Modal de selección manual de coordenadas/barrio
│   │   ├── HistoryModal.tsx           # Historial de contratos y recibos de pago
│   │   ├── PWAInstallButton.tsx       # Botón flotante para instalar como App nativa
│   │   └── OfflineIndicator.tsx       # Alerta sutil cuando no hay conexión a Internet
│   │
│   ├── data/
│   │   ├── mockData.ts        # Catálogo de oficios, categorías y datos base de colaboradores
│   │   └── pseBanks.ts        # Listado de más de 40 bancos y billeteras PSE en Colombia
│   │
│   ├── hooks/
│   │   ├── useOnlineStatus.ts # Detección del estado de conectividad en tiempo real
│   │   └── usePWAInstall.ts   # Detección del prompt de instalación de PWA y entornos OS
│   │
│   └── services/
│       ├── api.ts             # Cliente REST unificado con tipado y manejo seguro de errores
│       └── firebase.ts        # Integración con Firebase Firestore para persistencia en la nube
│
└── datos/                 # Base de Datos Relacional, Archivos JSON Persistentes y Migraciones
    ├── contratos.json     # Libro mayor de contratos fiduciarios (fuente de verdad en disco)
    ├── colaboradores.json # Registro de técnicos y tarifas auditadas
    ├── pagos.json         # Libro contable de transacciones fiduciarias autorizadas
    ├── schema.sql         # Esquema de tablas SQL (colaboradores, contratos, pagos, usuarios)
    ├── init_db.py         # Script de inicialización y siembra de base de datos
    ├── backup_util.py     # Script para respaldos y dumps automáticos
    └── migrations/        # Historial de migraciones y guía de actualización
```

---

## 🔌 3. Endpoints de la API REST (`/api/*`)

El servidor Express (`server.ts`, ejecutado directamente o vía `Dockerfile.backend`) expone las siguientes rutas:

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Estado de salud del servicio, versión de Node y arquitectura activa |
| `GET` | `/api/colaboradores` | Consulta de técnicos cercanos con filtros de radio, categoría y búsqueda por texto (cálculo de Haversine) |
| `GET` | `/api/colaboradores/:id` | Detalle exhaustivo de un colaborador con experiencia y certificaciones |
| `POST` | `/api/colaboradores` | Registro de nuevos técnicos u operarios desde el portal de vinculación |
| `PATCH` | `/api/colaboradores/:id/disponibilidad` | Actualización rápida de disponibilidad del técnico (`disponible`, `ocupado`, `inactivo`) |
| `PATCH` | `/api/colaboradores/:id/aprobacion` | Aprobación/rechazo administrativo de un colaborador verificado |
| `GET` | `/api/obras` | Listado general de contratos u órdenes de trabajo con filtros por colaborador o cliente |
| `POST` | `/api/obras/contratar` | Creación de contrato por obra o labor con depósito en custodia (Escrow) |
| `PATCH` | `/api/obras/:id/actualizar-estado` | Cambio de estado de la obra (`en_camino`, `en_progreso`, `finalizado`) con notas y evidencia fotográfica |
| `POST` | `/api/obras/:id/liberar-fondos` | Aprobación del cliente, firma digital del acta y liberación del Escrow |
| `POST` | `/api/pagos/iniciar` | Pasarela de pagos con emisión de código de autorización y sello de garantía fiduciaria |
| `POST` | `/api/admin/login` | Autenticación administrativa segura con emisión de token de sesión HMAC-SHA256 |
| `GET` | `/api/admin/verify` | Verificación de validez del token de sesión de administrador |
| `GET` | `/api/admin/escrow-ledger` | Consulta del libro mayor fiduciario (total en custodia, total desembolsado y auditoría) |
| `GET` | `/api/chat/:chatId/mensajes` | Obtención del historial de mensajes de una conversación |
| `POST` | `/api/chat/:chatId/mensajes` | Envío de nuevo mensaje con activación de notificación |
| `GET` | `/api/alias` | Consulta de alias de clientes para privacidad |
| `POST` | `/api/alias` | Asignación o actualización de alias |

---

## 🔑 4. Seguridad y Credenciales de Administrador

Para acceder a la **Consola de Administración y Auditoría**, las credenciales se validan en el servidor (`server.ts`):

* **Variable de Entorno:** `ADMIN_MASTER_PASSWORD` (definida en `.env.example`).
* La autenticación emite un token de sesión `HMAC-SHA256` con caducidad de 24 horas (`POST /api/admin/login`).
* No se permiten contraseñas inseguras por defecto en entornos de producción. Configure siempre su propia clave mediante la variable de entorno.

---

## 🛠️ 5. Guía de Ejecución Local y Despliegue

### Entorno de Desarrollo Local
```bash
# 1. Instalar dependencias del proyecto
npm install

# 2. Iniciar servidor unificado (Express en puerto 3000 + Vite middlewares)
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

### Verificación de Calidad y Tipos
```bash
# Comprobar tipos TypeScript (debe retornar 0 errores)
npm run lint

# Construir paquete de producción
npm run build
```

### Opción A: Despliegue con Docker Compose (2 Contenedores - Recomendado para Hostinger VPS)
El proyecto incluye orquestación multi-contenedor lista para producción en `docker-compose.yml`:

```bash
# 1. Configurar variables de entorno en el servidor
cp .env.example .env
nano .env   # Establecer ADMIN_MASTER_PASSWORD y ESCROW_SIGNING_SECRET

# 2. Construir y levantar los contenedores en segundo plano
docker compose up -d --build

# 3. Consultar el estado y verificar puertos
docker compose ps
```
* **Frontend SPA (Nginx en puerto 80)**: Sirve los archivos estáticos de la SPA con gzip y redirige transparentemente `/api/*` al backend.
* **Backend Express (Node.js en puerto 5000/5001)**: Gestiona la lógica fiduciaria, pasarela de pagos y base de datos persistente en el volumen `datos_volume`.

### Opción B: Despliegue como Monolito Node.js (1 Proceso / Cloud Run / VPS Directo)
```bash
# 1. Compilar aplicación frontend
npm run build

# 2. Ejecutar servidor unificado (Express sirve /dist y /api/*)
NODE_ENV=production PORT=3000 npm start
```

### 🔒 Variables de Entorno Obligatorias en Producción
Para evitar brechas de seguridad o degradación silenciosa, en `NODE_ENV=production` el servidor **falla de inmediato (throw)** si no se suministran las siguientes variables:
* `ADMIN_MASTER_PASSWORD`: Contraseña maestra del panel administrativo auditado.
* `ESCROW_SIGNING_SECRET`: Clave secreta para la firma criptográfica HMAC-SHA256 de recibos de pago y actas de custodia.
* `VITE_SEED_MOCK_DATA`: Si se establece en `false` (predeterminado), no inyecta colaboradores ficticios en Firestore.

---

## 🔐 6. Seguridad, Fideicomiso y Normativa
* **Fuente Única de Verdad Fiduciaria**: El servidor backend (`/api/obras/*` con persistencia en `datos/contratos.json`) es la única autoridad certificada para transacciones y liberación de fondos. Firestore actúa como canal de tiempo real para chat y mapa.
* **Protección contra Ataques de Tiempo (Timing Attacks)**: Comparación criptográfica constante con `crypto.timingSafeEqual` en autenticación y verificación de tokens fiduciarios.
* **Cumplimiento Ley 1581 de 2012 (Habeas Data - Colombia)**: Tratamiento consentido y seguro de datos personales y ubicación.
* **Custodia Fiduciaria (Escrow)**: Prevención de fraudes; los operarios tienen garantía de pago y los clientes solo desembolsan fondos al estar satisfechos con la labor entregada.
* **Cobertura ARL**: Protocolos de seguridad laboral para actividades operativas de alto riesgo (electricidad, alturas, plomería pesada).
