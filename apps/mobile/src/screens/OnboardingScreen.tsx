import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Handedness, SkillLevel, Units } from '@golf-swing/domain';
import { OptionRow } from '../components/OptionRow';
import { useProfileStore } from '../state/profileStore';
import { colors, spacing } from '../theme/theme';
import type { ClubType } from '../state/recordingSetupStore';

const HANDEDNESS_OPTIONS: Handedness[] = ['right', 'left'];
const SKILL_LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];
const CLUBS: ClubType[] = ['driver', 'iron', 'wedge', 'putter'];
const UNITS_OPTIONS: Units[] = ['imperial', 'metric'];

type Step = 'privacy' | 'profile';

// PRD section 4.1 (First Launch): privacy notice, then handedness/skill
// level/club/units, before recording is available. App.tsx renders this
// in place of RootNavigator until useProfileStore has a saved profile.
export function OnboardingScreen() {
  const [step, setStep] = useState<Step>('privacy');
  const [handedness, setHandedness] = useState<Handedness>('right');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('beginner');
  const [primaryClub, setPrimaryClub] = useState<ClubType>('driver');
  const [units, setUnits] = useState<Units>('imperial');

  const save = useProfileStore(state => state.save);

  if (step === 'privacy') {
    return (
      <SafeAreaView style={styles.container} testID="onboarding-privacy">
        <Text style={styles.title}>Your swings stay on this device</Text>
        <Text style={styles.body}>
          Recordings, pose data, and analysis are stored only on this phone.
          Nothing is uploaded automatically, and there's no account required.
          You can delete any swing, or all of your data, at any time from
          Settings.
        </Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => setStep('profile')}
          testID="privacy-accept-button"
        >
          <Text style={styles.primaryButtonText}>I understand</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        testID="onboarding-profile"
      >
        <Text style={styles.title}>Set up your profile</Text>
        <Text style={styles.body}>
          This helps tailor feedback to you — you can change it later in
          Settings.
        </Text>

        <OptionRow
          label="Handedness"
          options={HANDEDNESS_OPTIONS}
          selected={handedness}
          onSelect={setHandedness}
        />
        <OptionRow
          label="Skill level"
          options={SKILL_LEVELS}
          selected={skillLevel}
          onSelect={setSkillLevel}
        />
        <OptionRow
          label="Primary club"
          options={CLUBS}
          selected={primaryClub}
          onSelect={setPrimaryClub}
        />
        <OptionRow
          label="Units"
          options={UNITS_OPTIONS}
          selected={units}
          onSelect={setUnits}
        />

        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            save({
              handedness,
              skillLevel,
              primaryClub,
              units,
              privacyAcknowledgedAt: new Date().toISOString(),
            })
          }
          testID="profile-save-button"
        >
          <Text style={styles.primaryButtonText}>Get started</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  content: {
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  body: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryButtonText: {
    color: colors.background,
    fontWeight: '600',
  },
});
