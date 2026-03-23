-- Archivo de inserción de datos iniciales extraídos del código de frontend
-- Asegurarse de haber corrido schema.sql primero

-- Insertar Usuarios
INSERT INTO USUARIO (id_usuario, matricula_nomina, rol, funcion, contrasena_hash, estatus) VALUES
(1, 'A001', 'Administrador', 'Personal Administrativo', '1234', 'Activo'),
(2, 'B001', 'Bibliotecario', 'Personal Administrativo', '1234', 'Activo'),
(3, 'A002', 'Alumno', 'Estudiante', '1234', 'Activo'),
(4, 'P001', 'Profesor', 'Docencia', '1234', 'Activo');

-- Ajustar autoincremental de USUARIO
SELECT setval('usuario_id_usuario_seq', 4);

-- Insertar Libros
INSERT INTO LIBRO (id_libro, titulo, autor, editorial_clave, edicion, precio, sinopsis, formato, estatus_catalogo, isbn, foto, costo_multa_base) VALUES
(1, 'La psicología del dinero', 'Morgan Housel', 'Harriman House', '1ra Edición', 350.00, 'Un análisis fascinante sobre cómo pensamos acerca del dinero y cómo tomar mejores decisiones financieras.', 'Físico', 'Disponible', '978-0857197689', 'https://images.unsplash.com/photo-1769490315625-6e669d53e698', 10.00),
(2, 'Company of One', 'Paul Jarvis', 'Penguin Books', '1ra Edición', 280.00, 'Una guía sobre cómo crear un negocio exitoso manteniéndolo pequeño e independiente.', 'Físico', 'Prestado', '978-0241380222', 'https://images.unsplash.com/photo-1706885655567-33a37db62835', 10.00),
(3, 'El gran Gatsby', 'F. Scott Fitzgerald', 'Scribner', '2da Edición', 220.00, 'Una obra maestra de la literatura americana sobre el sueño americano y la decadencia moral.', 'Físico', 'Disponible', '978-0743273565', 'https://images.unsplash.com/photo-1770581939371-326fc1537f10', 10.00),
(4, 'Breve historia del tiempo', 'Stephen Hawking', 'Bantam', '10ma Edición', 380.00, 'Una exploración accesible de los conceptos más complejos de la física moderna.', 'Físico', 'Disponible', '978-0553380163', 'https://images.unsplash.com/photo-1659640764406-416f70e32bec', 10.00),
(5, 'Sapiens', 'Yuval Noah Harari', 'Harper', '1ra Edición', 420.00, 'Una fascinante historia de la humanidad desde la Edad de Piedra hasta el presente.', 'Digital', 'Disponible', '978-0062316097', 'https://images.unsplash.com/photo-1611576673788-a954e01092d1', 10.00),
(6, 'Steve Jobs', 'Walter Isaacson', 'Simon & Schuster', '1ra Edición', 450.00, 'La biografía definitiva de Steve Jobs, basada en más de cuarenta entrevistas exclusivas.', 'Físico', 'Disponible', '978-1451648539', 'https://images.unsplash.com/photo-1569769107543-e0f61bab8e02', 10.00),
(7, 'Pensar rápido, pensar despacio', 'Daniel Kahneman', 'Farrar, Straus and Giroux', '1ra Edición', 390.00, 'Una exploración revolucionaria de los dos sistemas que rigen nuestro pensamiento.', 'Físico', 'Prestado', '978-0374533557', 'https://images.unsplash.com/photo-1762719299395-deeb7e92775c', 10.00),
(8, '1984', 'George Orwell', 'Signet Classic', '3ra Edición', 250.00, 'Una visión distópica del futuro donde el Gran Hermano todo lo ve y controla.', 'Físico', 'Dado de baja', '978-0451524935', 'https://images.unsplash.com/photo-1602128110234-2d11c0aaadfe', 10.00);

-- Ajustar autoincremental de LIBRO
SELECT setval('libro_id_libro_seq', 8);

