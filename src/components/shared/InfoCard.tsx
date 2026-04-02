import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Shadows } from '../../constants/shadows';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { useAppTheme } from '../../hooks/useAppTheme';

interface InfoCardProps {
  children: ReactNode;
}

export function InfoCard({ children }: InfoCardProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        Shadows.md,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    gap: Spacing.base,
  },
});
