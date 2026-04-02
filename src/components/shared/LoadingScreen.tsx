import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Preparing your workspace...' }: LoadingScreenProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.loaderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <Text style={[styles.message, { color: colors.foreground }]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  loaderCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.base,
  },
  message: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.base,
    textAlign: 'center',
  },
});
