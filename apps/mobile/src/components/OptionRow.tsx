import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme/theme';

// Extracted from RecordScreen (Step 4) when OnboardingScreen (Step 10)
// needed the same labeled-choice-row control — same bar as any other
// second real usage in this codebase, not a speculative abstraction.
export function OptionRow<T extends string | number>({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: T[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.optionGroup}>
        {options.map(option => (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            style={[
              styles.option,
              option === selected && styles.optionSelected,
            ]}
          >
            <Text
              style={[
                styles.optionText,
                option === selected && styles.optionTextSelected,
              ]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: typography.body,
  optionGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  option: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: typography.caption,
  optionTextSelected: {
    color: colors.background,
    fontWeight: '600',
  },
});
