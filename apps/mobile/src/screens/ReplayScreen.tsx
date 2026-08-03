import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
});
