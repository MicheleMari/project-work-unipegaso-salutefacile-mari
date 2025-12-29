CREATE DATABASE IF NOT EXISTS salutefacileps CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE salutefacileps;

CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    permission_id INT NOT NULL,
    department_id INT NULL,
    user_identity_code VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_permission FOREIGN KEY (permission_id) REFERENCES permissions(id),
    CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    fiscal_code VARCHAR(50) UNIQUE NOT NULL,
    residence_address VARCHAR(255),
    phone VARCHAR(30),
    email VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE emergency (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description TEXT,
    alert_code ENUM('bianco','giallo','arancio','rosso') NULL,
    user_id INT NOT NULL,
    patient_id INT NOT NULL,
    vital_signs JSON NULL,
    status VARCHAR(50) DEFAULT 'triage',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_emergency_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_emergency_patient FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE TABLE investigations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE specialist_visits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    department_id INT NOT NULL,
    user_id INT NOT NULL,
    emergency_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sv_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
    CONSTRAINT fk_sv_department FOREIGN KEY (department_id) REFERENCES departments(id),
    CONSTRAINT fk_sv_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_sv_emergency FOREIGN KEY (emergency_id) REFERENCES emergency(id)
);

CREATE TABLE attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    type VARCHAR(50),
    file_path VARCHAR(255) NOT NULL,
    specialist_visit_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_attach_visit FOREIGN KEY (specialist_visit_id) REFERENCES specialist_visits(id)
);

-- Seeder
INSERT INTO permissions (name) VALUES ('Operatore PS'), ('Specialista');

INSERT INTO departments (name) VALUES ('Cardiologia'), ('Ortopedia'), ('Chirurgia'), ('Neurologia'), ('Pediatria'), ('Radiologia'), ('Ostetricia'), ('Urologia'), ('Dermatologia'), ('Gastroenterologia'), ('Endocrinologia'), ('Oncologia'), ('Ginecologia'), ('Psichiatria');

INSERT INTO users (name, surname, permission_id, department_id, user_identity_code, email, password_hash)
VALUES
('Luca', 'Rossi', 1, NULL, 'OPS001', 'ops@ospedale.test', '$2b$10$rv69gR60hZRFNNG1yjr32uBUyafcrn3UFP4kdU2pFtOP31yNO2wZu'),
('Giulia', 'Bianchi', 2, 1, 'SPEC001', 'cardio@ospedale.test', '$2b$10$HCDbYfx1arlASQmaJ4nq8ec/67mUuaIN9RgzBmQp.Pa7oj0xnWCDe'),
('Marco', 'Verdi', 2, 2, 'SPEC002', 'orto@ospedale.test', '$2b$10$HCDbYfx1arlASQmaJ4nq8ec/67mUuaIN9RgzBmQp.Pa7oj0xnWCDe');
