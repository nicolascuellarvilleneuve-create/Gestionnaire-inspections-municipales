-- =============================================
-- DATABASE: city_habitation
-- =============================================

CREATE TABLE inspection_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hub_ref_id UUID,
    
    -- Housing Specifics
    nb_logements INTEGER,
    type_habitation TEXT, -- 'Unifamiliale', 'Multifamiliale'
    presence_detecteur_fumee BOOLEAN,
    
    raw_form_data JSONB
);

-- AUDIT LOG
CREATE TABLE security_audit_log (
    id SERIAL PRIMARY KEY,
    user_name TEXT,
    action_type TEXT,
    target_record TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);
