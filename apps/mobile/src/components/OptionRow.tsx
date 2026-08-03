import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme/theme';

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
  rowLabel: {
    color: colors.text,
    fontSize: 14,
  },
  optionGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  option: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  optionTextSelected: {
    color: colors.background,
    fontWeight: '600',
  },
});
