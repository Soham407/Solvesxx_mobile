import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ActionButton } from '../../components/shared/ActionButton';
import { FormField } from '../../components/shared/FormField';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import { getDevPreviewCredentials, isDemoOtpBackendConfigured, sendOtp } from '../../lib/auth';
import type { AuthStackParamList } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';

type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: LoginScreenProps) {
  const { colors } = useAppTheme();
  const devPreviewCredentials = getDevPreviewCredentials();
  const demoOtpMode = isDemoOtpBackendConfigured();
  const enterDevPreview = useAppStore((state) => state.enterDevPreview);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleSendOtp = async () => {
    setIsSending(true);
    setErrorMessage(null);

    try {
      const normalizedPhone = await sendOtp(phoneNumber);
      navigation.navigate('OTP', { phone: normalizedPhone });
    } catch (error) {
      const nextMessage =
        error instanceof Error ? error.message : 'We could not send the OTP right now.';
      setErrorMessage(nextMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ScreenShell
      eyebrow={demoOtpMode ? 'Demo Login' : 'Phase 1'}
      title="Mobile OTP Sign-In"
      description={
        demoOtpMode
          ? 'Sign in with your whitelisted demo phone number. FacilityPro will verify the staging demo OTP through the backend and route you into the correct mobile workspace.'
          : 'Sign in with your registered mobile number. FacilityPro will use this session to route you into the correct mobile workspace.'
      }
      footer={
        <ActionButton
          label="Send OTP"
          testID="qa_login_send_otp"
          loading={isSending}
          disabled={phoneNumber.trim().length < 10}
          onPress={handleSendOtp}
        />
      }
    >
      <InfoCard>
        <Text style={[styles.caption, { color: colors.mutedForeground }]}>
          India numbers can be entered as `9876543210` and we&apos;ll convert them to `+91`
          automatically.
        </Text>
        {demoOtpMode ? (
          <Text style={[styles.backendHint, { color: colors.info }]}>
            Demo OTP verification is now backend-controlled for staging builds.
          </Text>
        ) : null}
        {devPreviewCredentials
          ? devPreviewCredentials.map((credential) => (
              <Text key={credential.phone} style={[styles.devHint, { color: colors.info }]}>
                {credential.label}: use `{credential.phone.slice(-10)}` and OTP `{credential.otp}`.
              </Text>
            ))
          : null}
        <FormField
          autoComplete="tel"
          autoFocus
          helperText="Use the phone number already linked to your staff or vendor account."
          inputTestID="qa_login_phone_input"
          keyboardType="phone-pad"
          label="Mobile number"
          onChangeText={setPhoneNumber}
          placeholder="+91 98765 43210"
          value={phoneNumber}
        />
        {devPreviewCredentials ? (
          <>
            <ActionButton
              label="Staging email sign-in"
              testID="qa_login_email_sign_in"
              variant="ghost"
              onPress={() => navigation.navigate('EmailLogin')}
            />
            <ActionButton
              label="Preview buyer"
              testID="qa_login_preview_buyer"
              variant="secondary"
              onPress={() => void enterDevPreview('buyer')}
            />
            <ActionButton
              label="Preview AC technician"
              testID="qa_login_preview_ac_technician"
              variant="secondary"
              onPress={() => void enterDevPreview('ac_technician')}
            />
            <ActionButton
              label="Preview pest control"
              testID="qa_login_preview_pest_control_technician"
              variant="secondary"
              onPress={() => void enterDevPreview('pest_control_technician')}
            />
            <ActionButton
              label="Preview delivery"
              testID="qa_login_preview_delivery_boy"
              variant="secondary"
              onPress={() => void enterDevPreview('delivery_boy')}
            />
            <ActionButton
              label="Preview service boy"
              testID="qa_login_preview_service_boy"
              variant="secondary"
              onPress={() => void enterDevPreview('service_boy')}
            />
            <ActionButton
              label="Preview supplier"
              testID="qa_login_preview_supplier"
              variant="secondary"
              onPress={() => void enterDevPreview('supplier')}
            />
            <ActionButton
              label="Preview vendor"
              testID="qa_login_preview_vendor"
              variant="secondary"
              onPress={() => void enterDevPreview('vendor')}
            />
            <ActionButton
              label="Preview supervisor"
              testID="qa_login_preview_security_supervisor"
              variant="secondary"
              onPress={() => void enterDevPreview('security_supervisor')}
            />
            <ActionButton
              label="Preview manager"
              testID="qa_login_preview_society_manager"
              variant="secondary"
              onPress={() => void enterDevPreview('society_manager')}
            />
            <ActionButton
              label="Preview HRMS employee"
              testID="qa_login_preview_employee"
              variant="secondary"
              onPress={() => void enterDevPreview('employee')}
            />
          </>
        ) : null}
        {errorMessage ? <Text style={[styles.errorText, { color: colors.destructive }]}>{errorMessage}</Text> : null}
      </InfoCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  caption: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  devHint: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
  backendHint: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
  errorText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
});
