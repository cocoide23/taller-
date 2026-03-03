import { Router, Request, Response } from 'express';
import pool from '../db.js';

const router = Router();

const normalizePatente = (p: string) => p.toUpperCase().replace(/[\s-]/g, '');

// Helper: assemble a full Order object from DB rows
async function fetchFullOrders(whereClause = '', params: any[] = []) {
  const orderRows = await pool.query(
    `SELECT o.*,
       COALESCE(json_agg(
         json_build_object(
           'id', p.id,
           'nombre', p.nombre,
           'costo', p.costo::float,
           'cantidad', p.cantidad,
           'ordenId', p.order_id,
           'patente', p.patente,
           'mecanicoId', p.mecanico_id
         ) ORDER BY p.id
       ) FILTER (WHERE p.id IS NOT NULL), '[]') AS repuestos,
       COALESCE(json_agg(
         json_build_object('accion', ae.accion, 'usuario', ae.usuario, 'fecha', ae.fecha)
         ORDER BY ae.fecha
       ) FILTER (WHERE ae.id IS NOT NULL), '[]') AS audit_history,
       COALESCE(json_agg(
         json_build_object(
           'version', bv.version,
           'diagnostico', bv.diagnostico,
           'costoManoObra', bv.costo_mano_obra::float,
           'totalRepuestos', bv.total_repuestos::float,
           'fecha', bv.fecha,
           'aprobadoPor', bv.aprobado_por,
           'motivoCambio', bv.motivo_cambio
         ) ORDER BY bv.version
       ) FILTER (WHERE bv.id IS NOT NULL), '[]') AS historial_presupuestos
     FROM orders o
     LEFT JOIN order_parts p ON p.order_id = o.id
     LEFT JOIN audit_events ae ON ae.order_id = o.id
     LEFT JOIN budget_versions bv ON bv.order_id = o.id
     ${whereClause}
     GROUP BY o.id
     ORDER BY o.fecha_ingreso DESC`,
    params
  );

  return orderRows.rows.map(shapeOrder);
}

function shapeOrder(row: any) {
  return {
    id: row.id,
    patente: row.patente,
    modelo: row.modelo,
    cliente: {
      nombre: row.cliente_nombre,
      apellido: row.cliente_apellido,
      telefono: row.cliente_telefono,
    },
    estado: row.estado,
    fechaIngreso: row.fecha_ingreso,
    sintomaCliente: row.sintoma_cliente,
    diagnostico: row.diagnostico,
    costoManoObra: parseFloat(row.costo_mano_obra),
    repuestos: row.repuestos || [],
    mecanicoResponsable: row.mecanico_id
      ? { id: row.mecanico_id, nombre: row.mecanico_nombre }
      : null,
    presupuestoAprobado: row.presupuesto_aprobado,
    versionPresupuesto: row.version_presupuesto,
    historialPresupuestos: row.historial_presupuestos || [],
    evidenciaFotografica: row.evidencia_fotografica || [],
    auditLog: row.audit_aprobado_por
      ? { aprobadoPor: row.audit_aprobado_por, fechaAprobacion: row.audit_fecha_aprobacion }
      : null,
    auditHistory: row.audit_history || [],
  };
}

