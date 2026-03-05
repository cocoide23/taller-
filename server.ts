import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { createServer as createViteServer } from "vite";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey_change_in_production";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API routes FIRST

  // 1. Registro de Usuario (Para pruebas iniciales)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      const password_hash = await bcrypt.hash(password, 10);
      
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password_hash,
          role: role || "MECHANIC"
        }
      });
      
      res.json({ message: "Usuario creado exitosamente", userId: user.id });
    } catch (error) {
      res.status(500).json({ error: "Error al registrar usuario" });
    }
  });

  // 2. Login comparando roles
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Buscar usuario por email
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      // Comparar contraseñas con bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      // Generar JWT con el rol incluido
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        message: "Login exitoso",
        token,
        user: {
          id: user.id,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Error en el servidor durante el login" });
    }
  });

  // Middleware de Autenticación
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Acceso denegado" });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Token inválido" });
      req.user = user;
      next();
    });
  };

  // 3. Query unificada para obtener trabajos según el rol
  app.get("/api/jobs", authenticateToken, async (req: any, res: any) => {
    try {
      if (req.user.role === "ADMIN") {
        const jobs = await prisma.job.findMany({
          include: {
            vehicle: true,
            mechanic: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
        return res.json(jobs);
      } else if (req.user.role === "MECHANIC") {
        const jobs = await prisma.job.findMany({
          where: { assigned_mechanic_id: req.user.userId },
          include: { vehicle: true },
          orderBy: { createdAt: 'desc' }
        });
        return res.json(jobs);
      }
      return res.status(403).json({ error: "Rol no reconocido" });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener trabajos" });
    }
  });

  // 4. Obtener lista de mecánicos (Solo ADMIN)
  app.get("/api/mechanics", authenticateToken, async (req: any, res: any) => {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Acceso denegado" });
    try {
      const mechanics = await prisma.user.findMany({
        where: { role: "MECHANIC" },
        select: { id: true, name: true }
      });
      res.json(mechanics);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener mecánicos" });
    }
  });

  // 5. Asignar mecánico a un trabajo (Solo ADMIN)
  app.put("/api/jobs/:id/assign", authenticateToken, async (req: any, res: any) => {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Acceso denegado" });
    try {
      const { mechanicId } = req.body;
      const job = await prisma.job.update({
        where: { id: req.params.id },
        data: { assigned_mechanic_id: mechanicId }
      });
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: "Error al asignar mecánico" });
    }
  });

  // 6. Cambiar estado de un trabajo (Mecánico o Admin)
  app.put("/api/jobs/:id/status", authenticateToken, async (req: any, res: any) => {
    try {
      const { status } = req.body; // "PENDING", "IN_PROGRESS", "COMPLETED"
      
      // Si es mecánico, verificar que el trabajo le pertenece
      if (req.user.role === "MECHANIC") {
        const job = await prisma.job.findUnique({ where: { id: req.params.id } });
        if (!job || job.assigned_mechanic_id !== req.user.userId) {
          return res.status(403).json({ error: "No tienes permiso para editar este trabajo" });
        }
      }

      const updatedJob = await prisma.job.update({
        where: { id: req.params.id },
        data: { estado: status }
      });
      res.json(updatedJob);
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar estado" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
