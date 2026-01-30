-- ============================================
-- InstaDeco AI - Security Audit Logs Migration
-- Version: 1.0.0
-- Date: 30 janvier 2026
-- ============================================

-- ============================================
-- 1. TABLE AUDIT_LOGS (Logs de sécurité)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  
  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'auth_login_success',
    'auth_login_failed',
    'auth_logout',
    'auth_signup',
    'auth_password_reset',
    'generation_created',
    'generation_failed',
    'payment_success',
    'payment_failed',
    'credits_purchased',
    'credits_deducted',
    'hd_unlock',
    'rate_limit_exceeded',
    'suspicious_activity',
    'admin_action'
  )),
  event_status TEXT DEFAULT 'success' CHECK (event_status IN ('success', 'failure', 'blocked')),
  
  -- Context
  resource_type TEXT,  -- 'generation', 'payment', 'profile', etc.
  resource_id UUID,
  
  -- Additional data (JSON)
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes pour les recherches
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_ip_address ON audit_logs(ip_address);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_event_status ON audit_logs(event_status);

-- Index composite pour les recherches par IP + event
CREATE INDEX idx_audit_logs_ip_event ON audit_logs(ip_address, event_type, created_at DESC);

COMMENT ON TABLE audit_logs IS 'Logs de sécurité et d''audit pour tracking des activités';
COMMENT ON COLUMN audit_logs.ip_address IS 'Adresse IP du client (pour détection de fraude)';
COMMENT ON COLUMN audit_logs.metadata IS 'Données additionnelles en JSON (browser, location, etc.)';

-- ============================================
-- 2. RLS pour audit_logs
-- ============================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent lire leurs propres logs
CREATE POLICY "Users can read own audit logs" ON audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Seuls les admins peuvent voir tous les logs
CREATE POLICY "Admins can read all audit logs" ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insertion uniquement via le service (SECURITY DEFINER)
-- Aucune policy INSERT directe pour les utilisateurs normaux

-- ============================================
-- 3. FUNCTION pour créer un log d'audit
-- ============================================
CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_status TEXT DEFAULT 'success',
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    event_type,
    event_status,
    ip_address,
    user_agent,
    resource_type,
    resource_id,
    metadata,
    error_message
  )
  VALUES (
    p_user_id,
    p_event_type,
    p_event_status,
    p_ip_address::INET,
    p_user_agent,
    p_resource_type,
    p_resource_id,
    p_metadata,
    p_error_message
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_audit_log IS 'Crée un log d''audit de manière sécurisée (SECURITY DEFINER)';

-- ============================================
-- 4. FUNCTION pour vérifier les tentatives de login suspectes
-- ============================================
CREATE OR REPLACE FUNCTION check_login_attempts(
  p_ip_address TEXT,
  p_window_minutes INT DEFAULT 15,
  p_max_attempts INT DEFAULT 5
)
RETURNS json AS $$
DECLARE
  v_attempt_count INT;
  v_is_blocked BOOLEAN;
BEGIN
  -- Compter les tentatives échouées récentes pour cette IP
  SELECT COUNT(*) INTO v_attempt_count
  FROM audit_logs
  WHERE ip_address = p_ip_address::INET
    AND event_type = 'auth_login_failed'
    AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  v_is_blocked := v_attempt_count >= p_max_attempts;
  
  -- Si bloqué, logger l'activité suspecte
  IF v_is_blocked THEN
    INSERT INTO audit_logs (
      ip_address, event_type, event_status, metadata
    )
    VALUES (
      p_ip_address::INET,
      'suspicious_activity',
      'blocked',
      jsonb_build_object('reason', 'Too many failed login attempts', 'attempt_count', v_attempt_count)
    );
  END IF;
  
  RETURN json_build_object(
    'attempt_count', v_attempt_count,
    'is_blocked', v_is_blocked,
    'remaining_attempts', GREATEST(0, p_max_attempts - v_attempt_count)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_login_attempts IS 'Vérifie si une IP a trop de tentatives de login échouées';

-- ============================================
-- 5. VIEW pour le dashboard admin (optionnel)
-- ============================================
CREATE OR REPLACE VIEW security_summary AS
SELECT 
  DATE_TRUNC('hour', created_at) AS hour,
  event_type,
  event_status,
  COUNT(*) AS event_count,
  COUNT(DISTINCT ip_address) AS unique_ips,
  COUNT(DISTINCT user_id) AS unique_users
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), event_type, event_status
ORDER BY hour DESC, event_count DESC;

COMMENT ON VIEW security_summary IS 'Résumé des événements de sécurité des 24 dernières heures';

-- ============================================
-- 6. Nettoyage automatique des vieux logs (optionnel)
-- ============================================
-- Garde les logs pendant 90 jours
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INT AS $$
DECLARE
  v_deleted_count INT;
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_audit_logs IS 'Supprime les logs d''audit de plus de 90 jours';
