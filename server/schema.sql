-- ============================================================
-- Taller Manager - PostgreSQL Schema
-- Compatible con Railway Postgres
-- ============================================================

CREATE TABLE IF NOT EXISTS vehicles (
  patente        TEXT PRIMARY KEY,
  modelo         TEXT NOT NULL,
  cliente_nombre    TEXT NOT NULL DEFAULT '',
  cliente_apellido  TEXT NOT NULL DEFAULT '',
  cliente_telefono  TEXT NOT NULL DEFAULT '',
  fecha_creacion    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id                    TEXT PRIMARY KEY DEFAULT ('ord_' || gen_random_uuid()::text),
  patente               TEXT NOT NULL REFERENCES vehicles(patente),
  modelo                TEXT NOT NULL,
  cliente_nombre        TEXT NOT NULL DEFAULT '',
  cliente_apellido      TEXT NOT NULL DEFAULT '',
  cliente_telefono      TEXT NOT NULL DEFAULT '',
  estado                TEXT NOT NULL DEFAULT 'Ingresado'
                          CHECK (estado IN ('Ingresado','Presupuestado','En Reparación','Finalizado','Cerrado','Anulado')),
  fecha_ingreso         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sintoma_cliente       TEXT NOT NULL DEFAULT '',
  diagnostico           TEXT NOT NULL DEFAULT '',
  costo_mano_obra       NUMERIC(12,2) NOT NULL DEFAULT 0,
  mecanico_id           TEXT,
  mecanico_nombre       TEXT,
  presupuesto_aprobado  BOOLEAN NOT NULL DEFAULT FALSE,
  version_presupuesto   INTEGER NOT NULL DEFAULT 1,
  evidencia_fotografica JSONB NOT NULL DEFAULT '[]',
  audit_aprobado_por    TEXT,
  audit_fecha_aprobacion TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS order_parts (
  id          TEXT PRIMARY KEY DEFAULT ('rep_' || gen_random_uuid()::text),
  order_id    TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  patente     TEXT NOT NULL,
  nombre      TEXT NOT NULL,
  costo       NUMERIC(12,2) NOT NULL DEFAULT 0,
  cantidad    INTEGER NOT NULL DEFAULT 1,
  mecanico_id TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS budget_versions (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id          TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  version           INTEGER NOT NULL,
  diagnostico       TEXT NOT NULL DEFAULT '',
  costo_mano_obra   NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_repuestos   NUMERIC(12,2) NOT NULL DEFAULT 0,
  fecha             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  aprobado_por      TEXT NOT NULL DEFAULT '',
  motivo_cambio     TEXT
);

CREATE TABLE IF NOT EXISTS audit_events (
  id       TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  accion   TEXT NOT NULL,
  usuario  TEXT NOT NULL,
  fecha    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Seed data (only inserted if orders table is empty)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vehicles LIMIT 1) THEN

    INSERT INTO vehicles (patente, modelo, cliente_nombre, cliente_apellido, cliente_telefono, fecha_creacion) VALUES
      ('ABC123', 'Ford Focus',        'Juan',  'Pérez',     '1123456789', NOW() - INTERVAL '365 days'),
      ('XYZ789', 'Toyota Corolla',    'María', 'Gómez',     '1198765432', NOW() - INTERVAL '200 days'),
      ('DEF456', 'Volkswagen Golf',   'Lucas', 'Rodríguez', '1155554444', NOW() - INTERVAL '100 days');

    INSERT INTO orders (id, patente, modelo, cliente_nombre, cliente_apellido, cliente_telefono,
                        estado, fecha_ingreso, sintoma_cliente, diagnostico, costo_mano_obra,
                        presupuesto_aprobado, version_presupuesto, evidencia_fotografica) VALUES
      ('ord_1', 'ABC123', 'Ford Focus', 'Juan', 'Pérez', '1123456789',
       'Ingresado', NOW(), 'Frenos largos y ruido al pisar el pedal', '', 0,
       FALSE, 1, '["https://picsum.photos/seed/brakes1/400/300"]'),
      ('ord_2', 'XYZ789', 'Toyota Corolla', 'María', 'Gómez', '1198765432',
       'Presupuestado', NOW() - INTERVAL '1 day', 'Ruido en motor al arrancar en frío',
       'Cambio de correa de distribución y tensores', 85000,
       TRUE, 1, '["https://picsum.photos/seed/engine1/400/300","https://picsum.photos/seed/belt1/400/300"]'),
      ('ord_3', 'DEF456', 'Volkswagen Golf', 'Lucas', 'Rodríguez', '1155554444',
       'En Reparación', NOW() - INTERVAL '2 days', 'Pierde aceite por abajo',
       'Junta de cárter rota', 35000,
       TRUE, 1, '["https://picsum.photos/seed/oil1/400/300"]');

    INSERT INTO order_parts (order_id, patente, nombre, costo, cantidad, mecanico_id) VALUES
      ('ord_2', 'XYZ789', 'Kit Correa Distribución', 120000, 1, 'mec_1'),
      ('ord_2', 'XYZ789', 'Bomba de agua',            45000,  1, 'mec_1'),
      ('ord_3', 'DEF456', 'Junta de cárter',          15000,  1, 'mec_2'),
      ('ord_3', 'DEF456', 'Aceite 10W40 4L',          28000,  1, 'mec_2');

    UPDATE orders SET
      mecanico_id = 'mec_1', mecanico_nombre = 'Carlos Gómez',
      audit_aprobado_por = 'Admin', audit_fecha_aprobacion = NOW() - INTERVAL '12 hours'
    WHERE id = 'ord_2';

    UPDATE orders SET
      mecanico_id = 'mec_2', mecanico_nombre = 'Ana Martínez',
      audit_aprobado_por = 'Admin', audit_fecha_aprobacion = NOW() - INTERVAL '1 day'
    WHERE id = 'ord_3';

  END IF;
END
$$;
