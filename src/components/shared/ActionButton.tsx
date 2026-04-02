import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { BorderRadius, ComponentHeight, Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
}

export function ActionButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: ActionButtonProps) {
  const { colors } = useAppTheme();

  const variantStyles = {
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      textColor: colors.primaryForeground,
    },
    secondary: {
      backgroundColor: colors.secondary,
      borderColor: colors.border,
      textColor: colors.secondaryForeground,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: colors.border,
      textColor: colors.foreground,
    },
    danger: {
      backgroundColor: colors.destructive,
      borderColor: colors.destructive,
      textColor: colors.destructiveForeground,
    },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          opacity: disabled || loading ? 0.55 : pressed ? 0.88 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.textColor} size="small" />
      ) : (
        <Text style={[styles.label, { color: variantStyles.textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: ComponentHeight.buttonXl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  label: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.md,
    letterSpacing: 0.2,
  },
});
