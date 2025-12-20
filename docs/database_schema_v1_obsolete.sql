-- =============================================
-- ZONED ARCHITECTURE (Hub & Spokes via SCHEMAS)
-- =============================================

-- 1. DEFINE ZONES (Schemas)
-- This allows us to "Roadblock" (Lock) an entire sector easily.
CREATE SCHEMA IF NOT EXISTS zone_hub;        -- The "Main Final Zone" (Map View)
CREATE SCHEMA IF NOT EXISTS zone_industrie;  -- The "Secure Room" for Industry
CREATE SCHEMA IF NOT EXISTS zone_habitation; -- The "Secure Room" for Housing

-- Enable PostGIS in the main zone if not already global
CREATE EXTENSION IF NOT EXISTS postgis SCHEMA public; 

-- 2. THE MAIN HUB (Global Map Data)
-- The Map ONLY searches here. It doesn't need to enter the secure zones.
CREATE TABLE zone_hub.inspections_hub (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adresse_civique TEXT NOT NULL,
    geom GEOMETRY(POINT, 4326),
    type_batiment TEXT NOT NULL, -- 'INDUSTRIE', 'HABITATION'
    status_conformite TEXT CHECK (status_conformite IN ('Conforme', 'Non-conforme')),
    date_inspection DATE NOT NULL,
    
    -- Link prevention: If we delete the detail, remove the dot from the map.
    source_zone TEXT NOT NULL, -- e.g. 'zone_industrie'
    source_id UUID NOT NULL    -- The ID inside the secure zone
);

-- Index for Map Speed
CREATE INDEX idx_hub_geom ON zone_hub.inspections_hub USING GIST (geom);

-- 3. SECURE ZONE: INDUSTRIE
CREATE TABLE zone_industrie.inspection_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to the Main Zone
    hub_ref_id UUID REFERENCES zone_hub.inspections_hub(id) ON DELETE CASCADE,
    
    -- Specific Industrial Fields
    nom_proprietaire TEXT,
    usage_code TEXT,
    superficie_terrain NUMERIC(10,2),
    superficie_batiment_principal NUMERIC(10,2),
    ces_resultant NUMERIC(5,2),
    presence_matiere_dangereuse BOOLEAN DEFAULT false,
    type_entreposage_exterieur TEXT,
    charge_occupation_totale INTEGER,
    
    -- The "Flexible Bucket" for future form changes (Safety Net)
    raw_form_data JSONB 
);

-- 4. SECURE ZONE: HABITATION (Placeholder)
CREATE TABLE zone_habitation.inspection_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hub_ref_id UUID REFERENCES zone_hub.inspections_hub(id) ON DELETE CASCADE,
    nb_logements INTEGER, -- Specific to habitation
    raw_form_data JSONB
);
