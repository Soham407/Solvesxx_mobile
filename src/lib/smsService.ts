import { supabase } from './supabase';
import type { GuardLocationSnapshot } from '../types/guard';

/**
 * Send SMS panic alert to manager and residents
 * Called when guard triggers panic button
 */
export async function sendPanicAlertSms(input: {
  guardName: string;
  guardPhone?: string;
  location: GuardLocationSnapshot | null;
  alertType: string;
  managerPhoneNumber?: string;
}) {
  if (!input.location) {
    console.warn('[SMS] No location available for panic alert');
    return { success: false, error: 'No location available' };
  }

  try {
    // Call backend RPC to send SMS
    const { data, error } = await supabase.rpc('send_panic_alert_sms', {
      p_guard_name: input.guardName,
      p_guard_phone: input.guardPhone || null,
      p_latitude: input.location.latitude,
      p_longitude: input.location.longitude,
      p_alert_type: input.alertType,
      p_manager_phone: input.managerPhoneNumber || null,
    });

    if (error) {
      console.error('[SMS] RPC error:', error);
      return { success: false, error: error.message };
    }

    console.log('[SMS] Panic alert SMS sent successfully', data);
    return { success: true, data };
  } catch (err) {
    console.error('[SMS] Exception sending panic alert:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Send SMS notification to specific phone number
 * Used for custom alerts or testing
 */
export async function sendCustomSms(input: {
  phoneNumber: string;
  message: string;
}) {
  if (!input.phoneNumber || !input.message) {
    return { success: false, error: 'Phone number and message required' };
  }

  try {
    const { data, error } = await supabase.rpc('send_custom_sms', {
      p_phone_number: input.phoneNumber,
      p_message: input.message,
    });

    if (error) {
      console.error('[SMS] Custom SMS error:', error);
      return { success: false, error: error.message };
    }

    console.log('[SMS] Custom SMS sent successfully');
    return { success: true, data };
  } catch (err) {
    console.error('[SMS] Exception sending custom SMS:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Send push notification to manager (Firebase Cloud Messaging)
 * Complements SMS for immediate alert delivery
 */
export async function sendPushNotificationToManager(input: {
  guardName: string;
  alertType: string;
  location?: GuardLocationSnapshot;
}) {
  try {
    // Call backend RPC to send push notification
    const { data, error } = await supabase.rpc('send_push_notification_to_manager', {
      p_guard_name: input.guardName,
      p_alert_type: input.alertType,
      p_latitude: input.location?.latitude || null,
      p_longitude: input.location?.longitude || null,
    });

    if (error) {
      console.error('[Push] RPC error:', error);
      return { success: false, error: error.message };
    }

    console.log('[Push] Push notification sent successfully');
    return { success: true, data };
  } catch (err) {
    console.error('[Push] Exception sending notification:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
