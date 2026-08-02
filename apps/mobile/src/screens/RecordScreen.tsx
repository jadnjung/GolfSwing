import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Camera,
  useCameraDevice,
  type CameraPermissionStatus,
} from 'react-native-vision-camera';
import { colors, spacing } from '../theme/theme';
import {
  useRecordingSetupStore,
  type CameraPosition,
  type CameraView as CameraViewOption,
  type ClubType,
  type FrameRate,
} from '../state/recordingSetupStore';

const CLUBS: ClubType[] = ['driver', 'iron', 'wedge', 'putter'];
const CAMERA_VIEWS: CameraViewOption[] = ['down-the-line', 'face-on'];
const FRAME_RATES: FrameRate[] = [120, 60, 30];

function OptionRow<T extends string | number>({
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

export function RecordScreen() {
  const [cameraPermission, setCameraPermission] =
    useState<CameraPermissionStatus>(() => Camera.getCameraPermissionStatus());
  const [microphonePermission, setMicrophonePermission] =
    useState<CameraPermissionStatus>(() =>
      Camera.getMicrophonePermissionStatus(),
    );

  const {
    club,
    cameraView,
    cameraPosition,
    frameRate,
    audioEnabled,
    setClub,
    setCameraView,
    setCameraPosition,
    setFrameRate,
    setAudioEnabled,
  } = useRecordingSetupStore();

  const device = useCameraDevice(cameraPosition);

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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="record-screen"
    >
      <Text style={styles.title}>Record</Text>

      {!hasCameraAccess ? (
        <View style={styles.permissionGate}>
          <Text style={styles.permissionText}>
            Camera access is required to record a swing. Recordings stay on this
            device.
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
          No {cameraPosition === 'front' ? 'front' : 'rear'} camera available on
          this device.
        </Text>
      ) : (
        <View style={styles.previewWrapper} testID="camera-preview-wrapper">
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive
            video
            audio={audioEnabled}
          />
        </View>
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
        label="Camera"
        options={['back', 'front'] as CameraPosition[]}
        selected={cameraPosition}
        onSelect={setCameraPosition}
      />
      <OptionRow
        label="Frame rate"
        options={FRAME_RATES}
        selected={frameRate}
        onSelect={setFrameRate}
      />

      <Text style={styles.note}>
        Simultaneous front-and-rear recording isn't offered — it requires
        checking the device's actual concurrent-camera capability, which needs a
        real device to verify.
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
  previewWrapper: {
    height: 240,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surface,
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
