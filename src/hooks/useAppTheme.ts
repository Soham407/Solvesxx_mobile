import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { DarkColors, LightColors } from '../constants/colors';
import type { AppColorScheme } from '../types/app';

export function useAppTheme(preferredColorScheme?: AppColorScheme) {
  const systemColorScheme = useColorScheme();
  const resolvedColorScheme =
    preferredColorScheme ?? (systemColorScheme === 'dark' ? 'dark' : 'light');
  const isDark = resolvedColorScheme === 'dark';
  const colors = isDark ? DarkColors : LightColors;

  const navigationTheme = useMemo(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      dark: isDark,
      colors: {
        ...(isDark ? DarkTheme : DefaultTheme).colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.foreground,
        border: colors.border,
        notification: colors.accent,
      },
    }),
    [colors, isDark],
  );

  return {
    colorScheme: resolvedColorScheme,
    isDark,
    colors,
    navigationTheme,
  };
}
