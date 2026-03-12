-- Script de creación de base de datos basado en el diagrama ER
-- Sintaxis compatible con PostgreSQL (usando SERIAL para autoincrementables)

CREATE TABLE IF NOT EXISTS USUARIO (
    id_usuario SERIAL PRIMARY KEY,
    matricula_nomina VARCHAR(255),
    rol VARCHAR(50),
    funcion VARCHAR(255),
    contrasena_hash VARCHAR(255),
    estatus VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS LIBRO (
    id_libro SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    autor VARCHAR(255),
    editorial_clave VARCHAR(255),
    edicion VARCHAR(50),
    precio DECIMAL(10, 2),
    sinopsis TEXT,
    formato VARCHAR(50),
    estatus_catalogo VARCHAR(50),
    isbn VARCHAR(50),
    foto VARCHAR(255),
    costo_multa_base DECIMAL(10, 2)
);

CREATE TABLE IF NOT EXISTS UBICACION (
    id_ubicacion SERIAL PRIMARY KEY,
    estanteria VARCHAR(50),
    seccion VARCHAR(50),
    codigo_clasificacion VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS EJEMPLAR (
    id_ejemplar SERIAL PRIMARY KEY,
    id_libro INT REFERENCES LIBRO(id_libro) ON DELETE CASCADE,
    id_ubicacion INT REFERENCES UBICACION(id_ubicacion) ON DELETE SET NULL,
    codigo_inventario VARCHAR(100),
    tipo_disponibilidad VARCHAR(50),
    estatus VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS PRESTAMO (
    id_prestamo SERIAL PRIMARY KEY,
    id_usuario INT REFERENCES USUARIO(id_usuario) ON DELETE CASCADE,
    id_ejemplar INT REFERENCES EJEMPLAR(id_ejemplar) ON DELETE CASCADE,
    fecha_prestamo DATE,
    fecha_vencimiento DATE,
    estatus VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS RENOVACION (
    id_renovacion SERIAL PRIMARY KEY,
    id_prestamo INT REFERENCES PRESTAMO(id_prestamo) ON DELETE CASCADE,
    fecha_renovacion DATE,
    nuevo_vencimiento DATE,
    numero_renovacion INT
);

CREATE TABLE IF NOT EXISTS DEVOLUCION (
    id_devolucion SERIAL PRIMARY KEY,
    id_prestamo INT REFERENCES PRESTAMO(id_prestamo) ON DELETE CASCADE,
    fecha_devolucion DATE,
    condicion_entrega VARCHAR(100),
    observaciones TEXT
);

CREATE TABLE IF NOT EXISTS MULTA (
    id_multa SERIAL PRIMARY KEY,
    id_usuario INT REFERENCES USUARIO(id_usuario) ON DELETE CASCADE,
    id_devolucion INT REFERENCES DEVOLUCION(id_devolucion) ON DELETE CASCADE,
    tipo VARCHAR(50),
    monto DECIMAL(10, 2),
    dias_retraso INT,
    estatus_pago VARCHAR(50),
    fecha_generacion DATE
);

CREATE TABLE IF NOT EXISTS SOLICITUD_COMPRA (
    id_solicitud SERIAL PRIMARY KEY,
    id_usuario INT REFERENCES USUARIO(id_usuario) ON DELETE CASCADE,
    fecha_solicitud DATE,
    titulo_solicitado VARCHAR(255),
    autor_solicitado VARCHAR(255),
    estatus VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS LISTA_ESPERA (
    id_lista_espera SERIAL PRIMARY KEY,
    id_usuario INT REFERENCES USUARIO(id_usuario) ON DELETE CASCADE,
    id_libro INT REFERENCES LIBRO(id_libro) ON DELETE CASCADE,
    fecha_registro DATE,
    estatus VARCHAR(50)
);
