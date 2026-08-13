import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Check from 'lucide-react-native/icons/check';
import type { Handedness, SkillLevel, Units } from '@golf-swing/domain';
import { Button } from '../components/Button';
import { OptionRow } from '../components/OptionRow';
import { Body, Title } from '../components/Typography';
import { useProfileStore } from '../state/profileStore';
import { colors, spacing } from '../theme/theme';
import type { ClubType } from '../state/recordingSetupStore';

const HANDEDNESS_OPTIONS: Handedness[] = ['right', 'left'];
const SKILL_LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];
const CLUBS: ClubType[] = ['driver', 'iron', 'wedge', 'putter'];
const UNITS_OPTIONS: Units[] = ['imperial', 'metric'];

const PRIVACY_GUARANTEES = [
  'Recordings, pose data, and analysis stay on this phone',
  'No account required',
  'Delete any swing — or everything — anytime from Settings',
];

type Step = 'privacy' | 'profile';

function GuaranteeRow({ text }: { text: string }) {
  return (
    <View style={styles.guaranteeRow}>
      <Check color={colors.primary} size={18} />
      <Body style={styles.guaranteeText}>{text}</Body>
    </View>
  );
}

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
        <Title style={styles.title}>Your swings stay on this device</Title>
        {/* Broken into distinct, scannable guarantees rather than one dense
            paragraph — this is the app's #1 trust proposition (PRD 9.1),
            worth more visual weight than a wall of body text. */}
        <View style={styles.guaranteeList}>
          {PRIVACY_GUARANTEES.map(text => (
            <GuaranteeRow key={text} text={text} />
          ))}
        </View>
        <Button
          label="Got it — let's go"
          onPress={() => setStep('profile')}
          testID="privacy-accept-button"
          style={styles.primaryButton}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        testID="onboarding-profile"
      >
        <Title style={styles.title}>Set up your profile</Title>
        <Body style={styles.body}>
          This helps tailor feedback to you — you can change it later in
          Settings.
        </Body>

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

        <Button
          label="Get started"
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
          style={styles.primaryButton}
        />
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
    marginBottom: spacing.lg,
  },
  body: {
    marginBottom: spacing.lg,
  },
  guaranteeList: {
    gap: spacing.md,
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  guaranteeText: {
    flex: 1,
  },
  primaryButton: {
    marginTop: spacing.lg,
  },
});
