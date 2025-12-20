-- =============================================
-- DATABASE: city_commerce_gros_industrie
-- =============================================

CREATE TABLE inspection_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hub_ref_id UUID, -- Logical link to Hub (no physical FK constraint possible)
    
    -- Specific Industrial Fields
    nom_proprietaire TEXT,
    usage_code TEXT,
    superficie_terrain NUMERIC(10,2),
    superficie_batiment_principal NUMERIC(10,2),
    ces_resultant NUMERIC(5,2),
    presence_matiere_dangereuse BOOLEAN DEFAULT false,
    type_entreposage_exterieur TEXT,
    charge_occupation_totale INTEGER,
    
    raw_form_data JSONB -- Backup
);

-- AUDIT LOG
CREATE TABLE security_audit_log (
    id SERIAL PRIMARY KEY,
    user_name TEXT,
    action_type TEXT,
    target_record TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);
