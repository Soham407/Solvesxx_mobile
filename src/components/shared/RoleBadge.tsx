import { StyleSheet, Text, View } from 'react-native';

import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';

interface RoleBadgeProps {
  label: string;
}

export function RoleBadge({ label }: RoleBadgeProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.badge, { backgroundColor: colors.accentSecondary, borderColor: colors.accent }]}>
      <Text style={[styles.label, { color: colors.accentForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
  },
  label: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
