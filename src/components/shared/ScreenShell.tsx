import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';

interface ScreenShellProps {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function ScreenShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: ScreenShellProps) {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {eyebrow ? <Text style={[styles.eyebrow, { color: colors.accent }]}>{eyebrow}</Text> : null}
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>{description}</Text>
        </View>
        <View style={styles.body}>{children}</View>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['2xl'] + Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.xl,
  },
  header: {
    gap: Spacing.sm,
  },
  eyebrow: {
    fontFamily: FontFamily.sansExtraBold,
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize['3xl'],
    lineHeight: 36,
  },
  description: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    lineHeight: 24,
  },
  body: {
    gap: Spacing.lg,
  },
  footer: {
    gap: Spacing.base,
    marginTop: Spacing.sm,
  },
});
