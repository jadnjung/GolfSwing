import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Share from 'react-native-share';
import Video from 'react-native-video';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { swingVideoPath } from '../data/swingRepository';
import type { HistoryStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<HistoryStackParamList, 'Replay'>;

type PlaybackState = 'loading' | 'ready' | 'error';

export function ReplayScreen({ route }: Props) {
  const { swingId } = route.params;
  const [playbackState, setPlaybackState] = useState<PlaybackState>('loading');

  const videoPath = swingVideoPath(swingId);

  // MVP item 22: exports the raw source video, not an "annotated" one —
  // overlay rendering needs pose data that doesn't exist until Phase 2.
  // react-native-share (ADR 0011) handles iOS/Android's different local
  // file-sharing requirements (Android needs a content:// URI via a
  // FileProvider, which core RN's Share API doesn't set up).
  const handleExport = useCallback(async () => {
    try {
      const result = await Share.open({
        url: `file://${videoPath}`,
        type: 'video/mp4',
        filename: `swing-${swingId}`,
        failOnCancel: false,
      });
      // The user dismissing the share sheet isn't a failure.
      if (result.dismissedAction) {
        return;
      }
    } catch (error) {
      Alert.alert(
        "Couldn't export this swing",
        error instanceof Error ? error.message : undefined,
      );
    }
  }, [videoPath, swingId]);

  return (
    <View style={styles.container} testID="replay-screen">
      <Video
        source={{ uri: `file://${videoPath}` }}
        style={styles.video}
        resizeMode="contain"
        controls
        onLoad={() => setPlaybackState('ready')}
        onError={() => setPlaybackState('error')}
        testID="replay-video"
      />
      {playbackState === 'loading' ? (
        <Text style={styles.message}>Loading…</Text>
      ) : null}
      {playbackState === 'error' ? (
        <Text style={styles.message}>Couldn't load this swing's video.</Text>
      ) : null}
      <Pressable
        style={styles.exportButton}
        onPress={handleExport}
        testID="export-button"
      >
        <Text style={styles.exportButtonText}>Export</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  video: {
    width: '100%',
    aspectRatio: 9 / 16,
    backgroundColor: colors.surface,
  },
  message: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  exportButton: {
    alignSelf: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 6,
  },
  exportButtonText: {
    color: colors.background,
    fontWeight: '600',
  },
});
