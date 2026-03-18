import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Conexión a la base de datos (se creará el archivo biblioteca.db si no existe)
const dbPath = path.join(__dirname, 'biblioteca.db');
const db = new Database(dbPath, { verbose: console.log });

// Inicializar tablas
function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS USUARIO (
        id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
        matricula_nomina TEXT,
        rol TEXT,
        funcion TEXT,
        contrasena_hash TEXT,
        estatus TEXT
    );

    CREATE TABLE IF NOT EXISTS LIBRO (
        id_libro INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        autor TEXT,
        editorial_clave TEXT,
        edicion TEXT,
        precio REAL,
        sinopsis TEXT,
        formato TEXT,
        estatus_catalogo TEXT,
        isbn TEXT,
        foto TEXT,
        costo_multa_base REAL
    );

    CREATE TABLE IF NOT EXISTS UBICACION (
        id_ubicacion INTEGER PRIMARY KEY AUTOINCREMENT,
        estanteria TEXT,
        seccion TEXT,
        codigo_clasificacion TEXT
    );

    CREATE TABLE IF NOT EXISTS EJEMPLAR (
        id_ejemplar INTEGER PRIMARY KEY AUTOINCREMENT,
        id_libro INTEGER,
        id_ubicacion INTEGER,
        codigo_inventario TEXT,
        tipo_disponibilidad TEXT,
        estatus TEXT,
        FOREIGN KEY(id_libro) REFERENCES LIBRO(id_libro) ON DELETE CASCADE,
        FOREIGN KEY(id_ubicacion) REFERENCES UBICACION(id_ubicacion) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS PRESTAMO (
        id_prestamo INTEGER PRIMARY KEY AUTOINCREMENT,
        id_usuario INTEGER,
        id_ejemplar INTEGER,
        fecha_prestamo TEXT,
        fecha_vencimiento TEXT,
        estatus TEXT,
        FOREIGN KEY(id_usuario) REFERENCES USUARIO(id_usuario) ON DELETE CASCADE,
        FOREIGN KEY(id_ejemplar) REFERENCES EJEMPLAR(id_ejemplar) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS RENOVACION (
        id_renovacion INTEGER PRIMARY KEY AUTOINCREMENT,
        id_prestamo INTEGER,
        fecha_renovacion TEXT,
        nuevo_vencimiento TEXT,
        numero_renovacion INTEGER,
        FOREIGN KEY(id_prestamo) REFERENCES PRESTAMO(id_prestamo) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS DEVOLUCION (
        id_devolucion INTEGER PRIMARY KEY AUTOINCREMENT,
        id_prestamo INTEGER,
        fecha_devolucion TEXT,
        condicion_entrega TEXT,
        observaciones TEXT,
        FOREIGN KEY(id_prestamo) REFERENCES PRESTAMO(id_prestamo) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS MULTA (
        id_multa INTEGER PRIMARY KEY AUTOINCREMENT,
        id_usuario INTEGER,
        id_devolucion INTEGER,
        tipo TEXT,
        monto REAL,
        dias_retraso INTEGER,
        estatus_pago TEXT,
        fecha_generacion TEXT,
        FOREIGN KEY(id_usuario) REFERENCES USUARIO(id_usuario) ON DELETE CASCADE,
        FOREIGN KEY(id_devolucion) REFERENCES DEVOLUCION(id_devolucion) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS SOLICITUD_COMPRA (
        id_solicitud INTEGER PRIMARY KEY AUTOINCREMENT,
        id_usuario INTEGER,
        fecha_solicitud TEXT,
        titulo_solicitado TEXT,
        autor_solicitado TEXT,
        estatus TEXT,
        FOREIGN KEY(id_usuario) REFERENCES USUARIO(id_usuario) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS LISTA_ESPERA (
        id_lista_espera INTEGER PRIMARY KEY AUTOINCREMENT,
        id_usuario INTEGER,
        id_libro INTEGER,
        fecha_registro TEXT,
        estatus TEXT,
        FOREIGN KEY(id_usuario) REFERENCES USUARIO(id_usuario) ON DELETE CASCADE,
        FOREIGN KEY(id_libro) REFERENCES LIBRO(id_libro) ON DELETE CASCADE
    );
  `);

  // Run migrations to add new columns if they don't exist yet
  const migrations = [
    `CREATE TABLE IF NOT EXISTS AUDITORIA (
        id_auditoria INTEGER PRIMARY KEY AUTOINCREMENT,
        id_usuario INTEGER,
        accion TEXT,
        tipo TEXT,
        fecha TEXT,
        FOREIGN KEY(id_usuario) REFERENCES USUARIO(id_usuario) ON DELETE CASCADE
    )`,
    `ALTER TABLE USUARIO ADD COLUMN nombre TEXT`,
    `ALTER TABLE USUARIO ADD COLUMN email TEXT`,
    `ALTER TABLE USUARIO ADD COLUMN avatar TEXT`,
    `ALTER TABLE MULTA ADD COLUMN id_prestamo INTEGER REFERENCES PRESTAMO(id_prestamo) ON DELETE CASCADE`,
  ];
  for (const sql of migrations) {
    try { db.exec(sql); } catch (_) { /* column already exists */ }
  }

  // Insertar datos de prueba si la base de datos está vacía
  const userCount = db.prepare('SELECT COUNT(*) as count FROM USUARIO').get();
  
  if (userCount.count === 0) {
    db.exec(`
      INSERT INTO USUARIO (id_usuario, matricula_nomina, rol, funcion, contrasena_hash, estatus, nombre, email, avatar) VALUES
      (1, 'A001', 'Administrador', 'Personal Administrativo', '1234', 'Activo', 'Hugo Gzz', 'hugo.gzz@biblioteca.edu', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150'),
      (2, 'B001', 'Bibliotecario', 'Personal Administrativo', '1234', 'Activo', 'Laura Martínez', 'laura.martinez@biblioteca.edu', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150'),
      (3, 'A002', 'Alumno', 'Estudiante', '1234', 'Activo', 'Carlos Pérez', 'carlos.perez@estudiante.edu', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150'),
      (4, 'P001', 'Profesor', 'Docencia', '1234', 'Activo', 'Ana Gómez', 'ana.gomez@profesor.edu', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150');

      INSERT INTO LIBRO (id_libro, titulo, autor, editorial_clave, edicion, precio, sinopsis, formato, estatus_catalogo, isbn, foto, costo_multa_base) VALUES
      (1, 'La psicología del dinero', 'Morgan Housel', 'Harriman House', '1ra Edición', 350.00, 'Un análisis fascinante sobre cómo pensamos acerca del dinero y cómo tomar mejores decisiones financieras.', 'Físico', 'Disponible para préstamo a casa', '978-0857197689', 'https://covers.openlibrary.org/b/isbn/9780857197689-L.jpg', 10.00),
      (2, 'Company of One', 'Paul Jarvis', 'Penguin Books', '1ra Edición', 280.00, 'Una guía sobre cómo crear un negocio exitoso manteniéndolo pequeño e independiente.', 'Físico', 'Disponible para préstamo a casa', '978-0241380222', 'https://images.unsplash.com/photo-1706885655567-33a37db62835?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGdyYXBoaWMlMjBkZXNpZ24lMjBwb3N0ZXJ8ZW58MXx8fHwxNzcyNjI1OTE5fDA&ixlib=rb-4.1.0&q=80&w=400', 10.00),
      (3, 'El gran Gatsby', 'F. Scott Fitzgerald', 'Scribner', '2da Edición', 220.00, 'Una obra maestra de la literatura americana sobre el sueño americano y la decadencia moral.', 'Físico', 'Disponible para uso interno', '978-0743273565', 'https://images.unsplash.com/photo-1770581939371-326fc1537f10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0eXBvZ3JhcGh5JTIwcG9zdGVyJTIwZGVzaWdufGVufDF8fHx8MTc3MjczNDQzMnww&ixlib=rb-4.1.0&q=80&w=400', 10.00),
      (9, 'La teoría del todo', 'Stephen Hawking', 'Debolsillo', '1ra Edición', 240.00, 'El origen y el destino del universo contados de forma magistral.', 'Físico', 'Disponible para uso interno', '978-8483467115', 'https://images.unsplash.com/photo-1707327259268-2741b504c4f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0eXBvZ3JhcGh5JTIwcG9zdGVyJTIwZGVzaWdufGVufDF8fHx8MTc3MjczNDg2OXww&ixlib=rb-4.1.0&q=80&w=400', 10.00),
      (10, 'Sapiens: De animales a dioses', 'Yuval Noah Harari', 'Debate', '3ra Edición', 490.00, 'Una breve historia de la humanidad, desde los primeros simios hasta el siglo XXI.', 'Físico', 'Disponible para préstamo a casa', '978-6073122344', 'https://images.unsplash.com/photo-1770581938992-1e96f1dccbb5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0eXBvZ3JhcGh5JTIwcG9zdGVyJTIwZGVzaWdufGVufDF8fHx8MTc3MjczNDc4MHww&ixlib=rb-4.1.0&q=80&w=400', 10.00),
      (6, 'Steve Jobs', 'Walter Isaacson', 'Simon & Schuster', '1ra Edición', 450.00, 'La biografía definitiva de Steve Jobs, basada en más de cuarenta entrevistas exclusivas.', 'Físico', 'Disponible para préstamo a casa', '978-1451648539', 'https://images.unsplash.com/photo-1569769107543-e0f61bab8e02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rJTIwY292ZXIlMjBzdGV2ZSUyMGpvYnN8ZW58MXx8fHwxNzcyNzUwMDQ3fDA&ixlib=rb-4.1.0&q=80&w=400', 10.00),
      (7, 'Pensar rápido, pensar despacio', 'Daniel Kahneman', 'Farrar, Straus and Giroux', '1ra Edición', 390.00, 'Una exploración revolucionaria de los dos sistemas que rigen nuestro pensamiento.', 'Físico', 'Disponible para préstamo a casa', '978-0374533557', 'https://images.unsplash.com/photo-1762719299395-deeb7e92775c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rJTIwY292ZXIlMjBwc3ljaG9sb2d5fGVufDF8fHx8MTc3Mjc1MDA1Mnww&ixlib=rb-4.1.0&q=80&w=400', 10.00),
      (8, '1984', 'George Orwell', 'Signet Classic', '3ra Edición', 250.00, 'Una visión distópica del futuro donde el Gran Hermano todo lo ve y controla.', 'Físico', 'Dado de baja', '978-0451524935', 'https://images.unsplash.com/photo-1602128110234-2d11c0aaadfe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwYXJjait0ZWN0dXJlfGVufDF8fHx8MTc3MjcxNDY5MHww&ixlib=rb-4.1.0&q=80&w=400', 10.00);
      
      -- INSERTS: CATÁLOGO DE LIBROS UNIVERSITARIOS
      INSERT INTO LIBRO (titulo, autor, editorial_clave, edicion, precio, sinopsis, formato, estatus_catalogo, isbn, foto, costo_multa_base) VALUES 
      ('El Alquimista', 'Paulo Coelho', 'GRIJALBO', '1a edición', 299.00, 'La historia de Santiago, un pastor andaluz que emprende un viaje en busca de un tesoro y descubre que la mayor riqueza está en seguir los sueños del alma.', 'Físico', 'Activo', '9786073809603', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400', 25.00),
      ('Cien años de soledad', 'Gabriel García Márquez', 'PENGUIN', 'Edición conmemorativa', 450.00, 'La saga de la familia Buendía en el mítico pueblo de Macondo. Obra cumbre del realismo mágico latinoamericano.', 'Físico', 'Activo', '9780307474728', 'https://covers.openlibrary.org/b/isbn/9780307474728-L.jpg', 35.00),
      ('Introducción al Cálculo y al Análisis Matemático Vol. 1', 'Richard Courant', 'LIMUSA', '2a edición', 620.00, 'Texto clásico universitario que aborda los fundamentos del cálculo diferencial e integral con rigor matemático.', 'Físico', 'Activo', '9789681800529', 'https://covers.openlibrary.org/b/isbn/9789681800529-L.jpg', 50.00),
      ('Psicología del Desarrollo', 'Diane E. Papalia', 'MCGRAW', '12a edición', 780.00, 'Recorre el desarrollo humano desde la concepción hasta la vejez, integrando teoría e investigación.', 'Físico', 'Activo', '9786071509185', 'https://images.unsplash.com/photo-1550184658-ff6132a71714?auto=format&fit=crop&q=80&w=400', 60.00),
      ('Administración', 'Stephen P. Robbins', 'PEARSON', '14a edición', 890.00, 'Texto líder mundial en administración que integra conceptos, teoría y práctica gerencial.', 'Físico', 'Activo', '9786073239011', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=400', 65.00),
      ('Química: La Ciencia Central', 'Theodore L. Brown', 'PEARSON', '14a edición', 950.00, 'Ofrece una presentación clara y precisa de los fundamentos de la química general.', 'Físico', 'Activo', '9780134414232', 'https://covers.openlibrary.org/b/isbn/9780134414232-L.jpg', 70.00),
      ('Derecho Civil: Parte General', 'Marcel Planiol', 'CAJICA', '3a edición', 540.00, 'Exposición sistemática de los principios generales del derecho civil: personas, familia, bienes y obligaciones.', 'Físico', 'Activo', '9789685374019', 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=400', 45.00),
      ('Fundamentos de Programación', 'Luis Joyanes Aguilar', 'MCGRAW', '4a edición', 580.00, 'Introduce la lógica de programación y los algoritmos con un enfoque didáctico y progresivo.', 'Físico', 'Activo', '9788448140977', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400', 45.00),
      ('Historia Universal Contemporánea', 'Héctor Strobel Ruiz', 'SANTILLANA', '2a edición', 395.00, 'Análisis de los grandes procesos históricos del siglo XX y XXI.', 'Físico', 'Activo', '9786071714527', 'https://covers.openlibrary.org/b/isbn/9786071714527-L.jpg', 30.00),
      ('Principios de Economía', 'N. Gregory Mankiw', 'CENGAGE', '8a edición', 860.00, 'El texto de economía más adoptado en universidades de todo el mundo. Explica los principios micro y macroeconómicos.', 'Físico', 'Activo', '9781305971493', 'https://covers.openlibrary.org/b/isbn/9781305971493-L.jpg', 65.00);

      INSERT INTO UBICACION (id_ubicacion, estanteria, seccion, codigo_clasificacion) VALUES
      (1, 'Estante A-12', 'Negocios', 'NEG-A12'),
      (2, 'En circulación', 'N/A', 'N/A'),
      (3, 'Estante B-04', 'Ficción', 'FIC-B04'),
      (4, 'Estante C-01', 'Ciencias', 'CIE-C01'),
      (5, 'Estante D-15', 'Historia', 'HIS-D15'),
      (6, 'Estante E-09', 'Biografía', 'BIO-E09'),
      (7, 'Estante B-11', 'Ficción', 'FIC-B11');

      INSERT INTO EJEMPLAR (id_ejemplar, id_libro, id_ubicacion, codigo_inventario, tipo_disponibilidad, estatus) VALUES
      (1, 1, 1, 'INV-001', 'Préstamo a casa', 'Disponible'),
      (2, 2, 2, 'INV-002', 'Préstamo a casa', 'Prestado'),
      (3, 3, 3, 'INV-003', 'Uso interno', 'Disponible'),
      (4, 4, 4, 'INV-004', 'Préstamo a casa', 'Disponible'),
      (5, 5, 5, 'INV-005', 'Préstamo a casa', 'Disponible'),
      (6, 6, 6, 'INV-006', 'Préstamo a casa', 'Disponible'),
      (7, 7, 2, 'INV-007', 'Préstamo a casa', 'Prestado'),
      (8, 8, 7, 'INV-008', 'Mantenimiento', 'Dado de baja');

      INSERT INTO PRESTAMO (id_prestamo, id_usuario, id_ejemplar, fecha_prestamo, fecha_vencimiento, estatus) VALUES
      (1, 3, 2, '2026-03-01', '2026-03-15', 'Activo'),
      (2, 4, 7, '2026-03-02', '2026-03-16', 'Activo'),
      (3, 3, 5, '2026-02-01', '2026-02-15', 'Activo'),
      (4, 4, 1, '2026-02-15', '2026-03-01', 'Activo');

      INSERT INTO LISTA_ESPERA (id_lista_espera, id_usuario, id_libro, fecha_registro, estatus) VALUES
      (1, 3, 5, '2026-03-06', 'Pendiente'),
      (2, 4, 6, '2026-03-05', 'Pendiente');
    `);
    console.log('Base de datos inicializada con datos de prueba.');
  }
}

initializeDatabase();

export default db;
