import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { ActiveTabBanner } from '../components/ActiveTabBanner';
import { ScreenContainer } from '../components/ScreenContainer';
import { deleteAllSwings } from '../data/swingRepository';
import { useProfileStore } from '../state/profileStore';
import { spacing } from '../theme/theme';

// PRD 9.8: "delete-all-data control" — distinct from per-swing deletion
// (HistoryScreen). Also honors the promise OnboardingScreen's privacy
// notice makes ("delete any swing, or all of your data, at any time from
// Settings"), which had no actual control behind it until this screen.
export function SettingsScreen() {
  const clearProfile = useProfileStore(state => state.clear);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDeleteAllData = useCallback(() => {
    Alert.alert(
      'Delete all data?',
      "This permanently deletes every saved swing and resets your profile — you'll go through setup again. This can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteAllSwings();
              await clearProfile();
            } catch (error) {
              Alert.alert(
                "Couldn't delete all data",
                error instanceof Error ? error.message : undefined,
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  }, [clearProfile]);

  return (
    <ScreenContainer title="Settings">
      <ActiveTabBanner />
      <Pressable
        style={styles.deleteAllButton}
        onPress={confirmDeleteAllData}
        disabled={isDeleting}
        testID="delete-all-data-button"
      >
        <Text style={styles.deleteAllButtonText}>
          {isDeleting ? 'Deleting…' : 'Delete all data'}
        </Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  deleteAllButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D14343',
  },
  deleteAllButtonText: {
    color: '#D14343',
    fontWeight: '600',
  },
});
