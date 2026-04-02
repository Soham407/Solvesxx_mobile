import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { InfoCard } from '../shared/InfoCard';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  caption?: string;
}

export function MetricCard({ icon, label, value, caption }: MetricCardProps) {
  const { colors } = useAppTheme();

  return (
    <InfoCard>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.foreground }]}>{value}</Text>
      {caption ? <Text style={[styles.caption, { color: colors.mutedForeground }]}>{caption}</Text> : null}
    </InfoCard>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    marginBottom: Spacing.xs,
  },
  label: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.xs,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  value: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize['2xl'],
    lineHeight: 28,
  },
  caption: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
});
