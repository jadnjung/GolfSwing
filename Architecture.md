# Technical Architecture

This document is the technical-architecture and module-boundaries reference described in `CLAUDE.md`'s "Project Documentation" section. It was extracted from the original combined PRD (`docs/PRD.md`, now `Project.md`) and covers the architecture as originally specified.

For the current, actively maintained architecture record, see:

- `docs/architecture/` — architecture and feasibility notes (toolchain, swing-angle definitions, ball-tracking and swing-event-detection feasibility, professional-swing benchmarks).
- `docs/adr/0001`–`0015` — individual architecture decision records, superseding or refining anything below where they conflict.

Section numbers below are preserved from the original PRD for traceability.

---

# 7. Technical Architecture

## 7.1 Architecture Overview

The application should use a layered architecture:

### Presentation layer

React Native screens and reusable components.

### Application layer

Use cases such as:

- Record swing.
- Analyze swing.
- Save swing.
- Compare swings.
- Generate feedback.
- Build training plan.
- Export swing.

### Domain layer

Pure TypeScript business entities and rules:

- Swing.
- SwingPhase.
- PoseFrame.
- Landmark.
- JointAngle.
- SwingMetric.
- FeedbackItem.
- TrainingPlan.
- ReferenceSwing.

### Infrastructure layer

- Local database.
- Filesystem.
- Native camera bridge.
- Native ML inference bridge.
- Video encoder.
- Secure storage.
- Device capability service.
- Analytics and diagnostics.

### Native platform layer

#### iOS

- Swift.
- AVFoundation.
- Core ML or supported on-device model runtime.
- Metal where necessary.
- Vision framework where applicable.
- VideoToolbox or AVAssetWriter.
- Keychain.
- File Protection APIs.

#### Android

- Kotlin.
- CameraX, with Camera2 interop only where necessary.
- TensorFlow Lite or supported on-device model runtime.
- GPU or NNAPI delegation where validated.
- MediaCodec.
- Android Keystore.
- Encrypted local storage.

React Native itself is designed to create native applications for iOS and Android while sharing React-based UI code. Full local environment setup requires the native build toolchains, including Xcode for iOS and Android Studio/JDK tooling for Android.

## 7.2 Recommended Repository Strategy

Use a monorepo.

Example structure:

```text
golf-swing-app/
  apps/
    mobile/
      android/
      ios/
      src/
        app/
        components/
        features/
        navigation/
        screens/
        state/
        theme/
  packages/
    domain/
    analysis-engine/
    feedback-rules/
    local-database/
    design-system/
    shared-types/
    test-fixtures/
  native/
    ios-swing-capture/
    android-swing-capture/
    ios-pose-inference/
    android-pose-inference/
  models/
    pose/
    club/
    phase-classifier/
    metadata/
  scripts/
  docs/
    architecture/
    adr/
    privacy/
    release/
    qa/
  .github/
    workflows/
```

## 7.3 React Native Strategy

Recommended:

- React Native.
- TypeScript with strict mode.
- React Navigation.
- Zustand or Redux Toolkit for application state.
- TanStack Query only if future remote resources are added.
- React Hook Form with schema validation.
- Native TurboModules or supported bridging architecture for frame and inference services.
- Reanimated for UI overlays and timeline interactions.
- Skia or native rendering for high-performance pose overlays after profiling.

Do not transfer full-resolution image frames through the JavaScript bridge.

The native layer should:

1. Acquire the frame.
2. Run or schedule inference.
3. Return compact landmark and metric data.
4. Render high-frequency overlays natively or through an optimized graphics layer.
5. Send low-frequency state updates to JavaScript.

## 7.4 Expo Decision

Do not use a fully managed Expo-only implementation for the core production application.

A custom development client or bare React Native project is more appropriate because the app requires:

- Native camera customization.
- Concurrent camera sessions.
- Frame processors.
- Custom machine-learning runtimes.
- Native video encoding.
- Platform-specific thermal and capability handling.

Expo tooling may still be used selectively when it does not restrict native implementation.

## 7.5 Local Database

Recommended database: SQLite with a typed repository layer.

Possible implementations:

- React Native SQLite binding.
- WatermelonDB if high-volume reactive queries justify it.
- Realm only after evaluating package size, licensing, encryption behavior, and long-term maintenance.

Store structured metadata in SQLite.

Store large binary assets as files:

- Original videos.
- Processed videos.
- Thumbnails.
- Pose-data files.
- Exported clips.
- Model assets.

Do not store full videos as database blobs.

## 7.6 Local File Layout

Example:

