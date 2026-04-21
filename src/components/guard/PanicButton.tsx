import { Pressable, Text, View, StyleSheet } from 'react-native';
import { ShieldAlert } from 'lucide-react-native';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';

interface PanicButtonProps {
  disabled?: boolean;
  onPress: () => void;
  testID?: string;
  colors: any;
}

export function PanicButton({ disabled = false, onPress, testID, colors }: PanicButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Emergency Panic Button"
      accessible={true}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: colors.destructive,
          borderColor: colors.destructive,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      <View style={styles.iconWrapper}>
        <ShieldAlert color={colors.destructiveForeground} size={36} strokeWidth={1.5} />
      </View>

      <View style={styles.contentWrapper}>
        <Text
          style={[
            styles.title,
            {
              color: colors.destructiveForeground,
            },
          ]}
          numberOfLines={1}
        >
          EMERGENCY PANIC ALERT
        </Text>
        <Text
          style={[
            styles.description,
            {
              color: colors.destructiveForeground,
            },
          ]}
          numberOfLines={2}
        >
          Tap to report emergency • GPS location • SMS to manager
        </Text>
      </View>

      <View style={styles.badge}>
        <Text
          style={[
            styles.badgeText,
            {
              color: colors.destructive,
            },
          ]}
        >
          TAP NOW
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    gap: Spacing.md,
    marginVertical: Spacing.md,
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: Spacing.sm,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  title: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.sansBold,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.sans,
    opacity: 0.9,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.sansBold,
    letterSpacing: 1,
  },
});
