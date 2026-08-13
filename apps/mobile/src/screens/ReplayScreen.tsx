import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Share from 'react-native-share';
import Video, { type OnProgressData, type VideoRef } from 'react-native-video';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getSwing, swingVideoPath } from '../data/swingRepository';
import type { HistoryStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<HistoryStackParamList, 'Replay'>;

type PlaybackState = 'loading' | 'ready' | 'error';

// MVP item 17: slow-motion playback rates.
const PLAYBACK_RATES = [1, 0.5, 0.25] as const;
type PlaybackRate = (typeof PLAYBACK_RATES)[number];

// MVP item 18: frame-by-frame scrubbing. Falls back to a common recording
// rate if a swing's manifest is unreadable — stepping is then only
// approximate rather than blocked entirely.
const FALLBACK_FRAME_RATE = 30;

export function ReplayScreen({ route }: Props) {
  const { swingId } = route.params;
  const [playbackState, setPlaybackState] = useState<PlaybackState>('loading');
  const [rate, setRate] = useState<PlaybackRate>(1);
  const [paused, setPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [frameRate, setFrameRate] = useState(FALLBACK_FRAME_RATE);
  const videoRef = useRef<VideoRef>(null);

  const videoPath = swingVideoPath(swingId);

  useEffect(() => {
    let cancelled = false;
    getSwing(swingId)
      .then(swing => {
        if (!cancelled) {
          setFrameRate(swing.frameRate);
        }
      })
      .catch(() => {
        // Frame-stepping falls back to FALLBACK_FRAME_RATE; not fatal.
      });
    return () => {
      cancelled = true;
    };
  }, [swingId]);

  const handleProgress = useCallback((data: OnProgressData) => {
    setCurrentTime(data.currentTime);
  }, []);

  // Stepping pauses playback first — stepping while playing would have the
  // seek immediately overtaken by ongoing playback, making the step invisible.
  const stepFrame = useCallback(
    (direction: 1 | -1) => {
      setPaused(true);
      const frameDuration = 1 / frameRate;
      const target = Math.max(0, currentTime + direction * frameDuration);
      videoRef.current?.seek(target);
      setCurrentTime(target);
    },
    [currentTime, frameRate],
  );

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
        ref={videoRef}
        source={{ uri: `file://${videoPath}` }}
        style={styles.video}
        resizeMode="contain"
        controls
        rate={rate}
        paused={paused}
        onProgress={handleProgress}
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
      <View style={styles.rateRow} testID="playback-rate-row">
        {PLAYBACK_RATES.map(candidateRate => (
          <Pressable
            key={candidateRate}
            style={[
              styles.rateButton,
              rate === candidateRate && styles.rateButtonActive,
            ]}
            onPress={() => setRate(candidateRate)}
            testID={`playback-rate-${candidateRate}x-button`}
            accessibilityRole="radio"
            accessibilityLabel={`Playback speed ${candidateRate}x`}
            accessibilityState={{ checked: rate === candidateRate }}
          >
            <Text style={styles.rateButtonText}>{candidateRate}x</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.frameStepRow} testID="frame-step-row">
        <Pressable
          style={styles.frameStepButton}
          onPress={() => stepFrame(-1)}
          testID="frame-step-back-button"
          accessibilityRole="button"
          accessibilityLabel="Step back one frame"
        >
          <Text style={styles.frameStepButtonText}>◀ Frame</Text>
        </Pressable>
        <Pressable
          style={styles.frameStepButton}
          onPress={() => stepFrame(1)}
          testID="frame-step-forward-button"
          accessibilityRole="button"
          accessibilityLabel="Step forward one frame"
        >
          <Text style={styles.frameStepButtonText}>Frame ▶</Text>
        </Pressable>
      </View>
      <Pressable
        style={styles.exportButton}
        onPress={handleExport}
        testID="export-button"
        accessibilityRole="button"
        accessibilityLabel="Export this swing's video"
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
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  rateButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    backgroundColor: colors.surface,
  },
  rateButtonActive: {
    backgroundColor: colors.primary,
  },
  rateButtonText: {
    color: colors.text,
    fontWeight: '600',
  },
  frameStepRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  frameStepButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    backgroundColor: colors.surface,
  },
  frameStepButtonText: {
    color: colors.text,
    fontWeight: '600',
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
