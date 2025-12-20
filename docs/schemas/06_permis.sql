-- =============================================
-- DATABASE: city_permis (NEW)
-- =============================================

CREATE TABLE avis_permis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hub_ref_id UUID,
    
    type_permis TEXT, -- 'Construction', 'Renovation', 'Demolition'
    numero_permis TEXT,
    date_emission DATE,
    date_expiration DATE,
    statut TEXT, -- 'Actif', 'Expire', 'Complete'
    
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