```text
ApplicationSupport/
  swings/
    <swing-id>/
      source.mp4
      preview.jpg
      pose.raw.bin
      pose.smoothed.bin
      metrics.json
      feedback.json
      analysis-manifest.json
  models/
    pose/
    club/
    phase/
  exports/
  logs/
```

Temporary files should use a cache directory and be removable without damaging saved swing records.

## 7.7 Data Model

### Swing

```text
Swing
- id: UUID
- createdAt: timestamp
- updatedAt: timestamp
- clubType: enum
- handedness: enum
- cameraView: enum
- cameraMode: enum
- sourceVideoPath: string
- annotatedVideoPath: nullable string
- thumbnailPath: string
- durationMs: integer
- frameRate: number
- width: integer
- height: integer
- orientation: enum
- analysisStatus: enum
- qualityScore: number
- poseModelVersion: string
- analysisEngineVersion: string
- userNotes: string
- isFavorite: boolean
```

### SwingPhase

```text
SwingPhase
- id: UUID
- swingId: UUID
- phaseType: enum
- startTimeMs: integer
- representativeTimeMs: integer
- endTimeMs: integer
- confidence: number
```

### Metric

```text
Metric
- id: UUID
- swingId: UUID
- phaseType: nullable enum
- metricType: enum
- value: number
- unit: enum
- confidence: number
- sourceView: enum
- modelVersion: string
```

### FeedbackItem

```text
FeedbackItem
- id: UUID
- swingId: UUID
- category: enum
- priority: integer
- title: string
- observation: string
- recommendation: string
- confidence: number
- supportingMetricIds: list
- drillId: nullable UUID
- ruleVersion: string
```

## 7.8 State Management

Separate state into:

### UI state

- Current screen.
- Active modal.
- Playback speed.
- Overlay settings.
- Selected swing.

### Session state

- Current recording setup.
- Camera capability result.
- Current analysis progress.
- Temporary clip path.

### Persistent domain state

Read from local repositories rather than maintaining a duplicate global copy.

### Sensitive state

- Purchase entitlement.
- Local privacy acknowledgment.
- Optional biometric lock setting.

Store secrets in Keychain or Android Keystore-backed storage.

## 7.9 No-Backend Architecture

The MVP shall not require:

- User account.
- Cloud database.
- User-profile API.
- Video-upload endpoint.
- Remote pose-processing server.
- Remote feedback API.

Benefits:

- Strong privacy story.
- Offline operation.
- Reduced cloud cost.
- Reduced breach exposure.
- Reduced latency.
- Easier early-stage operations.

Tradeoffs:

- No automatic cross-device synchronization.
- User can lose data if the device is lost.
- Model updates must ship with an app update or controlled model package.
- Support engineers cannot inspect a user’s swing unless the user explicitly exports it.
- Subscription validation may still interact with Apple or Google services.
- Remote feature flags and diagnostics become more limited.

## 7.10 Optional Future Cloud Boundary

Future cloud features must be isolated behind interfaces and disabled by default.

Possible services:

- Entitlement validation.
- Optional encrypted backup.
- Downloadable reference-swing catalog.
- Model manifest.
- Anonymous configuration.
- Support package upload initiated by the user.

No cloud service should receive personal swing video without an explicit user action and a separate consent flow.

---

# 8. Machine-Learning Architecture

## 8.1 Processing Pipeline

```text
Camera frame
→ frame timestamp normalization
→ orientation correction
→ person detection or pose ROI
→ pose inference
→ landmark confidence filtering
→ temporal smoothing
→ handedness and view normalization
→ joint-angle calculation
→ phase detection
→ metric extraction
→ feedback rules
→ training-plan update
→ local persistence
→ overlay rendering
```

## 8.2 Live Versus Post-Processing

### Live processing

Purpose:

- Verify body visibility.
- Display optional skeleton.
- Detect when a swing begins.
- Provide framing guidance.

Use lower resolution and potentially reduced inference frequency.

### Post-processing

Purpose:

- Highest-quality landmark extraction.
- Phase detection.
- Measurement calculation.
- Club and ball detection.
- Feedback generation.
- Annotated export.

Use the saved video and process every frame or selected frames based on the recording rate.

## 8.3 Model Versioning

Every model shall have:

- Name.
- Semantic version.
- File checksum.
- Input format.
- Output schema.
- Minimum app version.
- Supported platforms.
- Supported device classes.
- Training-data description.
- Evaluation report.
- License.
- Release date.
- Rollback compatibility.

Every analyzed swing shall record the model versions used.

Reanalysis should create a new analysis version rather than silently replacing old results.

## 8.4 Model Evaluation

