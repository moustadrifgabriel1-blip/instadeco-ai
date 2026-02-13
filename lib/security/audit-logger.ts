/**
 * Service de Logging d'Audit
 * 
 * Enregistre les événements de sécurité dans Supabase
 */

import { createClient } from '@supabase/supabase-js';

// Types d'événements
export type AuditEventType = 
  | 'auth_login_success'
  | 'auth_login_failed'
  | 'auth_logout'
  | 'auth_signup'
  | 'auth_password_reset'
  | 'generation_created'
  | 'generation_failed'
  | 'payment_success'
  | 'payment_failed'
  | 'credits_purchased'
  | 'credits_deducted'
  | 'rate_limit_exceeded'
  | 'suspicious_activity'
  | 'admin_action';

export type AuditEventStatus = 'success' | 'failure' | 'blocked';

export interface AuditLogEntry {
  userId?: string;
  eventType: AuditEventType;
  eventStatus?: AuditEventStatus;
  ipAddress?: string;
  userAgent?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
}

// Client Supabase admin pour les logs (bypass RLS)
function getAuditClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('[AuditLogger] Supabase non configuré - logs désactivés');
    return null;
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });
}

/**
 * Enregistre un événement d'audit dans la base de données
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<string | null> {
  const client = getAuditClient();
  
  if (!client) {
    // Fallback: log console en dev
    console.log('[AUDIT]', JSON.stringify({
      ...entry,
      timestamp: new Date().toISOString(),
    }));
    return null;
  }
  
  try {
    const { data, error } = await client.rpc('create_audit_log', {
      p_user_id: entry.userId || null,
      p_event_type: entry.eventType,
      p_event_status: entry.eventStatus || 'success',
      p_ip_address: entry.ipAddress || null,
      p_user_agent: entry.userAgent || null,
      p_resource_type: entry.resourceType || null,
      p_resource_id: entry.resourceId || null,
      p_metadata: entry.metadata || {},
      p_error_message: entry.errorMessage || null,
    });
    
    if (error) {
      console.error('[AuditLogger] Erreur création log:', error.message);
      return null;
    }
    
    return data as string;
  } catch (error) {
    console.error('[AuditLogger] Exception:', error);
    return null;
  }
}

/**
 * Vérifie si une IP est bloquée (trop de tentatives échouées)
 */
export async function checkLoginAttempts(
  ipAddress: string,
  windowMinutes: number = 15,
  maxAttempts: number = 5
): Promise<{ isBlocked: boolean; remainingAttempts: number; attemptCount: number }> {
  const client = getAuditClient();
  
  if (!client) {
    return { isBlocked: false, remainingAttempts: maxAttempts, attemptCount: 0 };
  }
  
  try {
    const { data, error } = await client.rpc('check_login_attempts', {
      p_ip_address: ipAddress,
      p_window_minutes: windowMinutes,
      p_max_attempts: maxAttempts,
    });
    
    if (error) {
      console.error('[AuditLogger] Erreur vérification login:', error.message);
      return { isBlocked: false, remainingAttempts: maxAttempts, attemptCount: 0 };
    }
    
    return {
      isBlocked: data?.is_blocked || false,
      remainingAttempts: data?.remaining_attempts || maxAttempts,
      attemptCount: data?.attempt_count || 0,
    };
  } catch (error) {
    console.error('[AuditLogger] Exception check login:', error);
    return { isBlocked: false, remainingAttempts: maxAttempts, attemptCount: 0 };
  }
}

/**
 * Helper: Log une connexion réussie
 */
export async function logLoginSuccess(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    eventType: 'auth_login_success',
    eventStatus: 'success',
    ipAddress,
    userAgent,
  });
}

/**
 * Helper: Log une connexion échouée
 */
export async function logLoginFailed(
  email: string,
  ipAddress?: string,
  userAgent?: string,
  reason?: string
): Promise<void> {
  await logAuditEvent({
    eventType: 'auth_login_failed',
    eventStatus: 'failure',
    ipAddress,
    userAgent,
    metadata: { email, reason },
    errorMessage: reason,
  });
}

/**
 * Helper: Log une création de génération
 */
export async function logGenerationCreated(
  userId: string,
  generationId: string,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    eventType: 'generation_created',
    eventStatus: 'success',
    ipAddress,
    resourceType: 'generation',
    resourceId: generationId,
  });
}

/**
 * Helper: Log un rate limit dépassé
 */
export async function logRateLimitExceeded(
  ipAddress: string,
  endpoint: string,
  userId?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    eventType: 'rate_limit_exceeded',
    eventStatus: 'blocked',
    ipAddress,
    metadata: { endpoint },
  });
}

/**
 * Helper: Log un paiement réussi
 */
export async function logPaymentSuccess(
  userId: string,
  amount: number,
  credits: number,
  stripeSessionId: string,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    eventType: 'payment_success',
    eventStatus: 'success',
    ipAddress,
    resourceType: 'payment',
    metadata: { amount, credits, stripeSessionId },
  });
}
