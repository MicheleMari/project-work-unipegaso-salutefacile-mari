-- Schema per SaluteFacile PS (MySQL 8+)
-- Import con: mysql -u USER -p salutefacile < schema.sql

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE roles (
    id TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id TINYINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_roles FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE patients (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    cf VARCHAR(16) NOT NULL UNIQUE,
    birth_date DATE NULL,
    gender CHAR(1) NULL,
    address VARCHAR(200) NULL,
    city VARCHAR(120) NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(190) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_patients_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Accessi al Pronto Soccorso (ex appointments)
CREATE TABLE ps_encounters (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    patient_id INT UNSIGNED NOT NULL,
    arrival_at DATETIME NOT NULL,
    state ENUM('Registrato','In Attesa Visita','In Visita','Attesa Esiti','OBI','Refertato','Dimesso','Ricoverato') NOT NULL DEFAULT 'Registrato',
    priority ENUM('red','orange','green','white') NOT NULL DEFAULT 'green',
    symptoms TEXT NULL,
    doctor_id INT UNSIGNED NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ps_encounters_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
    CONSTRAINT fk_ps_encounters_doctor FOREIGN KEY (doctor_id) REFERENCES users(id),
    INDEX idx_ps_state (state),
    INDEX idx_ps_priority (priority),
    INDEX idx_ps_arrival (arrival_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE triage_assessments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    encounter_id INT UNSIGNED NOT NULL UNIQUE,
    assessed_by INT UNSIGNED NULL,
    assessed_at DATETIME NOT NULL,
    bp VARCHAR(20) NULL,
    hr VARCHAR(10) NULL,
    spo2 VARCHAR(10) NULL,
    temp VARCHAR(10) NULL,
    notes TEXT NULL,
    CONSTRAINT fk_triage_encounter FOREIGN KEY (encounter_id) REFERENCES ps_encounters(id),
    CONSTRAINT fk_triage_user FOREIGN KEY (assessed_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE exam_orders (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    encounter_id INT UNSIGNED NOT NULL,
    ordered_by INT UNSIGNED NULL,
    type VARCHAR(50) NOT NULL, -- lab/rx/tac/etc.
    description VARCHAR(255) NULL,
    status ENUM('Richiesto','In Corso','Completato','Annullato') NOT NULL DEFAULT 'Richiesto',
    ordered_at DATETIME NOT NULL,
    result_at DATETIME NULL,
    CONSTRAINT fk_exam_encounter FOREIGN KEY (encounter_id) REFERENCES ps_encounters(id),
    CONSTRAINT fk_exam_user FOREIGN KEY (ordered_by) REFERENCES users(id),
    INDEX idx_exam_status (status),
    INDEX idx_exam_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE exam_results (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    exam_order_id INT UNSIGNED NOT NULL UNIQUE,
    report_text TEXT NULL,
    attachments JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_exam_results_order FOREIGN KEY (exam_order_id) REFERENCES exam_orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE clinical_notes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    encounter_id INT UNSIGNED NOT NULL,
    author_id INT UNSIGNED NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notes_encounter FOREIGN KEY (encounter_id) REFERENCES ps_encounters(id),
    CONSTRAINT fk_notes_author FOREIGN KEY (author_id) REFERENCES users(id),
    INDEX idx_notes_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE attachments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    encounter_id INT UNSIGNED NOT NULL,
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(120) NOT NULL,
    size INT UNSIGNED NOT NULL,
    path VARCHAR(255) NOT NULL,
    uploaded_by INT UNSIGNED NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attach_encounter FOREIGN KEY (encounter_id) REFERENCES ps_encounters(id),
    CONSTRAINT fk_attach_user FOREIGN KEY (uploaded_by) REFERENCES users(id),
    INDEX idx_attach_mime (mime_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE discharge_summaries (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    encounter_id INT UNSIGNED NOT NULL UNIQUE,
    doctor_id INT UNSIGNED NULL,
    diagnosis TEXT NULL,
    therapy TEXT NULL,
    followup TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_discharge_encounter FOREIGN KEY (encounter_id) REFERENCES ps_encounters(id),
    CONSTRAINT fk_discharge_doctor FOREIGN KEY (doctor_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NULL,
    action VARCHAR(120) NOT NULL,
    entity VARCHAR(120) NOT NULL,
    entity_id INT UNSIGNED NULL,
    payload JSON NULL,
    ip VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_audit_entity (entity, entity_id),
    INDEX idx_audit_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seeder essenziale
INSERT INTO roles (name, description) VALUES
('admin', 'Accesso completo'),
('operatore', 'Gestione operativa PS'),
('dottore', 'Medico di reparto/PS');

-- Bcrypt hash della password "admin" (cost 10)
INSERT INTO users (name, email, password_hash, role_id) VALUES
('Dev Admin', 'admin@example.com', '$2y$10$Oq5EY50jYOEoTP0TOZcdpeXaGNsq4CPGK/c/pX9nuSUXGMWzMEGf6', 1),
('Dev Operator', 'operator@example.com', '$2y$10$Oq5EY50jYOEoTP0TOZcdpeXaGNsq4CPGK/c/pX9nuSUXGMWzMEGf6', 2),
('Dr. Rossi', 'doctor@example.com', '$2y$10$Oq5EY50jYOEoTP0TOZcdpeXaGNsq4CPGK/c/pX9nuSUXGMWzMEGf6', 3);
