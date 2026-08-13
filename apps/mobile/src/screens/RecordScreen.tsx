import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import {
  Camera,
  useCameraDevice,
  type CameraPermissionStatus,
  type VideoFile,
} from 'react-native-vision-camera';
import {
  DocumentDirectoryPath,
  mkdir,
  moveFile,
  writeFile,
} from '@dr.pogodin/react-native-fs';
import {
  LANDSCAPE,
  OrientationLocker,
  UNLOCK,
} from 'react-native-orientation-locker';
import { OptionRow } from '../components/OptionRow';
import { colors, spacing } from '../theme/theme';
import {
  useRecordingSetupStore,
  type CameraPosition,
  type CameraView as CameraViewOption,
  type ClubType,
  type FrameRate,
} from '../state/recordingSetupStore';
import { useProfileStore } from '../state/profileStore';

const CLUBS: ClubType[] = ['driver', 'iron', 'wedge', 'putter'];
const CAMERA_VIEWS: CameraViewOption[] = ['down-the-line', 'face-on'];
const FRAME_RATES: FrameRate[] = [120, 60, 30];

type CaptureStage =
  'idle' | 'counting' | 'recording' | 'saving' | 'saved' | 'error';

function createSwingId(): string {
  // RFC4122-v4-shaped id without a crypto.randomUUID dependency — Hermes
  // support for it can't be confirmed without a real device/build. Bitwise
  // ops are the standard idiom for this, not a bug risk.
  /* eslint-disable no-bitwise */
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
  /* eslint-enable no-bitwise */
}