Evaluation datasets must include variation in:

- Skin tone.
- Clothing.
- Body shape.
- Height.
- Age range.
- Left- and right-handed swings.
- Indoor and outdoor lighting.
- Camera height.
- Camera distance.
- Down-the-line and face-on views.
- Driver, iron, and wedge swings.
- Slow and fast swings.
- Background complexity.
- Partial occlusion.
- Phone generations.
- Android manufacturers.

Metrics should include:

- Landmark error.
- Phase-detection accuracy.
- Impact-frame error.
- Angle mean absolute error.
- Inference latency.
- Dropped-frame percentage.
- False feedback rate.
- No-result rate.
- Performance by subgroup and environment.

## 8.5 Feedback Validation

Each feedback rule must have:

- Rule ID.
- Version.
- Supported camera view.
- Supported handedness.
- Required landmarks.
- Minimum confidence.
- Threshold definition.
- Explanation.
- Suggested drill.
- Golf-domain reviewer approval.
- Unit tests.
- False-positive test cases.

A qualified golf instructor or biomechanics advisor should review the feedback rules before public release.

---

# 11. Development Environment

## 11.1 Required Development Machines

A macOS machine is required to build and sign iOS applications.

Recommended team setup:

- Current supported macOS release.
- Current stable Xcode supported by the selected React Native release.
- Android Studio.
- Supported JDK.
- Node.js LTS.
- Corepack.
- pnpm.
- Watchman.
- CocoaPods or the dependency mechanism required by the selected React Native release.
- Ruby version manager where CocoaPods tooling requires it.
- Git.
- Git LFS for model binaries only when justified.
- Fastlane or equivalent release automation.

The exact versions must be pinned in the repository rather than described as “latest.”

## 11.2 Version Pinning

Use:

- `.nvmrc` or `.tool-versions`.
- `packageManager` in `package.json`.
- Lockfile committed.
- Gradle wrapper.
- Ruby version file.
- Bundler lockfile.
- CocoaPods lockfile.
- Xcode version documented.
- Android compile and target SDK versions documented.
- Model checksums.

## 11.3 Recommended Languages

- TypeScript for shared application and domain logic.
- Swift for iOS camera and inference modules.
- Kotlin for Android camera and inference modules.
- Python for offline model evaluation, conversion, and dataset utilities.
- Shell scripts only for small automation tasks.

## 11.4 Environment Configuration

Environments:

- Local development.
- Continuous integration.
- Internal development build.
- QA.
- Beta.
- Production.

Because the app has no main backend, environments mostly control:

- App identifiers.
- Logging level.
- Crash-reporting project.
- Purchase products.
- Feature flags.
- Model manifest.
- Reference-content bundle.
- Debug tools.

Never store production signing credentials in the repository.

---

# 12. DevOps and CI/CD Plan

## 12.1 Source Control

Recommended platform: GitHub or GitLab.

Branch strategy:

- `main`: production-ready.
- Short-lived feature branches.
- Release tags.
- Hotfix branches only when necessary.

Prefer trunk-based development with protected `main`.

Required pull-request checks:

- Type checking.
- Linting.
- Unit tests.
- Native module tests.
- Dependency review.
- Secret scanning.
- Build verification.
- Changed-model checksum verification.
- Architecture-decision update where required.

## 12.2 Commit and Release Standards

Use:

- Conventional commits or another enforced commit convention.
- Semantic versioning for packages and analysis engines.
- Calendar or semantic app versioning.
- Generated changelog.
- Signed release tags where operationally practical.

## 12.3 CI Pipeline

### Pull-request pipeline

1. Checkout.
2. Restore dependency cache.
3. Verify lockfile.
4. Install JavaScript dependencies.
5. Lint.
6. Type-check.
7. Run unit tests.
8. Run domain-rule tests.
9. Build Android debug.
10. Build iOS simulator configuration.
11. Run native tests.
12. Scan secrets.
13. Scan dependencies.
14. Validate model manifests.
15. Upload test reports.

### Main-branch pipeline

Includes all pull-request checks plus:

- Build signed internal artifacts.
- Run integration tests.
- Run selected physical-device tests.
- Generate software bill of materials.
- Archive symbols.
- Upload internal beta build.
- Publish release notes to the internal channel.

### Release pipeline

1. Confirm release version.
2. Confirm clean protected branch.
3. Confirm tests.
4. Confirm privacy declarations.
5. Confirm model evaluation.
6. Build production Android App Bundle.
7. Build iOS archive.
8. Sign artifacts.
9. Upload to TestFlight and Play internal track.
10. Run smoke test.
11. Promote through staged rollout.
12. Monitor crash and performance indicators.
13. Halt or roll back if thresholds are exceeded.

