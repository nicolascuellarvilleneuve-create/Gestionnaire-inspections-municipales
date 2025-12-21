-- =============================================
-- DATABASE: city_geo_ref (The Physical Truth)
-- PURPOSE: Single Source of Truth for Lots, Addresses, and Geometries.
-- FEATURES: Temporal History, Multi-Source Priority, Lineage Tracking.
-- =============================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. LOTS (The Land)
CREATE TABLE lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matricule TEXT NOT NULL, -- The official Infolot Key (e.g., "5 123 456")
    
    -- Multi-Source Logic
    data_source TEXT NOT NULL CHECK (data_source IN ('infolot_wms', 'ville_geo_dept', 'mrc_sig', 'manual_correction')),
    geom_quality INTEGER DEFAULT 3 CHECK (geom_quality BETWEEN 1 AND 5), -- 1=Surveyor (Best), 5=Rough Sketch
    
    -- Temporal History (Time Travel)
    active_from TIMESTAMP DEFAULT NOW(),
    active_to TIMESTAMP, -- NULL = Currently Active. Set to date when archived.
    
    -- Lineage (Splits/Merges)
    parent_lot_id UUID REFERENCES lots(id),
    
    -- Geometry
    geom GEOMETRY(POLYGON, 4326),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for Spatio-Temporal Queries
CREATE INDEX idx_lots_geom_active ON lots USING GIST (geom) WHERE active_to IS NULL;
CREATE INDEX idx_lots_matricule ON lots (matricule);

-- VIEW: Active Lots (Simplifies querying)
CREATE OR REPLACE VIEW v_active_lots AS
SELECT * FROM lots WHERE active_to IS NULL;


-- 2. ADRESSES (The Access Points)
CREATE TABLE adresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID REFERENCES lots(id), -- Link to the land
    
    numero_civique TEXT NOT NULL,
    rue TEXT NOT NULL,
    ville TEXT DEFAULT 'Val-d''Or',
    code_postal TEXT,
    
    geom GEOMETRY(POINT, 4326), -- Precise entrance point
    
    active_from TIMESTAMP DEFAULT NOW(),
    active_to TIMESTAMP
);

CREATE INDEX idx_adresses_geom ON adresses USING GIST (geom);


-- 3. PROPRIETAIRES (The Owners)
-- Linked to Lots, not Inspections.
CREATE TABLE proprietaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_complet TEXT NOT NULL,
    adresse_postale TEXT, -- Mailing address if different from lot
    telephone TEXT,
    email TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table linking Owners to Lots (Many-to-Many)
CREATE TABLE lot_owners (
    lot_id UUID REFERENCES lots(id),
    proprietaire_id UUID REFERENCES proprietaires(id),
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    PRIMARY KEY (lot_id, proprietaire_id)
);
