-- =============================================
-- DATABASE: city_commerce_gros_industrie
-- =============================================

CREATE TABLE inspection_details_industrie (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hub_ref_id UUID, -- Logical link to Hub (no physical FK constraint possible)
    
    -- Specific Industrial Fields
    -- nom_proprietaire REMOVED (Now in city_geo_ref)
    -- usage_code REMOVED (Now in Hub -> city_codes)
    
    superficie_terrain NUMERIC(10,2),
    superficie_batiment_principal NUMERIC(10,2),
    ces_resultant NUMERIC(5,2),
    presence_matiere_dangereuse BOOLEAN DEFAULT false,
    type_entreposage_exterieur TEXT,
    charge_occupation_totale INTEGER,
    
    raw_form_data JSONB -- Backup
);

-- AUDIT LOG (Managed centrally by Hub)
