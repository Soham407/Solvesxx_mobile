import { StyleSheet, Text, View } from 'react-native';

import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';

interface PreviewModeBannerProps {
  label?: string;
  description: string;
}

export function PreviewModeBanner({
  label = 'Preview Mode',
  description,
}: PreviewModeBannerProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.warning + '10',
          borderColor: colors.warning + '55',
        },
      ]}
    >
      <Text style={[styles.label, { color: colors.warning }]}>{label}</Text>
      <Text style={[styles.description, { color: colors.foreground }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    gap: Spacing.xs,
    padding: Spacing.base,
  },
  label: {
    fontFamily: FontFamily.sansExtraBold,
    fontSize: FontSize.xs,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  description: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});
