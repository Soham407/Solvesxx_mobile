import { StyleSheet, View } from 'react-native';

import { BorderRadius } from '../../constants/spacing';
import { useAppTheme } from '../../hooks/useAppTheme';

interface ProgressBarProps {
  value: number;
}

export function ProgressBar({ value }: ProgressBarProps) {
  const { colors } = useAppTheme();
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <View style={[styles.track, { backgroundColor: colors.secondary }]}>
      <View
        style={[
          styles.fill,
          {
            backgroundColor: colors.success,
            width: `${clamped}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 10,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
});
