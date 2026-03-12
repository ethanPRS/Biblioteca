C — Contexto
Estás diseñando una aplicación para la biblioteca de la Universidad Ducky, cuyo objetivo es digitalizar el sistema manual de gestión de préstamos de libros.
Actualmente la biblioteca opera con procesos manuales, lo cual genera:
Inconsistencia entre catálogo y disponibilidad real
Tiempos largos de atención a estudiantes
Dificultad para realizar inventarios
Problemas para aplicar reglas de préstamo y multas
La universidad busca automatizar estos procesos para mejorar el servicio y alinearse con estándares de calidad ISO 9001:2015.
La aplicación deberá permitir:
Gestión de libros
Gestión de usuarios
Búsqueda avanzada de libros
Solicitudes de préstamo
Registro de devoluciones
Control de multas
Consulta del catálogo con disponibilidad en tiempo real

R — Rol
Actúa como un Senior Product Designer / UX UI Designer con 20 años de experiencia diseñando productos SaaS, sistemas empresariales y aplicaciones universitarias.
Tu trabajo es:
Diseñar una experiencia intuitiva
Crear una arquitectura de información clara
Mantener consistencia con el design system
Diseñar interfaces modernas, limpias y profesionales
Piensa como si estuvieras diseñando un producto real que será utilizado diariamente por estudiantes, bibliotecarios y administradores.

Usuarios del Sistema
El sistema tendrá control de acceso basado en roles.
Cada usuario verá solo las funcionalidades que le corresponden.
Administrador
Puede:
Gestionar libros (alta, baja, edición)
Gestionar usuarios
Ver listado completo de libros
Buscar libros
Registrar préstamos
Registrar devoluciones
Gestionar multas
Acceso completo al sistema.

Bibliotecario
Puede:
Buscar libros
Consultar catálogo
Registrar préstamos
Registrar devoluciones
No puede:
Gestionar usuarios
Dar de alta o baja libros
Ver panel administrativo completo

Alumno
Puede:
Buscar libros
Ver detalle de libros
Solicitar préstamos

Profesor
Puede:
Buscar libros
Ver detalle de libros
Solicitar préstamos

Colaborador
Puede:
Buscar libros
Ver detalle de libros
Solicitar préstamos

Autenticación y Control de Acceso
La aplicación debe contar con un sistema de inicio de sesión.
Pantalla Login
Campos:
Matrícula o número de nómina
Contraseña
Elementos:
Logo DUCKY
Input usuario
Input contraseña
Botón Iniciar Sesión
Mensaje de error
Recuperación de contraseña
Después del login:
El sistema identifica el rol del usuario
La interfaz se adapta dinámicamente
Solo se muestran las funciones permitidas

Navegación del Sistema
La aplicación debe tener una estructura de navegación clara.
Menú principal sugerido:
Dashboard
Catálogo
Préstamos
Devoluciones
Multas
Gestión de Libros (solo Admin)
Gestión de Usuarios (solo Admin)
El menú debe adaptarse al rol del usuario.

Pantallas del Sistema
1. Catálogo de Libros
Pantalla principal del sistema.
Debe incluir:
Barra de búsqueda
Filtros avanzados
Lista de resultados
Estado de disponibilidad
Ubicación del libro
Acceso al detalle del libro

Botón adicional solo para Administrador
Cuando el usuario tenga rol Administrador, debe aparecer el botón:
Listado de Libros
Ubicación sugerida:
Parte superior derecha
Cerca de los filtros
Visible solo para administrador.

Vista: Listado de Libros (Solo Administrador)
Vista administrativa minimalista para inventario.
Formato:
Tabla o lista simple.
Columnas:
Título
Autor
Editorial
ISBN
Número de copias
Estatus (Disponible / Uso interno / Baja)
Formato (Físico / Electrónico)
Opciones por registro:
Ver detalle
Editar
Dar de baja (si no hay préstamos activos)
Objetivo:
Revisar inventario
Gestionar catálogo
Facilitar inventarios
El diseño debe ser:
minimalista
escaneable
enfocado en eficiencia administrativa

Detalle del Libro
Información mostrada:
Foto
Título
Autor
Editorial
Edición
ISBN
Sinopsis
Número de copias
Estado
Ubicación
Disponibilidad
Acciones:
Solicitar préstamo
Reservar
Ver historial

Gestión de Libros (Admin)
Pantallas para:
Alta
Edición
Baja
Listado
Campos:
Título
Autor
Editorial
Edición
Precio
Número de copias
Multa diaria
Sinopsis
Formato
Estatus
Foto
ISBN

Gestión de Usuarios (Admin)
Pantallas:
Crear usuario
Editar usuario
Listado
Campos:
Matrícula / Nómina
Rol
Tipo de acceso
Contraseña

Registro de Préstamo
El bibliotecario puede:
Buscar usuario
Buscar libro
Validar reglas
Registrar préstamo
Generar recibo

Registro de Devolución
El bibliotecario puede:
Registrar devolución
Calcular multa automáticamente
Registrar pago de multa

Multas
Pantalla que muestre:
Multas activas
Multas pagadas
Días de retraso
Monto total

Plataformas
Web App
Disponible para:
Administrador
Bibliotecario
Incluye funciones completas de gestión.

Mobile App
Disponible para:
Alumno
Profesor
Colaborador
Permite:
Buscar libros
Ver detalles
Solicitar préstamo

Design System
Debes seguir estrictamente el design system proporcionado.

Colores
Primary
#2B74FF
Uso:
botones primarios
acciones importantes
estados activos
enlaces

Secondary
#B5DBF7
Uso:
fondos suaves
tarjetas
estados hover
elementos de apoyo

Neutral
Neutral 400
Uso:
texto secundario
bordes
separadores
iconos secundarios

Tipografía
Tipografía principal:
Montserrat
Debe utilizarse en toda la aplicación.

Jerarquía Tipográfica
H1
Montserrat Bold — 32px
H2
Montserrat SemiBold — 24px
H3
Montserrat Medium — 20px
Body
Montserrat Regular — 16px
Caption
Montserrat Regular — 14px
Button Text
Montserrat SemiBold — 14–16px

Branding
Crear un logo simple con el texto:
DUCKY
Estilo:
minimalista
moderno
adaptable a web y mobile

Entregables Esperados
Generar un archivo completo en Figma con:
Web
Login
Dashboard
Catálogo
Detalle libro
Gestión libros
Gestión usuarios
Préstamos
Devoluciones
Multas

Mobile
Login
Búsqueda
Resultados
Detalle libro
Solicitud préstamo

También incluir:
Component library
Design tokens
Layout grids
Componentes reutilizables
Estados (hover, focus, error, disabled)

