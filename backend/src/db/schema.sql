USE railway;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nombre VARCHAR(120),
  rol ENUM('owner','staff') DEFAULT 'owner',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(160),
  subtitulo VARCHAR(255),
  cta_texto VARCHAR(80),
  cta_url VARCHAR(255),
  imagen_url VARCHAR(500),
  activo TINYINT(1) DEFAULT 0,
  orden INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS galeria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  imagen_url VARCHAR(500) NOT NULL,
  public_id VARCHAR(200),
  titulo VARCHAR(160),
  categoria VARCHAR(80) DEFAULT 'realismo',
  destacada TINYINT(1) DEFAULT 0,
  orden INT DEFAULT 0,
  ig_post_id VARCHAR(120) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(160) NOT NULL,
  email VARCHAR(160),
  telefono VARCHAR(60),
  instagram VARCHAR(120),
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cotizaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NULL,
  imagen_url VARCHAR(500),
  public_id VARCHAR(200),
  zona_cuerpo VARCHAR(120),
  tamano_cm VARCHAR(60),
  estilo VARCHAR(120) DEFAULT 'realismo',
  horas_estimadas DECIMAL(5,1),
  sesiones_estimadas INT,
  precio_min_eur DECIMAL(10,2),
  precio_max_eur DECIMAL(10,2),
  analisis_ia JSON,
  estado ENUM('borrador','enviada','agendada','descartada') DEFAULT 'borrador',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cot_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Reserva / proyecto. estado 'presupuesto' = sin fecha; 'confirmado' = ya en el calendario.
CREATE TABLE IF NOT EXISTS proyectos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  cotizacion_id INT NULL,
  titulo VARCHAR(200),
  zona_cuerpo VARCHAR(120),
  estilo VARCHAR(120),
  horas_totales DECIMAL(5,1),
  sesiones_pactadas INT DEFAULT 1,
  precio_pactado DECIMAL(10,2),
  deposito_pagado TINYINT(1) DEFAULT 0,
  estado ENUM('presupuesto','confirmado','en_proceso','finalizado','cancelado') DEFAULT 'presupuesto',
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_proy_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  CONSTRAINT fk_proy_cot FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS turnos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  proyecto_id INT NULL,
  cliente_id INT NOT NULL,
  numero_sesion INT DEFAULT 1,
  total_sesiones INT DEFAULT 1,
  inicio DATETIME NOT NULL,
  fin DATETIME NOT NULL,
  estado ENUM('pendiente','confirmado','completado','cancelado') DEFAULT 'confirmado',
  origen ENUM('chat_ia','admin','web') DEFAULT 'admin',
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_turno_proy FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
  CONSTRAINT fk_turno_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  INDEX idx_turnos_inicio (inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS contactos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(160),
  email VARCHAR(160),
  telefono VARCHAR(60),
  mensaje TEXT,
  leido TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS instagram_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payload JSON,
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Sistema tarifario (editable desde el panel) ──
CREATE TABLE IF NOT EXISTS tarifa_config (
  id INT PRIMARY KEY,
  tarifa_hora_eur DECIMAL(10,2) DEFAULT 90,
  minimo_sesion_eur DECIMAL(10,2) DEFAULT 60,
  deposito_pct INT DEFAULT 30,
  session_max_hours DECIMAL(4,1) DEFAULT 6,
  moneda VARCHAR(8) DEFAULT 'EUR',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tarifa_zonas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  zona VARCHAR(80) NOT NULL,
  multiplicador DECIMAL(4,2) DEFAULT 1.00,
  nota VARCHAR(160)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tarifa_estilos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  estilo VARCHAR(80) NOT NULL,
  multiplicador DECIMAL(4,2) DEFAULT 1.00,
  nota VARCHAR(160)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tarifa_insumos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  costo_eur DECIMAL(10,2) DEFAULT 0,
  por_sesion TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