-- Insertar Ubicaciones (Asignando cada estante de los mocks a una entrada única)
INSERT INTO UBICACION (id_ubicacion, estanteria, seccion, codigo_clasificacion) VALUES
(1, 'Estante A-12', 'Negocios', 'NEG-A12'),
(2, 'En circulación', 'N/A', 'N/A'),
(3, 'Estante B-04', 'Ficción', 'FIC-B04'),
(4, 'Estante C-01', 'Ciencias', 'CIE-C01'),
(5, 'Estante D-15', 'Historia', 'HIS-D15'),
(6, 'Estante E-09', 'Biografía', 'BIO-E09'),
(7, 'Estante B-11', 'Ficción', 'FIC-B11');

SELECT setval('ubicacion_id_ubicacion_seq', 7);

-- Insertar Ejemplares (Reduciremos a 1 ejemplar de cada libro para mapear fácilmente los préstamos)
INSERT INTO EJEMPLAR (id_ejemplar, id_libro, id_ubicacion, codigo_inventario, tipo_disponibilidad, estatus) VALUES
(1, 1, 1, 'INV-001', 'Préstamo a casa', 'Disponible'),
(2, 2, 2, 'INV-002', 'Préstamo a casa', 'Prestado'),
(3, 3, 3, 'INV-003', 'Uso interno', 'Disponible'),
(4, 4, 4, 'INV-004', 'Préstamo a casa', 'Disponible'),
(5, 5, 5, 'INV-005', 'Préstamo a casa', 'Disponible'),
(6, 6, 6, 'INV-006', 'Préstamo a casa', 'Disponible'),
(7, 7, 2, 'INV-007', 'Préstamo a casa', 'Prestado'),
(8, 8, 7, 'INV-008', 'Mantenimiento', 'Dado de baja');

SELECT setval('ejemplar_id_ejemplar_seq', 8);

-- Insertar Préstamos Activos y Vencidos
-- Mapping:
-- L1 (id_prestamo 1): Libro 2 -> user_id: 3 -> id_ejemplar: 2
-- L2 (id_prestamo 2): Libro 7 -> user_id: 4 -> id_ejemplar: 7
-- L3 (id_prestamo 3): Libro 5 -> user_id: 3 -> id_ejemplar: 5 => multa + retraso simulado (fecha atrasada)
-- L4 (id_prestamo 4): Libro 1 -> user_id: 4 -> id_ejemplar: 1 => multa + retraso simulado
INSERT INTO PRESTAMO (id_prestamo, id_usuario, id_ejemplar, fecha_prestamo, fecha_vencimiento, estatus) VALUES
(1, 3, 2, '2026-03-01', '2026-03-15', 'Activo'),
(2, 4, 7, '2026-03-02', '2026-03-16', 'Activo'),
(3, 3, 5, '2026-02-01', '2026-02-15', 'Activo'),
(4, 4, 1, '2026-02-15', '2026-03-01', 'Activo');

SELECT setval('prestamo_id_prestamo_seq', 4);

-- Insertar Listas de Espera (Los mocks de solicitudes en el FE se parecen mas a una lista de espera por un libro existente)
-- LR1: Libro 5 -> user_id 3
-- LR2: Libro 6 -> user_id 4
INSERT INTO LISTA_ESPERA (id_lista_espera, id_usuario, id_libro, fecha_registro, estatus) VALUES
(1, 3, 5, '2026-03-06', 'Pendiente'),
(2, 4, 6, '2026-03-05', 'Pendiente');

SELECT setval('lista_espera_id_lista_espera_seq', 2);

-- Insertar Datos Simulados de Bases de Datos Externas
INSERT INTO ESCOLAR (matricula, nombre, carrera, estatus, correo) VALUES
('614070', 'Lizbeth Berzosa Cervantes', 'Ingeniería', 'Activo', 'lizbeth.berzosa@udem.edu'),
('647144', 'Galia Sejudo Mireles', 'Negocios', 'Activo', 'galia.sejudo@udem.edu'),
('615347', 'Ethan Patricio Rivera Saldivar', 'Ingeniería', 'Activo', 'ethan.rivera@udem.edu'),
('646278', 'Victor Emiliano Berlanga Mendoza', 'Ingeniería', 'Activo', 'victor.berlanga@udem.edu'),
('587823', 'Alejandra Morón Rodríguez', 'Negocios', 'Activo', 'alejandra.moron@udem.edu');

INSERT INTO CAPITAL_HUMANO (matricula_nomina, nombre, puesto, estatus, correo) VALUES
('P001', 'Roberto Martínez', 'Profesor Titular', 'Activo', 'roberto.martinez@udem.edu');
