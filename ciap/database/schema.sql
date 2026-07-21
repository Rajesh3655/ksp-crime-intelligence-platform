-- ============================================================
-- KSP CIAP — Catalyst Data Store Schema
-- Karnataka State Police Crime Intelligence & Analytics Platform
-- ============================================================

-- ── Users ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Users (
    user_id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    catalyst_uid    VARCHAR(100)  UNIQUE NOT NULL COMMENT 'Catalyst Auth UID',
    employee_id     VARCHAR(50)   UNIQUE NOT NULL,
    full_name       VARCHAR(150)  NOT NULL,
    email           VARCHAR(200)  UNIQUE NOT NULL,
    phone           VARCHAR(20),
    role            ENUM(
        'super_admin',
        'scrb_analyst',
        'district_officer',
        'station_officer',
        'investigator'
    ) NOT NULL DEFAULT 'investigator',
    district_id     BIGINT,
    station_id      BIGINT,
    lang_preference ENUM('en', 'kn') NOT NULL DEFAULT 'en',
    status          ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    last_login_at   DATETIME,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_district (district_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Platform users with RBAC roles';

-- ── District ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS District (
    district_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    code            VARCHAR(10)  UNIQUE NOT NULL COMMENT 'e.g. BLR, MYS',
    name_en         VARCHAR(100) NOT NULL,
    name_kn         VARCHAR(100) NOT NULL,
    division        VARCHAR(100),
    region          VARCHAR(100),
    hq_lat          DECIMAL(10, 7),
    hq_lng          DECIMAL(10, 7),
    commissioner_id BIGINT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Station ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Station (
    station_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    district_id     BIGINT        NOT NULL,
    code            VARCHAR(20)   UNIQUE NOT NULL,
    name_en         VARCHAR(150)  NOT NULL,
    name_kn         VARCHAR(150)  NOT NULL,
    address         TEXT,
    lat             DECIMAL(10, 7),
    lng             DECIMAL(10, 7),
    officer_count   INT DEFAULT 0,
    vehicle_count   INT DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (district_id) REFERENCES District(district_id) ON DELETE RESTRICT,
    INDEX idx_district (district_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── FIR ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS FIR (
    fir_id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    fir_number      VARCHAR(50)   UNIQUE NOT NULL COMMENT 'e.g. BLR/2024/4821',
    district_id     BIGINT        NOT NULL,
    station_id      BIGINT        NOT NULL,
    crime_type      VARCHAR(100)  NOT NULL,
    crime_category  VARCHAR(100)  NOT NULL,
    severity        ENUM('critical', 'high', 'medium', 'low') NOT NULL DEFAULT 'medium',
    status          ENUM('open', 'pending', 'closed', 'escalated') NOT NULL DEFAULT 'open',
    incident_date   DATE          NOT NULL,
    incident_time   TIME,
    location_desc   TEXT,
    lat             DECIMAL(10, 7),
    lng             DECIMAL(10, 7),
    description     TEXT,
    assigned_to     BIGINT        COMMENT 'user_id of assigned officer',
    created_by      BIGINT        NOT NULL,
    closed_at       DATETIME,
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (district_id)  REFERENCES District(district_id) ON DELETE RESTRICT,
    FOREIGN KEY (station_id)   REFERENCES Station(station_id)   ON DELETE RESTRICT,
    FOREIGN KEY (assigned_to)  REFERENCES Users(user_id)        ON DELETE SET NULL,
    FOREIGN KEY (created_by)   REFERENCES Users(user_id)        ON DELETE RESTRICT,
    INDEX idx_district_date    (district_id, incident_date),
    INDEX idx_station          (station_id),
    INDEX idx_status           (status),
    INDEX idx_severity         (severity),
    INDEX idx_crime_type       (crime_type),
    INDEX idx_created_at       (created_at),
    FULLTEXT idx_ft_description (description, crime_type, location_desc)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── CrimeIncident ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS CrimeIncident (
    incident_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    fir_id          BIGINT        NOT NULL,
    incident_type   VARCHAR(100)  NOT NULL,
    crime_category  VARCHAR(100)  NOT NULL,
    severity        ENUM('critical', 'high', 'medium', 'low') NOT NULL,
    lat             DECIMAL(10, 7) NOT NULL,
    lng             DECIMAL(10, 7) NOT NULL,
    location_name   VARCHAR(255),
    occurred_at     DATETIME      NOT NULL,
    weapon_used     VARCHAR(100),
    modus_operandi  TEXT,
    property_loss   DECIMAL(15, 2),
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fir_id) REFERENCES FIR(fir_id) ON DELETE CASCADE,
    INDEX idx_fir         (fir_id),
    INDEX idx_occurred    (occurred_at),
    INDEX idx_geo         (lat, lng),
    INDEX idx_category    (crime_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Criminal ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Criminal (
    criminal_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150)  NOT NULL,
    alias           VARCHAR(200),
    dob             DATE,
    gender          ENUM('male', 'female', 'other'),
    aadhaar_hash    VARCHAR(64)   COMMENT 'SHA-256 of Aadhaar (never store raw)',
    nationality     VARCHAR(50)   DEFAULT 'Indian',
    address         TEXT,
    photo_url       VARCHAR(500)  COMMENT 'Catalyst Stratus URL',
    face_encoding   TEXT          COMMENT 'Zia Face embedding JSON',
    risk_score      INT           DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
    gang_affiliation VARCHAR(200),
    is_wanted       BOOLEAN       DEFAULT FALSE,
    is_arrested     BOOLEAN       DEFAULT FALSE,
    created_by      BIGINT,
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE SET NULL,
    INDEX idx_name        (name),
    INDEX idx_risk        (risk_score),
    INDEX idx_wanted      (is_wanted),
    FULLTEXT idx_ft_name  (name, alias)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Criminal-FIR Junction ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS CriminalFIR (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    criminal_id     BIGINT NOT NULL,
    fir_id          BIGINT NOT NULL,
    role            ENUM('suspect', 'accused', 'witness', 'informant') NOT NULL DEFAULT 'suspect',
    linked_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    linked_by       BIGINT,
    FOREIGN KEY (criminal_id) REFERENCES Criminal(criminal_id) ON DELETE CASCADE,
    FOREIGN KEY (fir_id)      REFERENCES FIR(fir_id)           ON DELETE CASCADE,
    FOREIGN KEY (linked_by)   REFERENCES Users(user_id)         ON DELETE SET NULL,
    UNIQUE KEY uq_criminal_fir (criminal_id, fir_id),
    INDEX idx_criminal (criminal_id),
    INDEX idx_fir      (fir_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Victim ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Victim (
    victim_id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    fir_id              BIGINT        NOT NULL,
    name                VARCHAR(150)  NOT NULL,
    age                 INT,
    gender              ENUM('male', 'female', 'other'),
    contact             VARCHAR(20),
    address             TEXT,
    vulnerability_score INT DEFAULT 0 CHECK (vulnerability_score BETWEEN 0 AND 100),
    injury_type         VARCHAR(100),
    statement_recorded  BOOLEAN DEFAULT FALSE,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fir_id) REFERENCES FIR(fir_id) ON DELETE CASCADE,
    INDEX idx_fir (fir_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Evidence ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Evidence (
    evidence_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    fir_id          BIGINT        NOT NULL,
    type            ENUM('document', 'image', 'video', 'audio', 'physical', 'digital') NOT NULL,
    description     VARCHAR(500),
    storage_url     VARCHAR(500)  COMMENT 'Catalyst Stratus URL',
    ocr_text        LONGTEXT      COMMENT 'Extracted by Zia OCR',
    hash_sha256     VARCHAR(64)   COMMENT 'File integrity hash',
    file_size_bytes BIGINT,
    uploaded_by     BIGINT,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fir_id)      REFERENCES FIR(fir_id)      ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES Users(user_id)    ON DELETE SET NULL,
    INDEX idx_fir  (fir_id),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Forecast ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Forecast (
    forecast_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    district_id     BIGINT,
    crime_type      VARCHAR(100),
    forecast_start  DATE          NOT NULL,
    forecast_end    DATE          NOT NULL,
    predicted_count INT           NOT NULL,
    lower_bound     INT,
    upper_bound     INT,
    confidence_pct  DECIMAL(5, 2) COMMENT 'e.g. 87.5 = 87.5% confidence',
    model_name      VARCHAR(100)  DEFAULT 'Zia AutoML LSTM',
    model_version   VARCHAR(50),
    model_accuracy  DECIMAL(5, 2) COMMENT 'Model accuracy at time of generation',
    explanation     JSON          COMMENT 'Explainability factors as JSON',
    generated_by    BIGINT        COMMENT 'Zia Job ID',
    generated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (district_id) REFERENCES District(district_id) ON DELETE SET NULL,
    INDEX idx_district_date (district_id, forecast_start),
    INDEX idx_crime_type    (crime_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── RiskScore ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS RiskScore (
    score_id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    district_id         BIGINT,
    station_id          BIGINT,
    overall_score       INT NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
    risk_level          ENUM('critical', 'high', 'medium', 'low') NOT NULL,
    crime_rate_score    INT,
    recidivism_score    INT,
    socioeconomic_score INT,
    infrastructure_score INT,
    trend               ENUM('up', 'down', 'stable') DEFAULT 'stable',
    computed_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_until         DATETIME,
    FOREIGN KEY (district_id) REFERENCES District(district_id) ON DELETE SET NULL,
    FOREIGN KEY (station_id)  REFERENCES Station(station_id)   ON DELETE SET NULL,
    INDEX idx_district     (district_id),
    INDEX idx_computed     (computed_at),
    INDEX idx_risk_level   (risk_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Alert ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Alert (
    alert_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    alert_type      VARCHAR(100)  NOT NULL,
    severity        ENUM('critical', 'high', 'medium', 'low') NOT NULL,
    district_id     BIGINT,
    station_id      BIGINT,
    fir_id          BIGINT,
    message         TEXT          NOT NULL,
    message_kn      TEXT          COMMENT 'Kannada translation of message',
    status          ENUM('active', 'acknowledged', 'resolved') NOT NULL DEFAULT 'active',
    trigger_source  VARCHAR(100)  COMMENT 'e.g. Catalyst Signals, Manual, Zia',
    signal_id       VARCHAR(200)  COMMENT 'Catalyst Signal ID that triggered this',
    assigned_to     BIGINT,
    acknowledged_by BIGINT,
    acknowledged_at DATETIME,
    resolved_by     BIGINT,
    resolved_at     DATETIME,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (district_id)     REFERENCES District(district_id) ON DELETE SET NULL,
    FOREIGN KEY (station_id)      REFERENCES Station(station_id)   ON DELETE SET NULL,
    FOREIGN KEY (fir_id)          REFERENCES FIR(fir_id)           ON DELETE SET NULL,
    FOREIGN KEY (assigned_to)     REFERENCES Users(user_id)        ON DELETE SET NULL,
    FOREIGN KEY (acknowledged_by) REFERENCES Users(user_id)        ON DELETE SET NULL,
    FOREIGN KEY (resolved_by)     REFERENCES Users(user_id)        ON DELETE SET NULL,
    INDEX idx_status   (status),
    INDEX idx_severity (severity),
    INDEX idx_district (district_id),
    INDEX idx_created  (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── CitizenReport ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS CitizenReport (
    report_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    category        VARCHAR(100),
    description     TEXT          NOT NULL,
    lat             DECIMAL(10, 7),
    lng             DECIMAL(10, 7),
    location_name   VARCHAR(255),
    media_url       VARCHAR(500)  COMMENT 'Catalyst Stratus URL',
    reporter_phone  VARCHAR(20)   COMMENT 'Hashed for privacy',
    status          ENUM('pending', 'verified', 'rejected', 'converted') NOT NULL DEFAULT 'pending',
    verified_by     BIGINT,
    verified_at     DATETIME,
    fir_id          BIGINT        COMMENT 'Set when converted to FIR',
    assigned_station BIGINT,
    rejection_reason VARCHAR(500),
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (verified_by)       REFERENCES Users(user_id)    ON DELETE SET NULL,
    FOREIGN KEY (fir_id)            REFERENCES FIR(fir_id)       ON DELETE SET NULL,
    FOREIGN KEY (assigned_station)  REFERENCES Station(station_id) ON DELETE SET NULL,
    INDEX idx_status  (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── AuditLog ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS AuditLog (
    log_id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT,
    action          VARCHAR(100)  NOT NULL,
    resource_type   VARCHAR(100)  NOT NULL,
    resource_id     VARCHAR(200),
    old_values      JSON,
    new_values      JSON,
    ip_address      VARCHAR(45),
    user_agent      VARCHAR(500),
    session_id      VARCHAR(200),
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL,
    INDEX idx_user    (user_id),
    INDEX idx_action  (action),
    INDEX idx_created (created_at),
    INDEX idx_resource (resource_type, resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── GeneratedReport ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS GeneratedReport (
    report_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_name     VARCHAR(300)  NOT NULL,
    report_type     ENUM('monthly', 'quarterly', 'scrb', 'briefing', 'custom') NOT NULL,
    district_id     BIGINT,
    period_start    DATE,
    period_end      DATE,
    status          ENUM('queued', 'generating', 'ready', 'failed') NOT NULL DEFAULT 'queued',
    pdf_url         VARCHAR(500)  COMMENT 'Catalyst Stratus URL for PDF',
    excel_url       VARCHAR(500)  COMMENT 'Catalyst Stratus URL for Excel',
    file_size_bytes BIGINT,
    smartbrowz_job  VARCHAR(200)  COMMENT 'Catalyst SmartBrowz job ID',
    requested_by    BIGINT,
    completed_at    DATETIME,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (district_id)  REFERENCES District(district_id) ON DELETE SET NULL,
    FOREIGN KEY (requested_by) REFERENCES Users(user_id)        ON DELETE SET NULL,
    INDEX idx_type    (report_type),
    INDEX idx_status  (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── IngestionBatch ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS IngestionBatch (
    batch_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    source          ENUM('csv', 'excel', 'citizen', 'cctns', 'census', 'api') NOT NULL,
    filename        VARCHAR(300),
    storage_url     VARCHAR(500),
    status          ENUM('uploaded', 'validating', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'uploaded',
    total_records   INT DEFAULT 0,
    processed_records INT DEFAULT 0,
    failed_records  INT DEFAULT 0,
    error_log       JSON,
    uploaded_by     BIGINT,
    completed_at    DATETIME,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES Users(user_id) ON DELETE SET NULL,
    INDEX idx_status  (status),
    INDEX idx_source  (source),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seed: Karnataka Districts ──────────────────────────────────────────────
INSERT INTO District (code, name_en, name_kn, division, hq_lat, hq_lng) VALUES
('BLR',  'Bengaluru Urban',   'ಬೆಂಗಳೂರು ನಗರ',      'Bengaluru',  12.9716, 77.5946),
('MYS',  'Mysuru',            'ಮೈಸೂರು',             'Mysuru',     12.2958, 76.6394),
('MNG',  'Mangaluru',         'ಮಂಗಳೂರು',            'Coastal',    12.8698, 74.8426),
('HUB',  'Hubballi-Dharwad',  'ಹುಬ್ಬಳ್ಳಿ-ಧಾರವಾಡ',  'North',      15.3647, 75.1240),
('BEL',  'Belagavi',          'ಬೆಳಗಾವಿ',            'North',      15.8497, 74.4977),
('KLB',  'Kalaburagi',        'ಕಲಬುರಗಿ',            'Kalyana',    17.3297, 76.8343),
('BAL',  'Ballari',           'ಬಳ್ಳಾರಿ',            'Kalyana',    15.1394, 76.9214),
('SHI',  'Shivamogga',        'ಶಿವಮೊಗ್ಗ',           'Central',    13.9299, 75.5681),
('TUM',  'Tumakuru',          'ತುಮಕೂರು',            'Bengaluru',  13.3379, 77.1173),
('DAV',  'Davangere',         'ದಾವಣಗೆರೆ',           'Central',    14.4644, 75.9218),
('VIJ',  'Vijayapura',        'ವಿಜಯಪುರ',            'Kalyana',    16.8302, 75.7100),
('RMN',  'Ramanagara',        'ರಾಮನಗರ',             'Bengaluru',  12.7161, 77.2807),
('CHI',  'Chikkamagaluru',    'ಚಿಕ್ಕಮಗಳೂರು',       'Central',    13.3161, 75.7720),
('HAV',  'Haveri',            'ಹಾವೇರಿ',             'North',      14.7939, 75.3996),
('GDG',  'Gadag',             'ಗದಗ',                'North',      15.4252, 75.6200),
('KOP',  'Koppal',            'ಕೊಪ್ಪಳ',             'Kalyana',    15.3490, 76.1542),
('RAI',  'Raichur',           'ರಾಯಚೂರು',            'Kalyana',    16.2120, 77.3439),
('YAD',  'Yadgir',            'ಯಾದಗಿರಿ',            'Kalyana',    16.7700, 77.1380),
('BGA',  'Bagalkot',          'ಬಾಗಲಕೋಟೆ',           'North',      16.1691, 75.6965),
('DHW',  'Dharwad',           'ಧಾರವಾಡ',             'North',      15.4589, 75.0078),
('UDU',  'Udupi',             'ಉಡುಪಿ',              'Coastal',    13.3409, 74.7421),
('DKA',  'Dakshina Kannada',  'ದಕ್ಷಿಣ ಕನ್ನಡ',       'Coastal',    12.8438, 74.9900),
('UKA',  'Uttara Kannada',    'ಉತ್ತರ ಕನ್ನಡ',        'Coastal',    14.7943, 74.1316),
('HSN',  'Hassan',            'ಹಾಸನ',               'Mysuru',     13.0033, 76.1004),
('MND',  'Mandya',            'ಮಂಡ್ಯ',              'Mysuru',     12.5218, 76.8951),
('CHA',  'Chamarajanagara',   'ಚಾಮರಾಜನಗರ',          'Mysuru',     11.9261, 76.9447),
('KOD',  'Kodagu',            'ಕೊಡಗು',              'Mysuru',     12.3375, 75.8069),
('CHK',  'Chikkaballapur',    'ಚಿಕ್ಕಬಳ್ಳಾಪುರ',     'Bengaluru',  13.4355, 77.7277),
('KLR',  'Kolar',             'ಕೋಲಾರ',              'Bengaluru',  13.1369, 78.1337),
('BLR_R','Bengaluru Rural',   'ಬೆಂಗಳೂರು ಗ್ರಾಮಾಂತರ', 'Bengaluru',  12.9716, 77.5946)
ON DUPLICATE KEY UPDATE name_en = VALUES(name_en);
