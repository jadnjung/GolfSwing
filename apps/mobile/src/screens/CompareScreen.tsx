import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Video from 'react-native-video';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getSwing, swingVideoPath } from '../data/swingRepository';
import type { HistoryStackParamList } from '../navigation/types';
import { colors, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<HistoryStackParamList, 'Compare'>;

type PlaybackState = 'loading' | 'ready' | 'error';

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString();
}

// MVP item 20: side-by-side comparison. Deliberately not synchronized
// playback, skeleton overlays, or angle-difference display (PRD 4.4's
// fuller vision) — those need swing-phase timestamps and pose/metric data
// that don't exist until Phase 2. Two independently controlled players,
// stacked vertically (a phone's portrait aspect makes a horizontal split
// too narrow to be useful), is the honest MVP-scoped version.
function ComparisonVideo({
  swingId,
  videoTestID,
}: {
  swingId: string;
  videoTestID: string;
}) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>('loading');
  // A real UX gap this fixes: with no label at all, a user comparing two
  // stacked videos had to guess which was which. Falls back to "Swing" (no
  // date) if the manifest can't be read — the video itself still plays via
  // swingVideoPath, which doesn't depend on the manifest at all.
  const [label, setLabel] = useState('Swing');
  const videoPath = swingVideoPath(swingId);

  useEffect(() => {
    let cancelled = false;
    getSwing(swingId)
      .then(swing => {
        if (!cancelled) {
          setLabel(`${swing.clubType} · ${formatDate(swing.createdAt)}`);
        }
      })
      .catch(() => {
        // Label falls back to "Swing" above; not fatal.
      });
    return () => {
      cancelled = true;
    };
  }, [swingId]);

  return (
    <View style={styles.videoSlot}>
      <Text style={styles.label} testID={`${videoTestID}-label`}>
        {label}
      </Text>
      <Video
        source={{ uri: `file://${videoPath}` }}
        style={styles.video}
        resizeMode="contain"
        controls
        onLoad={() => setPlaybackState('ready')}
        onError={() => setPlaybackState('error')}
        testID={videoTestID}
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

export function CompareScreen({ route }: Props) {
  const { swingIdA, swingIdB } = route.params;

  return (
    <View style={styles.container} testID="compare-screen">
      <ComparisonVideo swingId={swingIdA} videoTestID="compare-video-a" />
      <ComparisonVideo swingId={swingIdB} videoTestID="compare-video-b" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  videoSlot: {
    flex: 1,
    gap: 4,
  },
  label: {
    ...typography.caption,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  video: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  message: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
});
