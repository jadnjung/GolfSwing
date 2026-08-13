import { useCallback, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { Title } from '../components/Typography';
import {
  deleteAllSwings,
  getTotalSwingsSizeBytes,
} from '../data/swingRepository';
import { useProfileStore } from '../state/profileStore';
import { colors, spacing } from '../theme/theme';
import { formatBytes } from '../utils/formatBytes';

// PRD 9.8: "delete-all-data control" — distinct from per-swing deletion
// (HistoryScreen). Also honors the promise OnboardingScreen's privacy
// notice makes ("delete any swing, or all of your data, at any time from
// Settings"), which had no actual control behind it until this screen.
export function SettingsScreen() {
  const clearProfile = useProfileStore(state => state.clear);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDeleteAllData = useCallback(async () => {
    const sizeBytes = await getTotalSwingsSizeBytes();
    Alert.alert(
      'Delete all data?',
      `This permanently deletes every saved swing (freeing ${formatBytes(sizeBytes)}) and resets your profile — you'll go through setup again. This can't be undone.`,
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <Title>Settings</Title>
      <Button
        label={isDeleting ? 'Deleting…' : 'Delete all data'}
        variant="danger"
        onPress={confirmDeleteAllData}
        disabled={isDeleting}
        testID="delete-all-data-button"
        style={styles.deleteAllButton}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md,
  },
  deleteAllButton: {
    marginTop: spacing.lg,
    alignSelf: 'flex-start',
  },
});
