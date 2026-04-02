import { StyleSheet, Text, View } from 'react-native';

import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';

interface StatusChipProps {
  label: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export function StatusChip({ label, tone = 'default' }: StatusChipProps) {
  const { colors } = useAppTheme();

  const palette = {
    default: {
      backgroundColor: colors.secondary,
      borderColor: colors.border,
      textColor: colors.foreground,
    },
    success: {
      backgroundColor: colors.success,
      borderColor: colors.success,
      textColor: colors.successForeground,
    },
    warning: {
      backgroundColor: colors.warning,
      borderColor: colors.warning,
      textColor: colors.warningForeground,
    },
    danger: {
      backgroundColor: colors.destructive,
      borderColor: colors.destructive,
      textColor: colors.destructiveForeground,
    },
    info: {
      backgroundColor: colors.info,
      borderColor: colors.info,
      textColor: colors.infoForeground,
    },
  }[tone];

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
        },
      ]}
    >
      <Text style={[styles.label, { color: palette.textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  label: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.xs,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
