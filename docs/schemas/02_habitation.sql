-- =============================================
-- DATABASE: city_habitation
-- =============================================

CREATE TABLE inspection_details_habitation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hub_ref_id UUID,
    
    -- Housing Specifics
    nb_logements INTEGER,
    type_habitation TEXT, -- 'Unifamiliale', 'Multifamiliale'
    presence_detecteur_fumee BOOLEAN,
    
    raw_form_data JSONB
);

-- AUDIT LOG (Managed centrally by Hub)