## 12.4 Signing and Secrets

Store in CI secret management:

- Apple signing credentials.
- App Store Connect API key.
- Google Play service credentials.
- Crash-reporting upload credentials.
- Purchase-service secrets if added.
- Encryption material required for build-time services.

Use least privilege.

Rotate credentials:

- After personnel changes.
- After suspected exposure.
- On a scheduled basis.
- Before expiration.

## 12.5 Build Artifacts

Retain:

- iOS archive.
- Android App Bundle.
- Debug symbols.
- Source maps.
- ProGuard or R8 mapping.
- Model files.
- Model checksums.
- Software bill of materials.
- Test reports.
- Release manifest.
- Privacy-manifest output.
- Dependency list.

## 12.6 Dependency Management

- Automated dependency pull requests.
- Weekly nonurgent dependency review.
- Immediate response for critical vulnerabilities.
- No automatic merging of camera, ML, native runtime, or billing updates.
- Test native dependency upgrades on physical devices.
- Review SDK privacy behavior before adding any package.
- Maintain an approved-SDK register.

## 12.7 Feature Flags

Feature flags may be compiled locally or loaded from a privacy-preserving remote configuration service later.

Initial flags:

- Live pose overlay.
- Post-processing model version.
- Club tracking.
- Ball tracking.
- Dual camera.
- Professional comparison.
- Personalized training plan.
- Export.
- Experimental metrics.

The app must have safe defaults when no remote configuration is available.

## 12.8 Rollback Strategy

### Application rollback

- Stop staged rollout.
- Restore previous store version where store controls permit.
- Submit expedited bug-fix version if necessary.

### Model rollback

- Bundle a known-good model.
- Keep analysis interfaces backward compatible.
- Disable a faulty model through a feature flag where remote configuration exists.
- Preserve the model version used for existing analysis.

### Data migration rollback

- Migrations must be forward-tested.
- Back up the local database before destructive migrations.
- Prefer additive schema changes.
- Never delete user videos automatically during migration.
- Provide recovery when migration fails.

---

# 13. Testing Strategy

## 13.1 Unit Testing

Test:

- Angle formulas.
- Coordinate transformations.
- Handedness mirroring.
- Phase timing.
- Feedback thresholds.
- Confidence gating.
- Metric normalization.
- Database repositories.
- Storage calculations.
- Training-plan logic.

## 13.2 Integration Testing

Test:

- Camera to file.
- File to analysis.
- Analysis to database.
- Database to playback.
- Playback to comparison.
- Export.
- Permission denial.
- Low storage.
- App interruption.
- Model failure.
- Database migration.

## 13.3 UI Testing

Use:

- React Native Testing Library for component behavior.
- Detox or equivalent for end-to-end workflows.
- XCTest for iOS-native modules.
- Android instrumentation tests for Kotlin modules.

## 13.4 Physical-Device Matrix

At minimum:

### iOS

- Oldest supported iPhone.
- Midrange supported iPhone.
- Current flagship.
- Device supporting multi-camera.
- Device not supporting requested multi-camera combination.

### Android

- Google Pixel.
- Samsung flagship.
- Samsung midrange.
- One lower-memory device.
- One device with limited concurrent-camera support.
- Multiple Android OS versions.

Camera and ML validation cannot rely only on emulators or simulators.

## 13.5 Visual and Motion Dataset Tests

Maintain a consented internal test corpus containing:

- Face-on swings.
- Down-the-line swings.
- Left-handed swings.
- Right-handed swings.
- Different clubs.
- Bright and dark conditions.
- Busy backgrounds.
- Loose and tight clothing.
- Partial occlusions.
- Intentionally incorrect framing.
- Known coaching faults.
- Instructor-validated examples.

Do not use user recordings for model training unless the user provides separate, explicit consent.

## 13.6 Performance Tests

Measure:

- Preview frame rate.
- Recorded frame drops.
- Inference time.
- Video-encoding time.
- CPU.
- GPU.
- Memory.
- Thermal state.
- Battery drain.
- Storage growth.
- Analysis duration.
- Export duration.

## 13.7 Release Acceptance Criteria

A build cannot enter public release unless:

- No critical security defect is open.
- No known data-loss defect is open.
- Camera permission flow passes.
- Delete-all-data passes.
- Recording interruption recovery passes.
- Analysis confidence safeguards pass.
- Store privacy forms are reviewed.
- Crash-free beta threshold is met.
- Minimum-device performance is acceptable.
- Golf-domain reviewer approves current feedback rules.

---
