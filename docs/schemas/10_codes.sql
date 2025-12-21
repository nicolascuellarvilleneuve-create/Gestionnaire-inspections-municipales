-- =============================================
-- DATABASE: city_codes (The Living Law)
-- PURPOSE: Central Dictionary for Zoning, Usages, and Smart Regulations.
-- FEATURES: Flexbile JSON Parameters, Versioning, React Field Mapping.
-- =============================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. ZONES (The Map Areas)
CREATE TABLE zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- e.g. "Ha-123"
    description TEXT,
    geom GEOMETRY(POLYGON, 4326)
);

-- 2. USAGES (The Definitions)
CREATE TABLE usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- e.g. "H-1"
    categorie TEXT, -- 'Habitation', 'Commercial', 'Industriel'
    description TEXT,
    parent_category_id UUID REFERENCES usages(id) -- Hierarchy (H-1 is child of Habitation)
);

-- 3. REGULATORY RULES (The Smart Engine)
CREATE TABLE regulatory_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Scope
    zone_id UUID REFERENCES zones(id),
    usage_id UUID REFERENCES usages(id),
    
    -- The Rule Definition
    rule_type TEXT NOT NULL, -- 'min_setback_front', 'max_height', 'permitted_use'
    
    -- React Integration (CRITICAL)
    target_form_field TEXT, -- e.g. 'marge_avant', 'hauteur_batiment'. Tells Frontend what to validate.
    
    -- Flexible Parameters (The "Brains")
    -- Example: { "min": 6.0, "unit": "m", "condition": "corner_lot" }
    parameters JSONB NOT NULL DEFAULT '{}', 
    
    -- Temporal Versioning
    active_from TIMESTAMP DEFAULT NOW(),
    active_to TIMESTAMP, -- If NULL, currently active.
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- VIEW: Current Rules
CREATE OR REPLACE VIEW v_current_rules AS
SELECT * FROM regulatory_rules WHERE active_to IS NULL;


-- 4. CONFORMITY SNAPSHOTS
-- When an inspection is done, we capture the rules used at that time.
-- This creates a permanent record of *why* it was compliant.
CREATE TABLE conformity_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID NOT NULL, -- Link to Hub (Logical)
    rule_data JSONB NOT NULL, -- A dump of the v_current_rules used
    created_at TIMESTAMP DEFAULT NOW()
);
