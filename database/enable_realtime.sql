-- ============================================================
-- Enable Supabase Realtime on all tables that need live updates
-- Run this once in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- First, drop and recreate the publication to ensure a clean state
-- (This is safe; it doesn't delete any data)
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;

-- Add all tables that need real-time change notifications
ALTER PUBLICATION supabase_realtime ADD TABLE libro;
ALTER PUBLICATION supabase_realtime ADD TABLE ejemplar;
ALTER PUBLICATION supabase_realtime ADD TABLE ubicacion;
ALTER PUBLICATION supabase_realtime ADD TABLE prestamo;
ALTER PUBLICATION supabase_realtime ADD TABLE lista_espera;
ALTER PUBLICATION supabase_realtime ADD TABLE multa;
ALTER PUBLICATION supabase_realtime ADD TABLE auditoria;
ALTER PUBLICATION supabase_realtime ADD TABLE usuario;
ALTER PUBLICATION supabase_realtime ADD TABLE devolucion;

-- Set REPLICA IDENTITY FULL on tables so we receive old+new values on UPDATE/DELETE
ALTER TABLE libro REPLICA IDENTITY FULL;
ALTER TABLE ejemplar REPLICA IDENTITY FULL;
ALTER TABLE ubicacion REPLICA IDENTITY FULL;
ALTER TABLE prestamo REPLICA IDENTITY FULL;
ALTER TABLE lista_espera REPLICA IDENTITY FULL;
ALTER TABLE multa REPLICA IDENTITY FULL;
ALTER TABLE auditoria REPLICA IDENTITY FULL;
ALTER TABLE usuario REPLICA IDENTITY FULL;
ALTER TABLE devolucion REPLICA IDENTITY FULL;
