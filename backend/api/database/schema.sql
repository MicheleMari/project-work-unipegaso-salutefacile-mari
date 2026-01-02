CREATE DATABASE IF NOT EXISTS salutefacileps CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE salutefacileps;

CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_permissions_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_departments_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    CONSTRAINT fk_users_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE emergency (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description TEXT,
    alert_code ENUM('bianco','giallo','arancio','rosso') NULL,
    user_id INT NOT NULL,
    patient_id INT NOT NULL,
    vital_signs JSON NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'triage',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_emergency_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_emergency_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE investigations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_investigations_title UNIQUE (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE investigations_performed (
    id INT AUTO_INCREMENT PRIMARY KEY,
    emergency_id INT NOT NULL,
    investigation_id INT NOT NULL,
    performed_by INT NOT NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    outcome TEXT NULL,
    notes TEXT NULL,
    attachment_id INT NULL,
    CONSTRAINT fk_ip_emergency FOREIGN KEY (emergency_id) REFERENCES emergency(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ip_investigation FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_ip_user FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE specialist_visits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    department_id INT NOT NULL,
    user_id INT NOT NULL,
    emergency_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sv_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_sv_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_sv_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_sv_emergency FOREIGN KEY (emergency_id) REFERENCES emergency(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    investigation_id INT NULL,
    specialist_visit_id INT NULL,
    storage_path VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes INT UNSIGNED NULL,
    owner_ref_count TINYINT GENERATED ALWAYS AS (
        (investigation_id IS NOT NULL) + (specialist_visit_id IS NOT NULL)
    ) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_attach_investigation FOREIGN KEY (investigation_id) REFERENCES investigations_performed(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_attach_visit FOREIGN KEY (specialist_visit_id) REFERENCES specialist_visits(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_attachment_size CHECK (size_bytes IS NULL OR size_bytes >= 0),
    CONSTRAINT chk_attachment_owner_one CHECK (owner_ref_count = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE investigations_performed
    ADD CONSTRAINT fk_ip_attachment FOREIGN KEY (attachment_id) REFERENCES attachments(id) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX idx_users_permission ON users(permission_id);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_emergency_user ON emergency(user_id);
CREATE INDEX idx_emergency_patient ON emergency(patient_id);
CREATE INDEX idx_ip_emergency ON investigations_performed(emergency_id);
CREATE INDEX idx_ip_investigation ON investigations_performed(investigation_id);
CREATE INDEX idx_ip_performed_by ON investigations_performed(performed_by);
CREATE INDEX idx_sv_patient ON specialist_visits(patient_id);
CREATE INDEX idx_sv_department ON specialist_visits(department_id);
CREATE INDEX idx_sv_user ON specialist_visits(user_id);
CREATE INDEX idx_sv_emergency ON specialist_visits(emergency_id);
CREATE INDEX idx_attach_investigation ON attachments(investigation_id);
CREATE INDEX idx_attach_specialist ON attachments(specialist_visit_id);

-- Seeder
INSERT INTO permissions (name) VALUES ('Operatore PS'), ('Specialista');

INSERT INTO departments (name) VALUES ('Cardiologia'), ('Ortopedia'), ('Chirurgia'), ('Neurologia'), ('Pediatria'), ('Radiologia'), ('Ostetricia'), ('Urologia'), ('Dermatologia'), ('Gastroenterologia'), ('Endocrinologia'), ('Oncologia'), ('Ginecologia'), ('Psichiatria');

INSERT INTO users (name, surname, permission_id, department_id, user_identity_code, email, password_hash)
VALUES
('Luca', 'Rossi', 1, NULL, 'OPS001', 'ops@ospedale.test', '$2b$10$rv69gR60hZRFNNG1yjr32uBUyafcrn3UFP4kdU2pFtOP31yNO2wZu'),
('Giulia', 'Bianchi', 2, 1, 'SPEC001', 'cardio@ospedale.test', '$2b$10$HCDbYfx1arlASQmaJ4nq8ec/67mUuaIN9RgzBmQp.Pa7oj0xnWCDe'),
('Marco', 'Verdi', 2, 2, 'SPEC002', 'orto@ospedale.test', '$2b$10$HCDbYfx1arlASQmaJ4nq8ec/67mUuaIN9RgzBmQp.Pa7oj0xnWCDe');

INSERT INTO investigations (title, description) VALUES
('ECG', 'Elettrocardiogramma a 12 derivazioni'),
('Stick Urine', 'Analisi rapida urine'),
('Emogas (EGA)', 'Emogasanalisi arteriosa'),
('Prelievo Ematico', 'Prelievo per esami ematochimici'),
('Tampone Covid', 'Test antigenico rapido'),
('Glucometria', 'Misurazione glicemia capillare'),
('Alcol Test', 'Test alcolemico');
