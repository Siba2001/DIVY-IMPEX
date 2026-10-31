-- ===================================================================
-- DIVY IMPEX Database Schema for MySQL
-- Compatible with WampServer (MySQL 5.7+ / MariaDB 10.6+)
-- ===================================================================

CREATE DATABASE IF NOT EXISTS divy_impex_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE divy_impex_db;

-- 1. COMPANIES TABLE
CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    address TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. WORKERS TABLE
CREATE TABLE IF NOT EXISTS workers (
    id VARCHAR(64) PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100) DEFAULT 'General',
    phone VARCHAR(20),
    status VARCHAR(50) DEFAULT 'ACTIVE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. DIAMONDS TABLE
CREATE TABLE IF NOT EXISTS diamonds (
    id VARCHAR(64) PRIMARY KEY,
    barcode VARCHAR(100) NOT NULL UNIQUE,
    serial_no VARCHAR(100),
    rough_cut_no VARCHAR(100),
    company_id VARCHAR(64) NOT NULL,
    company_code VARCHAR(50),
    company_name VARCHAR(255),
    shape VARCHAR(50),
    size VARCHAR(50),
    weight DECIMAL(10,3) DEFAULT 0.000,
    scale_weight DECIMAL(10,3),
    target_weight DECIMAL(10,3),
    actual_weight DECIMAL(10,3),
    batch_total_weight DECIMAL(10,3),
    received_date VARCHAR(50),
    received_by VARCHAR(100),
    assigned_worker_id VARCHAR(64),
    assigned_worker_name VARCHAR(255),
    assigned_date VARCHAR(50),
    status VARCHAR(50) DEFAULT 'RECEIVED',
    completed_date VARCHAR(50),
    completed_by VARCHAR(100),
    deposited_date VARCHAR(50),
    verified_date VARCHAR(50),
    verified_by VARCHAR(100),
    remarks TEXT,
    INDEX idx_diamond_barcode (barcode),
    INDEX idx_diamond_company (company_id),
    INDEX idx_diamond_worker (assigned_worker_id),
    INDEX idx_diamond_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. HISTORIES TABLE
CREATE TABLE IF NOT EXISTS histories (
    id VARCHAR(64) PRIMARY KEY,
    diamond_id VARCHAR(64),
    barcode VARCHAR(100) NOT NULL,
    action VARCHAR(255) NOT NULL,
    performed_by VARCHAR(100),
    date VARCHAR(50),
    time VARCHAR(50),
    remarks TEXT,
    INDEX idx_history_barcode (barcode),
    INDEX idx_history_diamond_id (diamond_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'worker',
    name VARCHAR(255),
    email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default Admin User (admin / admin123 - SHA-256 hash)
INSERT IGNORE INTO users (id, username, password_hash, role, name, email, status, created_at)
VALUES (
    'usr-admin',
    'admin',
    '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
    'admin',
    'Admin Manager',
    'admin@divyimpex.com',
    'ACTIVE',
    '01 Jan 2026'
);

