import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { InfoCard } from '../shared/InfoCard';
import { BorderRadius, Spacing } from '../../constants/spacing';
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
      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>{icon}</View>
        <Text numberOfLines={1} style={[styles.value, { color: colors.foreground }]}>
          {value}
        </Text>
        <Text numberOfLines={2} style={[styles.label, { color: colors.mutedForeground }]}>
          {label}
        </Text>
        {caption ? null : null}
      </View>
    </InfoCard>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    gap: Spacing.xs,
    minHeight: 112,
    justifyContent: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  label: {
    textAlign: 'center',
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.xs,
    lineHeight: 16,
  },
  value: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize['2xl'],
    lineHeight: 28,
  },
});
