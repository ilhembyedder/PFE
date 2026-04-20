-- V1__init_tenant_schema.sql
-- Tenant Schema creation for individual leasing companies

CREATE TABLE IF NOT EXISTS tenant_config (
    tenant_id UUID PRIMARY KEY,
    ai_deviation_moderate NUMERIC(5, 2),
    ai_deviation_critical NUMERIC(5, 2),
    dormancy_threshold_days INT,
    phase_legal_delays JSONB,
    version INT NOT NULL DEFAULT 0,
    created_by VARCHAR(255),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_user (
    id UUID PRIMARY KEY,
    tenant_id UUID,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    last_login TIMESTAMP WITH TIME ZONE,
    version INT NOT NULL DEFAULT 0,
    created_by VARCHAR(255),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_email_tenant UNIQUE (email, tenant_id)
);

CREATE TABLE IF NOT EXISTS client (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    full_name_or_company VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    version INT NOT NULL DEFAULT 0,
    created_by VARCHAR(255),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contract (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    client_id UUID NOT NULL,
    reference_number VARCHAR(100) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL,
    version INT NOT NULL DEFAULT 0,
    created_by VARCHAR(255),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contract_client FOREIGN KEY (client_id) REFERENCES client(id)
);

CREATE TABLE IF NOT EXISTS vehicle (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    contract_id UUID NOT NULL,
    vin VARCHAR(50) NOT NULL,
    license_plate VARCHAR(50),
    brand VARCHAR(100),
    model VARCHAR(100),
    year INT,
    version INT NOT NULL DEFAULT 0,
    created_by VARCHAR(255),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_contract FOREIGN KEY (contract_id) REFERENCES contract(id)
);

CREATE TABLE IF NOT EXISTS recovery_case (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    assignee_id UUID,
    contract_id UUID NOT NULL,
    initial_residual_value_cents BIGINT,
    currency_code VARCHAR(3),
    current_phase VARCHAR(50) NOT NULL,
    phase_started_at TIMESTAMP WITH TIME ZONE,
    last_action_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    version INT NOT NULL DEFAULT 0,
    created_by VARCHAR(255),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rcase_assignee FOREIGN KEY (assignee_id) REFERENCES app_user(id),
    CONSTRAINT fk_rcase_contract FOREIGN KEY (contract_id) REFERENCES contract(id)
);

CREATE TABLE IF NOT EXISTS document (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    uploader_id UUID NOT NULL,
    case_id UUID,
    client_id UUID,
    contract_id UUID,
    vehicle_id UUID,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(512) NOT NULL,
    phase_uploaded_in VARCHAR(50),
    version INT NOT NULL DEFAULT 0,
    created_by VARCHAR(255),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_doc_uploader FOREIGN KEY (uploader_id) REFERENCES app_user(id),
    CONSTRAINT fk_doc_case FOREIGN KEY (case_id) REFERENCES recovery_case(id),
    CONSTRAINT fk_doc_client FOREIGN KEY (client_id) REFERENCES client(id),
    CONSTRAINT fk_doc_contract FOREIGN KEY (contract_id) REFERENCES contract(id),
    CONSTRAINT fk_doc_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle(id)
);

CREATE TABLE IF NOT EXISTS note (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    case_id UUID NOT NULL,
    author_id UUID NOT NULL,
    content TEXT NOT NULL,
    version INT NOT NULL DEFAULT 0,
    created_by VARCHAR(255),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_note_case FOREIGN KEY (case_id) REFERENCES recovery_case(id),
    CONSTRAINT fk_note_author FOREIGN KEY (author_id) REFERENCES app_user(id)
);

CREATE TABLE IF NOT EXISTS ai_valuation (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    case_id UUID NOT NULL,
    document_id UUID,
    extracted_brand VARCHAR(100),
    extracted_model VARCHAR(100),
    extracted_year INT,
    extracted_mileage INT,
    extracted_condition VARCHAR(100),
    estimated_market_value_cents BIGINT,
    currency_code VARCHAR(3),
    deviation_value_cents BIGINT,
    deviation_percentage NUMERIC(5, 2),
    reliability_indicator VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    processed_at TIMESTAMP WITH TIME ZONE,
    version INT NOT NULL DEFAULT 0,
    created_by VARCHAR(255),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ai_val_case FOREIGN KEY (case_id) REFERENCES recovery_case(id),
    CONSTRAINT fk_ai_val_doc FOREIGN KEY (document_id) REFERENCES document(id)
);