// ─────────────────────────────────────────────
// GET /api/orders  — all orders
// ─────────────────────────────────────────────
router.get('/', async (_req: Request, res: Response) => {
  try {
    const orders = await fetchFullOrders();
    res.json(orders);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/orders/historial/:patente
// ─────────────────────────────────────────────
router.get('/historial/:patente', async (req: Request, res: Response) => {
  try {
    const patente = normalizePatente(req.params.patente);
    const orders = await fetchFullOrders('WHERE o.patente = $1', [patente]);
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/orders  — create order
// ─────────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  const { patente, modelo, sintomaCliente, cliente } = req.body;
  const normalizedPatente = normalizePatente(patente);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Upsert vehicle
    await client.query(
      `INSERT INTO vehicles (patente, modelo, cliente_nombre, cliente_apellido, cliente_telefono)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (patente) DO NOTHING`,
      [normalizedPatente, modelo, cliente.nombre, cliente.apellido, cliente.telefono]
    );

    const result = await client.query(
      `INSERT INTO orders (patente, modelo, cliente_nombre, cliente_apellido, cliente_telefono, sintoma_cliente)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [normalizedPatente, modelo, cliente.nombre, cliente.apellido, cliente.telefono, sintomaCliente]
    );

    await client.query('COMMIT');
    const orders = await fetchFullOrders('WHERE o.id = $1', [result.rows[0].id]);
    res.status(201).json(orders[0]);
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────
// PUT /api/orders/:id  — generic update
// ─────────────────────────────────────────────
router.put('/:id', async (req: Request, res: Response) => {
  const { estado } = req.body;
  try {
    await pool.query('UPDATE orders SET estado = $1 WHERE id = $2', [estado, req.params.id]);
    const orders = await fetchFullOrders('WHERE o.id = $1', [req.params.id]);
    res.json(orders[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/orders/:id/congelar
// ─────────────────────────────────────────────
router.post('/:id/congelar', async (req: Request, res: Response) => {
  const { diagnostico, costoManoObra } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'La orden no existe.' });
    }
    const order = rows[0];
    if (order.estado === 'Cerrado' || order.presupuesto_aprobado) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'La orden ya está cerrada o el presupuesto ya fue aprobado.' });
    }

    const now = new Date();
    await client.query(
      `UPDATE orders SET diagnostico=$1, costo_mano_obra=$2, presupuesto_aprobado=TRUE,
       estado='Presupuestado', audit_aprobado_por='Admin', audit_fecha_aprobacion=$3 WHERE id=$4`,
      [diagnostico, costoManoObra, now, req.params.id]
    );

    await client.query(
      `INSERT INTO audit_events (order_id, accion, usuario, fecha) VALUES ($1,$2,$3,$4)`,
      [req.params.id, `Aprobado (v${order.version_presupuesto})`, 'Admin', now]
    );

    await client.query('COMMIT');
    const orders = await fetchFullOrders('WHERE o.id = $1', [req.params.id]);
    res.json(orders[0]);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────
// POST /api/orders/:id/descongelar
// ─────────────────────────────────────────────
router.post('/:id/descongelar', async (req: Request, res: Response) => {
  const { mecanicoId } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'La orden no existe.' });
    }
    if (!rows[0].presupuesto_aprobado) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'El presupuesto no está congelado.' });
    }

    const now = new Date();
    await client.query(
      `UPDATE orders SET presupuesto_aprobado=FALSE, estado='Ingresado' WHERE id=$1`,
      [req.params.id]
    );
    await client.query(
      `INSERT INTO audit_events (order_id, accion, usuario, fecha) VALUES ($1,'Desbloqueado',$2,$3)`,
      [req.params.id, mecanicoId, now]
    );

    await client.query('COMMIT');
    const orders = await fetchFullOrders('WHERE o.id = $1', [req.params.id]);
    res.json(orders[0]);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────
// POST /api/orders/:id/nueva-version
// ─────────────────────────────────────────────
router.post('/:id/nueva-version', async (req: Request, res: Response) => {
  const { diagnostico, costoManoObra, motivo } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'La orden no existe.' });
    }
    const order = rows[0];

    // Get current parts total
    const partsRes = await client.query(
      'SELECT COALESCE(SUM(costo * cantidad), 0) AS total FROM order_parts WHERE order_id = $1',
      [req.params.id]
    );
    const totalRepuestos = parseFloat(partsRes.rows[0].total);

    // Archive current version
    await client.query(
      `INSERT INTO budget_versions (order_id, version, diagnostico, costo_mano_obra, total_repuestos, aprobado_por, motivo_cambio)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [req.params.id, order.version_presupuesto, order.diagnostico, order.costo_mano_obra, totalRepuestos,
       order.audit_aprobado_por || 'Sistema', motivo]
    );

    const newVersion = order.version_presupuesto + 1;
    const now = new Date();

    await client.query(
      `UPDATE orders SET diagnostico=$1, costo_mano_obra=$2, presupuesto_aprobado=TRUE,
       estado='Presupuestado', version_presupuesto=$3, audit_aprobado_por='Admin',
       audit_fecha_aprobacion=$4 WHERE id=$5`,
      [diagnostico, costoManoObra, newVersion, now, req.params.id]
    );

    await client.query(
      `INSERT INTO audit_events (order_id, accion, usuario, fecha) VALUES ($1,$2,$3,$4)`,
      [req.params.id, `Nueva Versión (v${newVersion}) generada. Motivo: ${motivo}`, 'Admin', now]
    );

    await client.query('COMMIT');
    const orders = await fetchFullOrders('WHERE o.id = $1', [req.params.id]);
    res.json(orders[0]);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────
// POST /api/orders/:id/repuestos  — add a part
// ─────────────────────────────────────────────
router.post('/:id/repuestos', async (req: Request, res: Response) => {
  const { nombre, costo, cantidad, mecanico } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query('SELECT patente FROM orders WHERE id = $1', [req.params.id]);
    if (!rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'La orden no existe.' });
    }

    await client.query(
      `INSERT INTO order_parts (order_id, patente, nombre, costo, cantidad, mecanico_id) VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.params.id, rows[0].patente, nombre, costo, cantidad, mecanico.id]
    );
    await client.query(
      `UPDATE orders SET mecanico_id=$1, mecanico_nombre=$2 WHERE id=$3`,
      [mecanico.id, mecanico.nombre, req.params.id]
    );

    await client.query('COMMIT');
    const orders = await fetchFullOrders('WHERE o.id = $1', [req.params.id]);
    res.json(orders[0]);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────
// POST /api/orders/:id/evidencias  — add photo
// ─────────────────────────────────────────────
router.post('/:id/evidencias', async (req: Request, res: Response) => {
  const { photoUrl } = req.body;
  try {
    await pool.query(
      `UPDATE orders SET evidencia_fotografica = evidencia_fotografica || $1::jsonb WHERE id = $2`,
      [JSON.stringify([photoUrl]), req.params.id]
    );
    const orders = await fetchFullOrders('WHERE o.id = $1', [req.params.id]);
    res.json(orders[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
