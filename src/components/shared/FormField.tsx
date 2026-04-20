import type { TextInputProps } from 'react-native';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { BorderRadius, ComponentHeight, Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';

interface FormFieldProps extends TextInputProps {
  label: string;
  helperText?: string;
  inputTestID?: string;
  inputAccessibilityLabel?: string;
}

export function FormField({
  label,
  helperText,
  style,
  inputTestID,
  inputAccessibilityLabel,
  ...inputProps
}: FormFieldProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        accessibilityLabel={inputAccessibilityLabel ?? label}
        placeholderTextColor={colors.mutedForeground}
        selectionColor={colors.primary}
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.foreground,
          },
          style,
        ]}
        testID={inputTestID}
        {...inputProps}
      />
      {helperText ? <Text style={[styles.helperText, { color: colors.mutedForeground }]}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  label: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.sm,
  },
  input: {
    minHeight: ComponentHeight.inputLg,
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.base,
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
  },
  helperText: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
});
