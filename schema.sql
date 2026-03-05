-- Enum para roles
CREATE TYPE user_role AS ENUM ('ADMIN', 'MECHANIC');

-- Enum para estados de trabajo
CREATE TYPE job_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- Tabla users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'MECHANIC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla vehicles
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patente VARCHAR(20) UNIQUE NOT NULL,
    modelo VARCHAR(255) NOT NULL,
    cliente_nombre VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla jobs
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descripcion TEXT NOT NULL,
    estado job_status NOT NULL DEFAULT 'PENDING',
    id_vehiculo UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    assigned_mechanic_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- CONSULTAS ESPECÍFICAS
-- ==========================================

-- 1. Query para ADMIN: Ver todos los trabajos y a quién están asignados
SELECT 
    j.id AS job_id,
    j.descripcion,
    j.estado,
    v.patente,
    v.modelo,
    u.name AS mechanic_name
FROM jobs j
JOIN vehicles v ON j.id_vehiculo = v.id
LEFT JOIN users u ON j.assigned_mechanic_id = u.id
ORDER BY j.created_at DESC;

-- 2. Query para MECÁNICO: Ver solo sus trabajos asignados (reemplazar el UUID)
SELECT 
    j.id AS job_id,
    j.descripcion,
    j.estado,
    v.patente,
    v.modelo
FROM jobs j
JOIN vehicles v ON j.id_vehiculo = v.id
WHERE j.assigned_mechanic_id = 'ID_DEL_MECANICO_AQUI'
ORDER BY j.created_at DESC;