export function RecordScreen() {
  const [cameraPermission, setCameraPermission] =
    useState<CameraPermissionStatus>(() => Camera.getCameraPermissionStatus());
  const [microphonePermission, setMicrophonePermission] =
    useState<CameraPermissionStatus>(() =>
      Camera.getMicrophonePermissionStatus(),
    );
  const [captureStage, setCaptureStage] = useState<CaptureStage>('idle');
  const [countdownRemaining, setCountdownRemaining] = useState(0);
  const [savedSwingId, setSavedSwingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cameraRef = useRef<Camera>(null);

  // Bottom-tab navigators keep inactive screens mounted by default, so an
  // always-mounted <OrientationLocker> here would stay locked to landscape
  // even after navigating to another tab. Gating on focus (not just mount)
  // releases the lock the moment this tab loses focus.
  const isFocused = useIsFocused();

  const {
    club,
    cameraView,
    cameraPosition,
    frameRate,
    countdownSeconds,
    audioEnabled,
    setClub,
    setCameraView,
    setCameraPosition,
    setFrameRate,
    setAudioEnabled,
  } = useRecordingSetupStore();

  const device = useCameraDevice(cameraPosition);

  // Non-null: RootNavigator only mounts once onboarding has produced a
  // profile (App.tsx), so RecordScreen is never reachable without one.
  const handedness = useProfileStore(state => state.profile!.handedness);

  const requestCameraAccess = useCallback(async () => {
    const result = await Camera.requestCameraPermission();
    setCameraPermission(result === 'granted' ? 'granted' : 'denied');
  }, []);

  const requestMicrophoneAccess = useCallback(async () => {
    const result = await Camera.requestMicrophonePermission();
    setMicrophonePermission(result === 'granted' ? 'granted' : 'denied');
  }, []);

  useEffect(() => {
    if (audioEnabled && microphonePermission === 'not-determined') {
      requestMicrophoneAccess();
    }
  }, [audioEnabled, microphonePermission, requestMicrophoneAccess]);

  const hasCameraAccess = cameraPermission === 'granted';

  // Explicit UNLOCK, not just leaving the locker unmounted: this library
  // only auto-releases a lock if some other mounted <OrientationLocker>
  // requests UNLOCK — merely unmounting the last one leaves the Activity's
  // orientation locked (see docs/adr/0013). Bottom-tab navigators keep this
  // screen mounted across tab switches, so this has to stay mounted and
  // toggle its own orientation prop rather than mount/unmount.
  const shouldLockLandscape = isFocused && hasCameraAccess && device != null;

  const saveRecording = useCallback(
    async (video: VideoFile) => {
      setCaptureStage('saving');
      try {
        const swingId = createSwingId();
        const swingDir = `${DocumentDirectoryPath}/swings/${swingId}`;
        await mkdir(swingDir);
        await moveFile(video.path, `${swingDir}/source.mp4`);

        const manifest = {
          id: swingId,
          createdAt: new Date().toISOString(),
          clubType: club,
          cameraView,
          cameraPosition,
          frameRate,
          durationMs: Math.round(video.duration * 1000),
          analysisStatus: 'pending' as const,
          handedness,
        };
        await writeFile(
          `${swingDir}/analysis-manifest.json`,
          JSON.stringify(manifest, null, 2),
        );

        setSavedSwingId(swingId);
        setCaptureStage('saved');
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Failed to save recording.',
        );
        setCaptureStage('error');
      }
    },
    [club, cameraView, cameraPosition, frameRate, handedness],
  );

  const startRecording = useCallback(() => {
    setErrorMessage(null);
    cameraRef.current?.startRecording({
      onRecordingFinished: video => {
        saveRecording(video);
      },
      onRecordingError: error => {
        setErrorMessage(error.message);
        setCaptureStage('error');
      },
    });
    setCaptureStage('recording');
  }, [saveRecording]);

  const beginCountdown = useCallback(() => {
    setSavedSwingId(null);
    setErrorMessage(null);
    setCountdownRemaining(countdownSeconds);
    setCaptureStage('counting');
  }, [countdownSeconds]);

  useEffect(() => {
    if (captureStage !== 'counting') {
      return;
    }
    if (countdownRemaining <= 0) {
      startRecording();
      return;
    }
    const timeout = setTimeout(() => setCountdownRemaining(n => n - 1), 1000);
    return () => clearTimeout(timeout);
  }, [captureStage, countdownRemaining, startRecording]);

  const stopRecording = useCallback(async () => {
    await cameraRef.current?.stopRecording();
  }, []);

  return (
    // Bottom edge excluded — the bottom tab navigator already accounts
    // for the home indicator inset for its own bar.
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* MVP item 4: recording itself is landscape-only, while navigation
          elsewhere in the app stays portrait. Always mounted (not
          conditionally, per the shouldLockLandscape comment above) so it can
          explicitly request UNLOCK rather than relying on unmount. */}
      <OrientationLocker orientation={shouldLockLandscape ? LANDSCAPE : UNLOCK} />
      <ScrollView contentContainerStyle={styles.content} testID="record-screen">
        <Text style={styles.title}>Record</Text>

        {/* Deliberately placed above the preview, not with the other
            selectors below: this is the one setting worth checking before
            recording every time, and the screen locks to landscape once the
            camera is ready (docs/adr/0013) — a landscape viewport is short
            enough that anything below the preview/record button needs
            scrolling to reach, which real-device testing showed made this
            easy to miss. */}
        <OptionRow
          label="Camera"
          options={['back', 'front'] as CameraPosition[]}
          selected={cameraPosition}
          onSelect={setCameraPosition}
        />

        {!hasCameraAccess ? (
          <View style={styles.permissionGate}>
            <Text style={styles.permissionText}>
              Camera access is required to record a swing. Recordings stay on
              this device.
            </Text>
            <Pressable
              style={styles.grantButton}
              onPress={requestCameraAccess}
              testID="grant-camera-access-button"
            >
              <Text style={styles.grantButtonText}>Grant camera access</Text>
            </Pressable>
          </View>
        ) : device == null ? (
          <Text style={styles.permissionText}>
            No {cameraPosition === 'front' ? 'front' : 'rear'} camera available
            on this device.
          </Text>
        ) : (
          <>
            <View style={styles.previewWrapper} testID="camera-preview-wrapper">
              <Camera
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                device={device}
                isActive
                video
                audio={audioEnabled}
              />
              {captureStage === 'counting' ? (
                <View
                  style={styles.countdownOverlay}
                  testID="countdown-overlay"
                >
                  <Text style={styles.countdownText}>{countdownRemaining}</Text>
                </View>
              ) : null}
            </View>

            {captureStage === 'recording' ? (
              <Pressable
                style={styles.stopButton}
                onPress={stopRecording}
                testID="stop-button"
              >
                <Text style={styles.grantButtonText}>Stop</Text>
              </Pressable>
            ) : (
              <Pressable
                style={styles.grantButton}
                onPress={beginCountdown}
                disabled={
                  captureStage === 'counting' || captureStage === 'saving'
                }
                testID="record-button"
              >
                <Text style={styles.grantButtonText}>
                  {captureStage === 'saving' ? 'Saving…' : 'Record'}
                </Text>
              </Pressable>
            )}

            {savedSwingId != null ? (
              <Text style={styles.confirmationText} testID="save-confirmation">
                Saved swing {savedSwingId}
              </Text>
            ) : null}
            {errorMessage != null ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}
          </>
        )}

        <OptionRow
          label="Club"
          options={CLUBS}
          selected={club}
          onSelect={setClub}
        />
        <OptionRow
          label="View"
          options={CAMERA_VIEWS}
          selected={cameraView}
          onSelect={setCameraView}
        />
        <OptionRow
          label="Frame rate"
          options={FRAME_RATES}
          selected={frameRate}
          onSelect={setFrameRate}
        />

        <Text style={styles.note}>
          Simultaneous front-and-rear recording isn't offered — it requires
          checking the device's actual concurrent-camera capability, which needs
          a real device to verify.
        </Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Record audio</Text>
          <Pressable
            onPress={() => setAudioEnabled(!audioEnabled)}
            style={[styles.option, audioEnabled && styles.optionSelected]}
          >
            <Text
              style={[
                styles.optionText,
                audioEnabled && styles.optionTextSelected,
              ]}
            >
              {audioEnabled ? 'On' : 'Off'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '600',
  },
  permissionGate: {
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  permissionText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  grantButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    alignItems: 'center',
  },
  grantButtonText: {
    color: colors.background,
    fontWeight: '600',
  },
  stopButton: {
    backgroundColor: '#D14343',
    paddingVertical: spacing.sm,
    borderRadius: 6,
    alignItems: 'center',
  },
  previewWrapper: {
    height: 240,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 15, 20, 0.6)',
  },
  countdownText: {
    color: colors.text,
    fontSize: 48,
    fontWeight: '700',
  },
  confirmationText: {
    color: colors.primary,
    fontSize: 13,
  },
  errorText: {
    color: '#D14343',
    fontSize: 13,
  },
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
  note: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
  },
});
