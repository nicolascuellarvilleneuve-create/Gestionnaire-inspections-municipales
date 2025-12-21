-- =============================================
-- DATABASE: city_plans
-- PURPOSE: Storage for Urbanism Documents & Professional Validation
-- =============================================

CREATE TABLE IF NOT EXISTS documents_urbanisme (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID NOT NULL, -- Logical link to the Hub/Spoke inspection
    
    -- Categorization
    category TEXT NOT NULL CHECK (category IN ('implantation', 'architecture', 'ingenierie', 'autre')),
    description TEXT,
    
    -- File Storage (Path Reference)
    file_path TEXT NOT NULL,
    file_hash TEXT, -- MD5/SHA256 for duplicate file detection
    scan_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Cross-Reference Data
    lot_id UUID NOT NULL -- Logical Link to city_geo_ref.lots(id)
);

CREATE TABLE IF NOT EXISTS validations_professionnelles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents_urbanisme(id) ON DELETE CASCADE,
    
    -- Professional Identity
    ordre_professionnel TEXT NOT NULL CHECK (ordre_professionnel IN ('OAGQ', 'OAQ', 'OIQ', 'OTPQ')),
    numero_membre TEXT NOT NULL,
    nom_professionnel TEXT,
    
    -- Plan Identification (For Re-Use Warning)
    numero_minute TEXT, -- The "Plan ID" or "Minute" from the professional
    date_plan DATE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- CONSTRAINT: Warn if same Minute used by same Pro (Application Logic will check this, DB enforces uniqueness?)
    -- We allow re-use but we want to WARN. So no UNIQUE constraint here.
    -- But we index it for fast lookup.
    CONSTRAINT unique_plan_usage UNIQUE (ordre_professionnel, numero_membre, numero_minute, document_id) 
    -- Actually, this constraint just prevents duplicate rows for the SAME doc. 
    -- We want to find *other* docs with same Minute.
);

CREATE INDEX idx_pro_lookup ON validations_professionnelles (ordre_professionnel, numero_membre, numero_minute);
CREATE INDEX idx_lot_lookup ON documents_urbanisme (lot_id);
