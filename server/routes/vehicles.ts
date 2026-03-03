import { Router, Request, Response } from 'express';
import pool from '../db.js';

const router = Router();

const normalizePatente = (p: string) => p.toUpperCase().replace(/[\s-]/g, '');

// GET /api/vehicles/:patente/exists
router.get('/:patente/exists', async (req: Request, res: Response) => {
  const patente = normalizePatente(req.params.patente);
  const { rows } = await pool.query('SELECT 1 FROM vehicles WHERE patente = $1', [patente]);
  res.json({ exists: rows.length > 0 });
});

// POST /api/vehicles — register a new vehicle manually
router.post('/', async (req: Request, res: Response) => {
  const { patente, modelo, cliente } = req.body;
  const normalizedPatente = normalizePatente(patente);

  try {
    await pool.query(
      `INSERT INTO vehicles (patente, modelo, cliente_nombre, cliente_apellido, cliente_telefono)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (patente) DO UPDATE
         SET modelo = EXCLUDED.modelo,
             cliente_nombre = EXCLUDED.cliente_nombre,
             cliente_apellido = EXCLUDED.cliente_apellido,
             cliente_telefono = EXCLUDED.cliente_telefono`,
      [normalizedPatente, modelo, cliente.nombre, cliente.apellido, cliente.telefono]
    );
    res.status(201).json({ patente: normalizedPatente, modelo, cliente });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
