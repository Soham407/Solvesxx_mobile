import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ActionButton } from '../../components/shared/ActionButton';
import { FormField } from '../../components/shared/FormField';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import { getDevPreviewRole, isDevPreviewOtp, sendOtp, verifyOtp } from '../../lib/auth';
import type { AuthStackParamList } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';

type OtpScreenProps = NativeStackScreenProps<AuthStackParamList, 'OTP'>;

function maskPhoneNumber(phone: string) {
  if (phone.length < 6) {
    return phone;
  }

  const prefix = phone.slice(0, 3);
  const suffix = phone.slice(-2);
  return `${prefix} ***** ${suffix}`;
}

export function OtpScreen({ navigation, route }: OtpScreenProps) {
  const { colors } = useAppTheme();
  const enterDevPreview = useAppStore((state) => state.enterDevPreview);
  const handleSession = useAppStore((state) => state.handleSession);
  const [otpCode, setOtpCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const maskedPhone = useMemo(() => maskPhoneNumber(route.params.phone), [route.params.phone]);

  const handleVerify = async () => {
    setIsVerifying(true);
    setErrorMessage(null);

    try {
      if (isDevPreviewOtp(route.params.phone, otpCode)) {
        await enterDevPreview(getDevPreviewRole(route.params.phone) ?? 'security_guard');
        return;
      }

      const session = await verifyOtp(route.params.phone, otpCode);

      if (session) {
        await handleSession(session, { lockWithBiometrics: false });
      }
    } catch (error) {
      const nextMessage =
        error instanceof Error ? error.message : 'That OTP could not be verified.';
      setErrorMessage(nextMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setErrorMessage(null);

    try {
      await sendOtp(route.params.phone);
    } catch (error) {
      const nextMessage =
        error instanceof Error ? error.message : 'We could not resend the OTP.';
      setErrorMessage(nextMessage);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <ScreenShell
      eyebrow="Authentication"
      title="Verify OTP"
      description={`Enter the 6-digit code sent to ${maskedPhone}.`}
      footer={
        <View style={styles.footer}>
          <ActionButton
            label="Verify and continue"
            testID="qa_otp_verify_button"
            loading={isVerifying}
            disabled={otpCode.trim().length !== 6}
            onPress={handleVerify}
          />
          <ActionButton
            label={isResending ? 'Resending...' : 'Resend OTP'}
            testID="qa_otp_resend_button"
            variant="ghost"
            disabled={isResending}
            onPress={handleResend}
          />
        </View>
      }
    >
      <InfoCard>
        <FormField
          autoFocus
          helperText="The code expires quickly, so use the latest SMS if you requested multiple OTPs."
          inputTestID="qa_otp_code_input"
          keyboardType="number-pad"
          label="6-digit OTP"
          maxLength={6}
          onChangeText={setOtpCode}
          placeholder="123456"
          value={otpCode}
        />
        {errorMessage ? (
          <Text style={[styles.errorText, { color: colors.destructive }]}>{errorMessage}</Text>
        ) : null}
        <Pressable
          onPress={() => navigation.goBack()}
          testID="qa_otp_change_mobile_number"
          style={[styles.backLink, { borderColor: colors.border }]}
        >
          <Text style={[styles.backLinkText, { color: colors.foreground }]}>Change mobile number</Text>
        </Pressable>
      </InfoCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: Spacing.base,
  },
  errorText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  backLink: {
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    paddingVertical: Spacing.base,
  },
  backLinkText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
  },
});
