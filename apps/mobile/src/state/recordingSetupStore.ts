import { create } from 'zustand';

// Recording setup state (PRD section 10.3): the user's choices before
// starting a recording. Session-scoped UI state, not persisted domain data.
export type ClubType = 'driver' | 'iron' | 'wedge' | 'putter';
export type CameraView = 'down-the-line' | 'face-on';
export type CameraPosition = 'front' | 'back';
export type FrameRate = 30 | 60 | 120;

interface RecordingSetupState {
  club: ClubType;
  cameraView: CameraView;
  cameraPosition: CameraPosition;
  frameRate: FrameRate;
  countdownSeconds: 3 | 10;
  audioEnabled: boolean;
  setClub: (club: ClubType) => void;
  setCameraView: (view: CameraView) => void;
  setCameraPosition: (position: CameraPosition) => void;
  setFrameRate: (frameRate: FrameRate) => void;
  setCountdownSeconds: (seconds: 3 | 10) => void;
  setAudioEnabled: (enabled: boolean) => void;
}

export const useRecordingSetupStore = create<RecordingSetupState>(set => ({
  club: 'driver',
  cameraView: 'face-on',
  cameraPosition: 'back',
  frameRate: 60,
  countdownSeconds: 3,
  audioEnabled: false,
  setClub: club => set({ club }),
  setCameraView: cameraView => set({ cameraView }),
  setCameraPosition: cameraPosition => set({ cameraPosition }),
  setFrameRate: frameRate => set({ frameRate }),
  setCountdownSeconds: countdownSeconds => set({ countdownSeconds }),
  setAudioEnabled: audioEnabled => set({ audioEnabled }),
}));
