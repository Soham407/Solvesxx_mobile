import { supabase } from './supabase';
import type { AppRole } from '../types/app';

const DEV_PREVIEW_OTP = '123456';
const DEV_PREVIEW_PROFILES = [
  {
    phone: '+919999999999',
    role: 'security_guard',
    label: 'Guard preview',
  },
  {
    phone: '+918888888888',
    role: 'security_supervisor',
    label: 'Supervisor preview',
  },
  {
    phone: '+917777777777',
    role: 'society_manager',
    label: 'Manager preview',
  },
  {
    phone: '+916666666666',
    role: 'employee',
    label: 'HRMS employee preview',
  },
  {
    phone: '+915555555555',
    role: 'buyer',
    label: 'Buyer preview',
  },
  {
    phone: '+912222222222',
    role: 'ac_technician',
    label: 'AC technician preview',
  },
  {
    phone: '+911111111111',
    role: 'pest_control_technician',
    label: 'Pest control preview',
  },
  {
    phone: '+912121212121',
    role: 'delivery_boy',
    label: 'Delivery preview',
  },
  {
    phone: '+912323232323',
    role: 'service_boy',
    label: 'Service boy preview',
  },
  {
    phone: '+914444444444',
    role: 'supplier',
    label: 'Supplier preview',
  },
  {
    phone: '+914141414141',
    role: 'resident',
    label: 'Resident preview',
  },
  {
    phone: '+913333333333',
    role: 'vendor',
    label: 'Vendor preview',
  },
] as const satisfies Array<{ phone: string; role: AppRole; label: string }>;

type DemoOtpVerifyResponse = {
  ok: boolean;
  phone: string;
  role: AppRole;
  session: {
    access_token: string;
    refresh_token: string;
    [key: string]: unknown;
  };
};

export function normalizePhoneNumber(input: string) {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, '');

  if (trimmed.startsWith('+')) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length > 10) {
    return `+${digits}`;
  }

  return trimmed;
}

function getWebAppUrl() {
  return (process.env.EXPO_PUBLIC_WEB_APP_URL ?? '').trim().replace(/\/+$/, '');
}

export function isDemoOtpBackendConfigured() {
  return Boolean(getWebAppUrl());
}

async function callDemoOtpEndpoint<TResponse>(path: string, body: Record<string, string>) {
  const baseUrl = getWebAppUrl();

  if (!baseUrl) {
    throw new Error('Demo OTP backend URL is not configured.');
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as
    | TResponse
    | { error?: string };

  if (!response.ok) {
    throw new Error(
      typeof (payload as { error?: string }).error === 'string'
        ? (payload as { error: string }).error
        : 'Demo OTP request failed.',
    );
  }

  return payload as TResponse;
}

export function getDevPreviewCredentials() {
  if (!__DEV__ || isDemoOtpBackendConfigured()) {
    return null;
  }

  return DEV_PREVIEW_PROFILES.map((profile) => ({
    ...profile,
    otp: DEV_PREVIEW_OTP,
  }));
}

export function isDevPreviewPhone(input: string) {
  if (!__DEV__ || isDemoOtpBackendConfigured()) {
    return false;
  }

  const phone = normalizePhoneNumber(input);
  return DEV_PREVIEW_PROFILES.some((profile) => profile.phone === phone);
}

export function isDevPreviewOtp(phone: string, token: string) {
  return isDevPreviewPhone(phone) && token.trim() === DEV_PREVIEW_OTP;
}

export function getDevPreviewRole(phone: string): AppRole | null {
  if (!__DEV__ || isDemoOtpBackendConfigured()) {
    return null;
  }

  const normalizedPhone = normalizePhoneNumber(phone);
  return DEV_PREVIEW_PROFILES.find((profile) => profile.phone === normalizedPhone)?.role ?? null;
}

export async function sendOtp(rawPhoneNumber: string) {
  const phone = normalizePhoneNumber(rawPhoneNumber);

  if (isDemoOtpBackendConfigured()) {
    await callDemoOtpEndpoint('/api/mobile/demo-otp/send', { phone });
    return phone;
  }

  if (isDevPreviewPhone(phone)) {
    return phone;
  }

  const { error } = await supabase.auth.signInWithOtp({
    phone,
  });

  if (error) {
    throw error;
  }

  return phone;
}

export async function verifyOtp(phone: string, token: string) {
  const normalizedPhone = normalizePhoneNumber(phone);

  if (isDemoOtpBackendConfigured()) {
    const payload = await callDemoOtpEndpoint<DemoOtpVerifyResponse>('/api/mobile/demo-otp/verify', {
      phone: normalizedPhone,
      otp: token.trim(),
    });

    const { data, error } = await supabase.auth.setSession({
      access_token: payload.session.access_token,
      refresh_token: payload.session.refresh_token,
    });

    if (error) {
      throw error;
    }

    return data.session ?? null;
  }

  const { data, error } = await supabase.auth.verifyOtp({
    phone: normalizedPhone,
    token,
    type: 'sms',
  });

  if (error) {
    throw error;
  }

  return data.session;
}

export async function signInWithEmailPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw error;
  }

  return data.session;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
