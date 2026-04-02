export const FontFamily = {
  sans:            'PlusJakartaSans_400Regular',
  sansMedium:      'PlusJakartaSans_500Medium',
  sansSemiBold:    'PlusJakartaSans_600SemiBold',
  sansBold:        'PlusJakartaSans_700Bold',
  sansExtraBold:   'PlusJakartaSans_800ExtraBold',
  heading:         'CormorantGaramond_500Medium',
  headingMedium:   'CormorantGaramond_500Medium',
  headingSemiBold: 'CormorantGaramond_600SemiBold',
  headingBold:     'CormorantGaramond_700Bold',
  mono:            'JetBrainsMono_400Regular',
  monoMedium:      'JetBrainsMono_500Medium',
};

export const FontSize = {
  xs:    10,
  sm:    12,
  base:  14,
  md:    16,
  lg:    18,
  xl:    20,
  '2xl': 24,
  '3xl': 30,
};

export const FontWeight = {
  light:     '300' as const,
  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,
};

export const LineHeight = {
  none:    1,
  tight:   1.25,
  snug:    1.375,
  normal:  1.5,
  relaxed: 1.625,
};
