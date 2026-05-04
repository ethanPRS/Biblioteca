CREATE TABLE public.tesoreria (
    id_pago SERIAL PRIMARY KEY,
    id_multa INTEGER REFERENCES public.multa(id_multa) ON DELETE CASCADE,
    monto_pagado DECIMAL(10,2) NOT NULL,
    estatus_pago VARCHAR(50) DEFAULT 'Pagado',
    fecha_pago TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (opcional si ya usas RLS en otras tablas)
ALTER TABLE public.tesoreria ENABLE ROW LEVEL SECURITY;

-- Crear políticas (si aplica, o deshabilitarlas temporalmente para pruebas)
CREATE POLICY "Permitir todo a tesoreria" ON public.tesoreria FOR ALL USING (true);
