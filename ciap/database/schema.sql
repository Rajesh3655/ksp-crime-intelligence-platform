-- ============================================================
-- KSP CIAP - Catalyst Data Store Schema Contract
-- Source of truth: Police_FIR_ER_Diagram.pdf
-- ============================================================
--
-- Rule:
-- The operational FIR model below mirrors the attached Karnataka Police FIR
-- ERD. CIAP intelligence features must read from these entities and write
-- only derived analytics outputs. Do not replace CaseMaster with custom FIR,
-- Criminal, Station, or Evidence tables.

-- --------------------------------------------------------------------------
-- Official FIR ERD tables
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS State (
    StateID INT PRIMARY KEY,
    StateName VARCHAR(150) NOT NULL,
    NationalityID INT,
    Active BIT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS District (
    DistrictID INT PRIMARY KEY,
    DistrictName VARCHAR(150) NOT NULL,
    StateID INT NOT NULL,
    Active BIT DEFAULT 1,
    FOREIGN KEY (StateID) REFERENCES State(StateID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS UnitType (
    UnitTypeID INT PRIMARY KEY,
    UnitTypeName VARCHAR(150) NOT NULL,
    CityDistState VARCHAR(50),
    Hierarchy INT,
    Active BIT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Unit (
    UnitID INT PRIMARY KEY,
    UnitName VARCHAR(200) NOT NULL,
    TypeID INT,
    ParentUnit INT,
    NationalityID INT,
    StateID INT,
    DistrictID INT,
    Active BIT DEFAULT 1,
    FOREIGN KEY (TypeID) REFERENCES UnitType(UnitTypeID),
    FOREIGN KEY (ParentUnit) REFERENCES Unit(UnitID),
    FOREIGN KEY (StateID) REFERENCES State(StateID),
    FOREIGN KEY (DistrictID) REFERENCES District(DistrictID),
    INDEX idx_unit_district (DistrictID),
    INDEX idx_unit_type (TypeID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Rank (
    RankID INT PRIMARY KEY,
    RankName VARCHAR(150) NOT NULL,
    Hierarchy INT,
    Active BIT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Designation (
    DesignationID INT PRIMARY KEY,
    DesignationName VARCHAR(150) NOT NULL,
    Active BIT DEFAULT 1,
    SortOrder INT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Employee (
    EmployeeID INT PRIMARY KEY,
    DistrictID INT,
    UnitID INT,
    RankID INT,
    DesignationID INT,
    KGID VARCHAR(50),
    FirstName VARCHAR(150),
    EmployeeDOB DATE,
    GenderID INT,
    BloodGroupID INT,
    PhysicallyChallenged BIT,
    AppointmentDate DATE,
    FOREIGN KEY (DistrictID) REFERENCES District(DistrictID),
    FOREIGN KEY (UnitID) REFERENCES Unit(UnitID),
    FOREIGN KEY (RankID) REFERENCES Rank(RankID),
    FOREIGN KEY (DesignationID) REFERENCES Designation(DesignationID),
    INDEX idx_employee_unit (UnitID),
    INDEX idx_employee_rank (RankID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS CaseCategory (
    CaseCategoryID INT PRIMARY KEY,
    LookupValue VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS GravityOffence (
    GravityOffenceID INT PRIMARY KEY,
    LookupValue VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS CaseStatusMaster (
    CaseStatusID INT PRIMARY KEY,
    CaseStatusName VARCHAR(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Court (
    CourtID INT PRIMARY KEY,
    CourtName VARCHAR(200) NOT NULL,
    DistrictID INT,
    StateID INT,
    Active BIT DEFAULT 1,
    FOREIGN KEY (DistrictID) REFERENCES District(DistrictID),
    FOREIGN KEY (StateID) REFERENCES State(StateID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS CrimeHead (
    CrimeHeadID INT PRIMARY KEY,
    CrimeGroupName VARCHAR(200) NOT NULL,
    Active BIT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS CrimeSubHead (
    CrimeSubHeadID INT PRIMARY KEY,
    CrimeHeadID INT NOT NULL,
    CrimeHeadName VARCHAR(200) NOT NULL,
    SeqID INT,
    FOREIGN KEY (CrimeHeadID) REFERENCES CrimeHead(CrimeHeadID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS CaseMaster (
    CaseMasterID INT PRIMARY KEY,
    CrimeNo VARCHAR(30) NOT NULL,
    CaseNo VARCHAR(20),
    CrimeRegisteredDate DATE,
    PolicePersonID INT,
    PoliceStationID INT,
    CaseCategoryID INT,
    GravityOffenceID INT,
    CrimeMajorHeadID INT,
    CrimeMinorHeadID INT,
    CaseStatusID INT,
    CourtID INT,
    IncidentFromDate DATETIME,
    IncidentToDate DATETIME,
    InfoReceivedPSDate DATETIME,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    BriefFacts LONGTEXT,
    FOREIGN KEY (PolicePersonID) REFERENCES Employee(EmployeeID),
    FOREIGN KEY (PoliceStationID) REFERENCES Unit(UnitID),
    FOREIGN KEY (CaseCategoryID) REFERENCES CaseCategory(CaseCategoryID),
    FOREIGN KEY (GravityOffenceID) REFERENCES GravityOffence(GravityOffenceID),
    FOREIGN KEY (CrimeMajorHeadID) REFERENCES CrimeHead(CrimeHeadID),
    FOREIGN KEY (CrimeMinorHeadID) REFERENCES CrimeSubHead(CrimeSubHeadID),
    FOREIGN KEY (CaseStatusID) REFERENCES CaseStatusMaster(CaseStatusID),
    FOREIGN KEY (CourtID) REFERENCES Court(CourtID),
    UNIQUE KEY uq_case_crime_no (CrimeNo),
    INDEX idx_case_station_date (PoliceStationID, CrimeRegisteredDate),
    INDEX idx_case_geo (latitude, longitude),
    FULLTEXT idx_case_facts (BriefFacts)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS OccupationMaster (
    OccupationID INT PRIMARY KEY,
    OccupationName VARCHAR(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ReligionMaster (
    ReligionID INT PRIMARY KEY,
    ReligionName VARCHAR(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS CasteMaster (
    caste_master_id INT PRIMARY KEY,
    caste_master_name VARCHAR(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ComplainantDetails (
    ComplainantID INT PRIMARY KEY,
    CaseMasterID INT NOT NULL,
    ComplainantName VARCHAR(200),
    AgeYear INT,
    OccupationID INT,
    ReligionID INT,
    CasteID INT,
    GenderID INT,
    FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID),
    FOREIGN KEY (OccupationID) REFERENCES OccupationMaster(OccupationID),
    FOREIGN KEY (ReligionID) REFERENCES ReligionMaster(ReligionID),
    FOREIGN KEY (CasteID) REFERENCES CasteMaster(caste_master_id),
    INDEX idx_complainant_case (CaseMasterID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Victim (
    VictimMasterID INT PRIMARY KEY,
    CaseMasterID INT NOT NULL,
    VictimName VARCHAR(200),
    AgeYear INT,
    GenderID INT,
    VictimPolice VARCHAR(10),
    FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID),
    INDEX idx_victim_case (CaseMasterID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Accused (
    AccusedMasterID INT PRIMARY KEY,
    CaseMasterID INT NOT NULL,
    AccusedName VARCHAR(200),
    AgeYear INT,
    GenderID INT,
    PersonID VARCHAR(20),
    FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID),
    INDEX idx_accused_case (CaseMasterID),
    FULLTEXT idx_accused_name (AccusedName)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Act (
    ActCode VARCHAR(50) PRIMARY KEY,
    ActDescription VARCHAR(500),
    ShortName VARCHAR(100),
    Active BIT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Section (
    ActCode VARCHAR(50) NOT NULL,
    SectionCode VARCHAR(50) NOT NULL,
    SectionDescription VARCHAR(500),
    Active BIT DEFAULT 1,
    PRIMARY KEY (ActCode, SectionCode),
    FOREIGN KEY (ActCode) REFERENCES Act(ActCode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ActSectionAssociation (
    CaseMasterID INT NOT NULL,
    ActID VARCHAR(50) NOT NULL,
    SectionID VARCHAR(50) NOT NULL,
    ActOrderID INT,
    SectionOrderID INT,
    PRIMARY KEY (CaseMasterID, ActID, SectionID),
    FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID),
    FOREIGN KEY (ActID) REFERENCES Act(ActCode),
    FOREIGN KEY (ActID, SectionID) REFERENCES Section(ActCode, SectionCode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS CrimeHeadActSection (
    CrimeHeadID INT NOT NULL,
    ActCode VARCHAR(50) NOT NULL,
    SectionCode VARCHAR(50) NOT NULL,
    PRIMARY KEY (CrimeHeadID, ActCode, SectionCode),
    FOREIGN KEY (CrimeHeadID) REFERENCES CrimeHead(CrimeHeadID),
    FOREIGN KEY (ActCode) REFERENCES Act(ActCode),
    FOREIGN KEY (ActCode, SectionCode) REFERENCES Section(ActCode, SectionCode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ArrestSurrender (
    ArrestSurrenderID INT PRIMARY KEY,
    CaseMasterID INT NOT NULL,
    ArrestSurrenderTypeID INT,
    ArrestSurrenderDate DATE,
    ArrestSurrenderStateId INT,
    ArrestSurrenderDistrictId INT,
    PoliceStationID INT,
    IOID INT,
    CourtID INT,
    AccusedMasterID INT,
    IsAccused BIT,
    IsComplainantAccused BIT,
    FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID),
    FOREIGN KEY (ArrestSurrenderStateId) REFERENCES State(StateID),
    FOREIGN KEY (ArrestSurrenderDistrictId) REFERENCES District(DistrictID),
    FOREIGN KEY (PoliceStationID) REFERENCES Unit(UnitID),
    FOREIGN KEY (IOID) REFERENCES Employee(EmployeeID),
    FOREIGN KEY (CourtID) REFERENCES Court(CourtID),
    FOREIGN KEY (AccusedMasterID) REFERENCES Accused(AccusedMasterID),
    INDEX idx_arrest_case (CaseMasterID),
    INDEX idx_arrest_accused (AccusedMasterID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ChargesheetDetails (
    CSID INT PRIMARY KEY,
    CaseMasterID INT NOT NULL,
    csdate DATETIME,
    cstype CHAR(1),
    PolicePersonID INT,
    FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID),
    FOREIGN KEY (PolicePersonID) REFERENCES Employee(EmployeeID),
    INDEX idx_chargesheet_case (CaseMasterID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------------
-- CIAP intelligence outputs derived from the official ERD
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS Users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    catalyst_uid VARCHAR(100) UNIQUE NOT NULL,
    employee_id INT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255),
    role ENUM('super_admin','scrb_analyst','district_officer','station_officer','investigator') NOT NULL,
    district_id INT,
    station_id INT,
    lang_preference ENUM('en','kn') DEFAULT 'en',
    status ENUM('active','inactive','suspended') DEFAULT 'active',
    last_login_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES Employee(EmployeeID),
    FOREIGN KEY (district_id) REFERENCES District(DistrictID),
    FOREIGN KEY (station_id) REFERENCES Unit(UnitID),
    INDEX idx_users_role (role),
    INDEX idx_users_district (district_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS IntelligenceRun (
    IntelligenceRunID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ModuleName ENUM('dashboard','geo','pattern','link','repeat_offender','modus_operandi','forecast','socio_economic','risk','anomaly','timeline','copilot','report','alert') NOT NULL,
    CatalystService VARCHAR(80) NOT NULL,
    ModelName VARCHAR(120),
    InputSnapshot JSON,
    Status ENUM('queued','running','completed','failed') DEFAULT 'queued',
    StartedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    CompletedAt DATETIME,
    ErrorMessage TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS IntelligenceFinding (
    FindingID BIGINT AUTO_INCREMENT PRIMARY KEY,
    IntelligenceRunID BIGINT,
    CaseMasterID INT,
    DistrictID INT,
    PoliceStationID INT,
    FindingType ENUM('pattern','hotspot','forecast','risk','anomaly','network','repeat_offender','modus_operandi','deployment','report') NOT NULL,
    Severity ENUM('green','yellow','orange','red') DEFAULT 'yellow',
    ConfidencePct DECIMAL(5,2),
    Summary VARCHAR(500) NOT NULL,
    Explanation JSON NOT NULL,
    SupportingCases JSON,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (IntelligenceRunID) REFERENCES IntelligenceRun(IntelligenceRunID),
    FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID),
    FOREIGN KEY (DistrictID) REFERENCES District(DistrictID),
    FOREIGN KEY (PoliceStationID) REFERENCES Unit(UnitID),
    INDEX idx_finding_type (FindingType),
    INDEX idx_finding_station (PoliceStationID),
    INDEX idx_finding_created (CreatedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS AIFeatureStore (
    FeatureID BIGINT AUTO_INCREMENT PRIMARY KEY,
    CaseMasterID INT,
    VectorType ENUM('crime_embedding','risk_vector','prediction','historical_trend','gang_metric','similarity_vector') NOT NULL,
    SourceHash VARCHAR(64) NOT NULL,
    FeatureVector JSON NOT NULL,
    Metadata JSON,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID),
    UNIQUE KEY uq_feature_source (CaseMasterID, VectorType, SourceHash),
    INDEX idx_feature_case (CaseMasterID),
    INDEX idx_feature_type (VectorType)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ImmutableIntelligenceHistory (
    HistoryID BIGINT AUTO_INCREMENT PRIMARY KEY,
    CaseMasterID INT,
    EventType VARCHAR(120) NOT NULL,
    Payload JSON NOT NULL,
    PayloadHash VARCHAR(64) NOT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID),
    INDEX idx_history_case (CaseMasterID),
    INDEX idx_history_event (EventType)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS MLTrainingDataset (
    DatasetID BIGINT AUTO_INCREMENT PRIMARY KEY,
    DatasetVersion VARCHAR(80) UNIQUE NOT NULL,
    SourceHash VARCHAR(64) NOT NULL,
    SourceTables JSON NOT NULL,
    RowCount INT NOT NULL DEFAULT 0,
    FeatureCount INT NOT NULL DEFAULT 0,
    StratusObjectKey VARCHAR(500),
    Status ENUM('building','ready','failed','archived') DEFAULT 'building',
    BuiltAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    BuiltBy VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS MLModelRegistry (
    ModelRegistryID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ModelID VARCHAR(120) NOT NULL,
    Version VARCHAR(80) NOT NULL,
    TrainingDate DATETIME NOT NULL,
    Algorithm VARCHAR(120) NOT NULL,
    Hyperparameters JSON,
    Accuracy DECIMAL(8,5),
    PrecisionScore DECIMAL(8,5),
    RecallScore DECIMAL(8,5),
    F1Score DECIMAL(8,5),
    AUCScore DECIMAL(8,5),
    TrainingDatasetVersion VARCHAR(80),
    DeploymentStatus ENUM('development','shadow','production','archived') DEFAULT 'development',
    ApprovalStatus ENUM('pending','approved','rejected','auto_approved') DEFAULT 'pending',
    ArtifactPath VARCHAR(500),
    SupportedTasks JSON NOT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_model_version (ModelID, Version),
    FOREIGN KEY (TrainingDatasetVersion) REFERENCES MLTrainingDataset(DatasetVersion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS MLPredictionAudit (
    PredictionAuditID BIGINT AUTO_INCREMENT PRIMARY KEY,
    CaseMasterID INT,
    InputHash VARCHAR(64) NOT NULL,
    FeatureVersion VARCHAR(80) NOT NULL,
    ModelID VARCHAR(120) NOT NULL,
    ModelVersion VARCHAR(80) NOT NULL,
    Output JSON NOT NULL,
    Confidence DECIMAL(8,5),
    Reliability DECIMAL(8,5),
    ExpectedError DECIMAL(8,5),
    Uncertainty DECIMAL(8,5),
    OfficerID INT,
    DistrictID INT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID),
    FOREIGN KEY (OfficerID) REFERENCES Employee(EmployeeID),
    FOREIGN KEY (DistrictID) REFERENCES District(DistrictID),
    INDEX idx_prediction_case (CaseMasterID),
    INDEX idx_prediction_model (ModelID, ModelVersion),
    INDEX idx_prediction_created (CreatedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS MLDriftEvent (
    DriftEventID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ModelID VARCHAR(120) NOT NULL,
    ModelVersion VARCHAR(80),
    DriftType ENUM('data','concept','prediction','feature') NOT NULL,
    DriftScore DECIMAL(8,5) NOT NULL,
    Threshold DECIMAL(8,5) NOT NULL,
    Status ENUM('detected','retraining_queued','approved','dismissed') DEFAULT 'detected',
    Evidence JSON,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_drift_model (ModelID, CreatedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS HumanFeedback (
    FeedbackID BIGINT AUTO_INCREMENT PRIMARY KEY,
    CaseMasterID INT,
    FindingID BIGINT,
    FeedbackType ENUM('prediction_usefulness','hotspot_accuracy','mo_similarity','gang_detection','risk_explanation') NOT NULL,
    Rating INT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    Comment VARCHAR(1000),
    OfficerID INT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID),
    FOREIGN KEY (FindingID) REFERENCES IntelligenceFinding(FindingID),
    FOREIGN KEY (OfficerID) REFERENCES Employee(EmployeeID),
    INDEX idx_feedback_type (FeedbackType),
    INDEX idx_feedback_case (CaseMasterID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS GeneratedIntelligenceReport (
    ReportID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ReportType ENUM('SCRB','weekly','monthly','quarterly','briefing','custom') NOT NULL,
    DistrictID INT,
    PeriodStart DATE,
    PeriodEnd DATE,
    SmartBrowzJobID VARCHAR(200),
    StratusObjectKey VARCHAR(500),
    Status ENUM('queued','generating','ready','failed') DEFAULT 'queued',
    RequestedBy VARCHAR(100),
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (DistrictID) REFERENCES District(DistrictID),
    FOREIGN KEY (RequestedBy) REFERENCES Users(catalyst_uid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS AuditLog (
    AuditLogID BIGINT AUTO_INCREMENT PRIMARY KEY,
    CatalystUID VARCHAR(100),
    Action VARCHAR(120) NOT NULL,
    ResourceType VARCHAR(120) NOT NULL,
    ResourceID VARCHAR(200),
    Payload JSON,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CatalystUID) REFERENCES CatalystUserProfile(CatalystUID),
    INDEX idx_audit_user_date (CatalystUID, CreatedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
