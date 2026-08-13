import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radii, spacing, typography } from '../theme/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  // A plain style override (e.g. margin/alignSelf for positioning), merged
  // in after the variant styles — not a pressed-state function like
  // Pressable's own `style` prop, callers don't need that level of control.
  style?: StyleProp<ViewStyle>;
}

// Shared primary-action button. Replaces three near-duplicate button
// implementations that had grown independently in RecordScreen,
// OnboardingScreen, and SettingsScreen — same visual role, slightly
// different padding/radius each time, no single source of truth.
export function Button({
  label,
  variant = 'primary',
  disabled,
  style,
  ...pressableProps
}: ButtonProps) {
  return (
    <Pressable
      {...pressableProps}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        disabled === true && styles.disabled,
        pressed && disabled !== true && styles.pressed,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === 'secondary' && styles.labelSecondary,
          variant === 'danger' && styles.labelDanger,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.background,
  },
  labelSecondary: {
    color: colors.text,
  },
  labelDanger: {
    color: colors.danger,
  },
});
