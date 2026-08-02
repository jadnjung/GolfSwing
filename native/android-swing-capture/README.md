# android-swing-capture

Base camera capture is handled by `react-native-vision-camera` (see `docs/adr/0004-camera-capture-library.md`), not hand-written CameraX code. This directory's purpose is now **custom frame-processor plugins** written in Kotlin that plug into vision-camera's frame processor API — e.g. the pose-inference bridge (Phase 2), which needs native-side access to raw camera frames without crossing the JS bridge (PRD section 7.3). Not yet implemented; blocked on Phase 2 pose-inference work and on Android Studio being available to build/verify.
