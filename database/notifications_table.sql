-- ============================================================
-- Tabla de Notificaciones Persistentes
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS notificacion (
  id_notificacion   SERIAL PRIMARY KEY,
  titulo            VARCHAR(255) NOT NULL,
  mensaje           TEXT         NOT NULL,
  tipo              VARCHAR(50)  NOT NULL DEFAULT 'info'
                    CHECK (tipo IN ('info', 'success', 'warning', 'alert')),
  -- NULL = visible para todos los usuarios; un ID específico = solo ese usuario
  id_usuario_destino INTEGER REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  fecha_creacion    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Índice para consultas rápidas por usuario destino y fecha
CREATE INDEX IF NOT EXISTS idx_notificacion_usuario
  ON notificacion (id_usuario_destino, fecha_creacion DESC);

-- Row Level Security (RLS)
ALTER TABLE notificacion ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario (service role) puede leer todas las notificaciones
CREATE POLICY "Notificaciones legibles por todos"
  ON notificacion FOR SELECT
  USING (true);

-- Inserción libre (el backend con service role siempre puede insertar)
CREATE POLICY "Notificaciones insertables"
  ON notificacion FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- Agregar a la publicación de Realtime
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE notificacion;
ALTER TABLE notificacion REPLICA IDENTITY FULL;
