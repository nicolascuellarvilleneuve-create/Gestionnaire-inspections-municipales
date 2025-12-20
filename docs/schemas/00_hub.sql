-- =============================================
-- DATABASE: city_hub (The Command Center)
-- =============================================
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- 1. CENTRAL MAP TABLE
CREATE TABLE inspections_hub (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adresse_civique TEXT NOT NULL,
    geom GEOMETRY(POINT, 4326),
    type_batiment TEXT NOT NULL,
    status_conformite TEXT CHECK (status_conformite IN ('Conforme', 'Non-conforme')),
    date_inspection DATE NOT NULL,
    
    -- Link to Foreign Database
    source_db TEXT NOT NULL, -- e.g. 'city_industrie'
    source_id UUID NOT NULL  -- ID in the foreign DB
);
CREATE INDEX idx_hub_geom ON inspections_hub USING GIST (geom);

-- 2. AUDIT LOG (Internal)
CREATE TABLE security_audit_log (
    id SERIAL PRIMARY KEY,
    user_name TEXT,
    action_type TEXT,
    target_record TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);
