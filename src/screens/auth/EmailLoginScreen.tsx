import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ActionButton } from '../../components/shared/ActionButton';
import { FormField } from '../../components/shared/FormField';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import { signInWithEmailPassword } from '../../lib/auth';
import type { AuthStackParamList } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';

type EmailLoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'EmailLogin'>;

const STAGING_HINTS = [
  'guard@test.com',
  'rohit@test.com',
  'resident@test.com',
];

export function EmailLoginScreen({ navigation }: EmailLoginScreenProps) {
  const { colors } = useAppTheme();
  const handleSession = useAppStore((state) => state.handleSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Test@1234');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleEmailSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);

    try {
      const session = await signInWithEmailPassword(email, password);

      if (session) {
        await handleSession(session, { lockWithBiometrics: false });
      }
    } catch (error) {
      const nextMessage =
        error instanceof Error ? error.message : 'We could not sign in with email right now.';
      setErrorMessage(nextMessage);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <ScreenShell
      eyebrow="Staging Only"
      title="Email Sign-In"
      description="Use this only for internal staging validation before SMS OTP is configured. Remove or disable this path before release."
      footer={
        <View style={styles.footer}>
          <ActionButton
            label="Sign in"
            testID="qa_email_login_submit"
            loading={isSigningIn}
            disabled={!email.trim() || !password.trim()}
            onPress={handleEmailSignIn}
          />
          <ActionButton
            label="Back to OTP login"
            testID="qa_email_login_back"
            variant="ghost"
            onPress={() => navigation.goBack()}
          />
        </View>
      }
    >
      <InfoCard>
        <Text style={[styles.warningPill, { color: colors.warning, borderColor: colors.warning + '55', backgroundColor: colors.warning + '10' }]}>
          TEST / PREVIEW ONLY
        </Text>
        <Text style={[styles.caption, { color: colors.mutedForeground }]}>
          Recommended staging accounts: {STAGING_HINTS.join(', ')}.
        </Text>
        <Text style={[styles.caption, { color: colors.info }]}>
          Repo seed default password: `Test@1234`.
        </Text>
        <FormField
          autoCapitalize="none"
          autoComplete="email"
          autoFocus
          helperText="Use only internal staging accounts. This path must not remain available in production builds."
          inputTestID="qa_email_login_email"
          keyboardType="email-address"
          label="Email"
          onChangeText={setEmail}
          placeholder="guard@test.com"
          value={email}
        />
        <FormField
          autoCapitalize="none"
          autoComplete="password"
          helperText="Temporary staging password flow until SMS OTP is ready."
          inputTestID="qa_email_login_password"
          label="Password"
          onChangeText={setPassword}
          placeholder="Test@1234"
          secureTextEntry
          value={password}
        />
        {errorMessage ? (
          <Text style={[styles.errorText, { color: colors.destructive }]}>{errorMessage}</Text>
        ) : null}
      </InfoCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: Spacing.base,
  },
  caption: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  warningPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    fontFamily: FontFamily.sansExtraBold,
    fontSize: FontSize.xs,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
    overflow: 'hidden',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    textTransform: 'uppercase',
  },
  errorText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
});
