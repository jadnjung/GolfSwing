# Golf Swing Analysis Mobile Application

## Product Requirements, Technical Architecture, and DevOps Implementation Plan

**Document status:** Initial implementation specification
**Primary framework:** React Native with TypeScript
**Platforms:** iOS and Android
**Primary users:** Beginner and amateur golfers
**Data-storage model:** On-device only
**Core purpose:** Record, analyze, compare, store, and replay golf swings while providing understandable coaching feedback

This document is the product-purpose, requirements, scope, and constraints reference described in `CLAUDE.md`'s "Project Documentation" section. It was originally a single combined PRD/architecture/DevOps document (`docs/PRD.md`); that document has been split into four root-level files by concern:

- **`Project.md`** (this file) — product purpose, requirements, scope, and constraints.
- **`Architecture.md`** — technical architecture and module boundaries. For the currently-implemented architecture and ongoing decisions, also see `docs/architecture/` and `docs/adr/`.
- **`Decisions.md`** — accepted technical and architectural decisions. The actively maintained decision log is `docs/adr/0001`–`0015`; this file also carries the original PRD-level decisions for historical context.
- **`Roadmap.md`** — planned development phases and priorities. For what has actually shipped so far, see `Progress.md` and `Checklist.md`.

Section numbers below are preserved from the original PRD for traceability; sections that moved to the other three files are not repeated here.

---

# 1. Executive Summary

The product is a mobile golf-swing analysis application that uses a phone camera and on-device computer vision to:

- Record a golfer’s swing.
- Detect the golfer’s pose throughout the swing.
- Measure joint and body-segment angles.
- Identify major swing phases.
- Display a skeleton and angle overlays on recorded video.
- Estimate or display club and ball movement where technically reliable.
- Compare a golfer’s current swing with previous swings.
- Compare a golfer’s swing with approved professional reference swings.
- Provide pose corrections and coaching feedback after each swing.
- Build personalized training recommendations.
- Save all recordings, measurements, feedback, and user preferences locally on the phone.
- Replay recorded swings in normal speed, slow motion, frame-by-frame, and overlay comparison modes.
- Support front-camera recording, rear-camera recording, and simultaneous front-and-rear recording on compatible devices.

React Native will provide the shared user-interface and application-logic layer. Camera capture, high-frequency frame processing, machine-learning inference, video encoding, and multi-camera operation will require native Swift and Kotlin modules.

The initial release should prioritize reliable single-camera recording and pose analysis. Simultaneous front-and-rear recording should be treated as an advanced, device-dependent feature rather than a universal capability.

---

# 2. Product Strategy and Market Fit

## 2.1 Problem

Beginner and amateur golfers often cannot identify the mechanical problems in their own swings.

Common problems include:

- Limited access to professional coaching.
- Difficulty understanding verbal coaching instructions.
- Inability to see differences between what the golfer feels and what the golfer actually does.
- Lack of objective measurements for hip rotation, shoulder rotation, knee flexion, wrist position, posture, and balance.
- No convenient way to compare current swings with older swings.
- No consistent method for proving whether a coaching adjustment improved the swing.
- Existing video tools that provide playback but little meaningful movement analysis.
- Existing advanced launch-monitor systems that are too expensive for casual golfers.

The application solves this by converting ordinary phone video into structured swing measurements and understandable coaching feedback.

## 2.2 Purpose

The application should help golfers answer four questions:

1. What did my body do during this swing?
2. Which parts of the movement may have reduced consistency or efficiency?
3. How does this swing differ from my earlier swings or a reference swing?
4. What should I practice next?

The application must not present itself as a replacement for a certified golf instructor, medical professional, or professional launch monitor.

## 2.3 Why This Should Be a Mobile Application

This product should not be implemented only as a responsive website.

A native-capable mobile application is justified because it requires:

- Direct camera access.
- High-frame-rate recording.
- Native camera configuration.
- Low-latency frame access.
- GPU, Neural Engine, or device-accelerator access.
- On-device pose inference.
- Local video encoding.
- Frame-accurate playback.
- Offline processing.
- Local encrypted storage.
- Device-specific front-and-rear concurrent camera access.
- Reliable background interruption handling.
- Native permission management.
- App Store and Google Play distribution.

React Native is appropriate for shared screens and application workflows, but the camera and machine-learning pipeline must use native platform APIs.

## 2.4 Target Audience

### Primary audience

Beginner and amateur golfers who:

- Own an iPhone or Android phone.
- Practice at driving ranges, indoor simulators, backyards, or golf courses.
- Want affordable swing feedback.
- May not understand advanced biomechanics terminology.
- Want to track improvement over time.
- Receive occasional coaching and want evidence of whether they applied the feedback correctly.

### Secondary audience

- Golf instructors reviewing student swings on the student’s device.
- Parents helping junior golfers.
- Recreational golf groups.
- Amateur players working through structured practice programs.

### Initial demographic assumptions

- Age: approximately 16 and older.
- Experience: beginner through intermediate amateur.
- Device preference: modern iOS and Android phones with capable cameras.
- Technical comfort: low to moderate.
- Primary orientation: portrait navigation and landscape swing recording.
- Usage location: driving range or practice facility, often with weak internet service.

## 2.5 User Pain Points

The application should specifically address:

- “I do not know what is wrong with my swing.”
- “My coach told me to rotate more, but I cannot tell whether I did.”
- “I cannot remember how my good swing felt.”
- “I want to compare today’s swing with last month’s.”
- “Golf-analysis equipment is too expensive.”
- “Normal slow-motion video does not explain what I am seeing.”
- “Technical golf terminology is confusing.”
- “I want a small number of useful corrections, not dozens of measurements.”

## 2.6 Product Positioning

Recommended positioning:

> A private, on-device golf swing coach that turns phone video into measurable movement feedback.

Key differentiators:

- On-device processing.
- No required account.
- No mandatory cloud upload.
- Swing-history comparisons.
- Coaching-feedback verification.
- Beginner-friendly explanations.
- Detailed view available for advanced users.
- Front, rear, and supported dual-camera recording.
- Personalized practice recommendations.

## 2.7 Monetization Model

Recommended model: freemium with optional subscription.

### Free tier

- Single-camera recording.
- Local swing history with a storage limit.
- Basic skeleton overlay.
- Basic swing-phase detection.
- A limited set of pose measurements.
- Basic post-swing corrections.
- Manual deletion and export.
- Limited comparison sessions.

### Premium subscription

- Unlimited local swing history, subject to device capacity.
- Detailed joint-angle analysis.
- Side-by-side and ghost-overlay comparisons.
- Professional reference comparisons.
- Personalized practice plans.
- Trend charts.
- Advanced swing filters and tagging.
- Voice coaching summaries.
- Advanced club-path and ball-path features when supported.
- Dual-camera recording on compatible devices.

### Optional one-time purchases

- Instructor-designed training packages.
- Professional reference swing collections.
- Specialized modules such as driver, iron, wedge, and putting analysis.

### Advertising recommendation

Do not include third-party advertising in the first release.

Advertising conflicts with the product’s privacy positioning and may require external SDKs that collect device or usage information. It could also distract users during recording and practice.

### Store fees

Store commissions and billing programs change over time and vary by program, region, transaction type, and developer eligibility. The team should not hard-code a “30% fee” assumption into financial planning. Google, for example, currently documents several fee structures and eligibility programs rather than one universal percentage. Reconfirm both stores’ terms immediately before pricing and launch.

---

# 3. Product Scope

## 3.1 MVP Scope

The minimum viable product must include:

1. Local user profile.
2. Front- or rear-camera selection.
3. Rear-camera default.
4. Landscape recording mode.
5. 30 FPS and 60 FPS recording where supported.
6. Video countdown timer.
7. Manual recording start and stop.
8. Automatic swing-event detection where reliable.
9. On-device human-pose detection.
10. Pose skeleton overlay.
11. Joint-angle calculations.
12. Basic golf swing phase detection.
13. Post-swing feedback.
14. Local swing storage.
15. Swing-history screen.
16. Video replay.
17. Slow-motion playback.
18. Frame-by-frame scrubbing.
19. Swing tagging.
20. Side-by-side comparison with a previous swing.
21. Local deletion.
22. Local export of an annotated video.
23. Privacy and permission screens.
24. Crash reporting that does not upload swing videos or pose data.

## 3.2 Post-MVP Scope

The following should follow after the core analysis is validated:

- Simultaneous front-and-rear camera capture.
- Professional swing comparison library.
- Personalized training plans.
- Club detection and club-shaft angle measurement.
- Automatic ball detection.
- Ball-flight or launch-path estimation.
- Voice feedback.
- Coach notes.
- Multiple golfers on one device.
- Apple Watch or Wear OS remote recording controls.
- External tripod or Bluetooth shutter support.
- Optional encrypted backup selected by the user.

## 3.3 Out of Scope for Initial Release

- Accurate launch-monitor replacement.
- Exact carry distance calculation from ordinary monocular video.
- Exact ball spin measurement.
- Exact club-head speed without calibrated high-speed capture.
- Medical diagnosis.
- Injury diagnosis.
- Guaranteed improvement claims.
- Automatic cloud synchronization.
- Social feeds.
- Live remote coaching.
- Public swing uploads.
- Real-money competitions or wagering.

---

# 4. Core User Journeys

## 4.1 First Launch

1. User opens the application.
2. Application explains that swing videos and analysis remain on the device.
3. User accepts the privacy notice.
4. Application requests camera permission only when the user starts camera setup.
5. Application optionally requests microphone permission if audio recording is enabled.
6. User selects:

   - Right-handed or left-handed.
   - Approximate skill level.
   - Primary club category.
   - Preferred units.

7. Application presents a short recording-position tutorial.
8. User performs a test recording.
9. Application verifies that the full body is visible.

## 4.2 Record a Swing

1. User selects a club.
2. User selects recording view:

   - Down-the-line.
   - Face-on.
   - Front camera.
   - Rear camera.
   - Dual camera if supported.

3. Application displays a silhouette placement guide.
4. Application verifies:

   - Full body visibility.
   - Adequate brightness.
   - Camera stability.
   - Sufficient distance from subject.

5. User starts a three- or ten-second countdown.
6. Application records the swing.
7. Application detects the active swing segment.
8. Application trims unnecessary video before and after the swing.
9. Application processes the swing locally.
10. Application displays results.

## 4.3 Review Feedback

The results screen should display:

- Overall analysis status.
- Recording quality warnings.
- Swing phase timeline.
- Skeleton overlay.
- Key angles.
- Two or three high-priority corrections.
- Positive findings.
- Confidence level for each correction.
- Practice drill suggestions.
- Comparison with the user’s baseline or most recent swing.

The app should avoid overwhelming beginners. Detailed measurements should be available under an expandable “Advanced Analysis” section.

## 4.4 Compare Swings

The user should be able to:

- Select two swings.
- Synchronize them by address, top of backswing, impact, or finish.
- Play both simultaneously.
- Adjust playback speed.
- Show or hide skeleton overlays.
- Display angle differences.
- Use split-screen mode.
- Use a transparent ghost overlay when camera angles are sufficiently similar.
- Compare performance metrics.
- Save the comparison as a local analysis session.

## 4.5 Verify Coaching Feedback

The user should be able to create a coaching goal such as:

- Increase hip rotation at impact.
- Reduce head movement.
- Maintain knee flexion.
- Improve spine angle.
- Shorten backswing.
- Improve weight shift.

The user records a baseline swing and later records another swing. The app compares the selected metric and reports:

- Improved.
- Unchanged within tolerance.
- Moved in the wrong direction.
- Insufficient recording confidence.

The app must show the actual measurements and tolerances used.

---

# 5. Functional Requirements

## 5.1 Camera Recording

### CAM-001

The application shall allow the user to select the front or rear camera before recording.

### CAM-002

The rear camera shall be the default because it generally provides higher recording quality.

### CAM-003

The application shall support simultaneous front-and-rear recording only when the device reports compatible concurrent-camera capability.

Apple exposes simultaneous multiple-camera capture through `AVCaptureMultiCamSession`, and applications must check device support rather than assume that all iPhones or iPads support the requested camera combination.

Android CameraX supports concurrent camera selection, including front-and-back combinations, but availability depends on the device’s reported camera capabilities.

### CAM-004

If simultaneous recording is unsupported, the application shall:

- Disable the option.
- Explain that the device does not support it.
- Allow single-camera recording.
- Never fail or crash because the feature is unavailable.

### CAM-005

The application shall offer supported frame rates in the camera settings.

Recommended preference:

1. 120 FPS, when supported at a usable resolution.
2. 60 FPS.
3. 30 FPS as fallback.

### CAM-006

The application shall record the actual frame timestamps rather than assuming a perfect fixed frame interval.

### CAM-007

The application shall lock focus and exposure after user positioning where appropriate.

### CAM-008

The application shall display:

- Recording indicator.
- Available storage warning.
- Camera selected.
- Frame rate.
- Resolution.
- Orientation.
- Estimated recording capacity.

### CAM-009

The application shall handle phone calls, app backgrounding, camera interruptions, low storage, overheating, and permission revocation safely.

## 5.2 Pose Detection

### POSE-001

The application shall detect a full-body pose for each analyzed frame.

### POSE-002

The pose model shall provide, at minimum, landmarks for:

- Head or face reference.
- Left and right shoulders.
- Left and right elbows.
- Left and right wrists.
- Left and right hips.
- Left and right knees.
- Left and right ankles.
- Feet or heel/toe points when supported.

### POSE-003

Each landmark record shall include:

- X coordinate.
- Y coordinate.
- Optional depth estimate.
- Visibility or confidence.
- Timestamp.
- Frame index.

### POSE-004

The application shall smooth landmark motion while preserving fast swing transitions.

Recommended approach:

- Confidence gating.
- One Euro filter or adaptive low-pass filter.
- Separate smoothing parameters for torso and extremities.
- No interpolation across long landmark-loss intervals.
- Store raw and smoothed landmarks separately for debugging and model evaluation.

### POSE-005

The app shall display a warning when pose confidence is too low for reliable analysis.

Google’s MediaPipe ecosystem supports customizable, cross-platform on-device machine-learning pipelines, including mobile deployment. It is an appropriate initial candidate for pose inference, but the implementation team must validate current iOS and Android task support before locking the production model.

## 5.3 Angle and Movement Calculations

The application should calculate measurements such as:

### Lower body

- Left knee angle.
- Right knee angle.
- Knee flexion change.
- Hip-line rotation.
- Hip sway.
- Pelvis translation.
- Foot stability.
- Lead heel lift.
- Trail heel lift.
- Approximate stance width.
- Approximate weight-shift proxy.

### Torso

- Shoulder-line rotation.
- Shoulder tilt.
- Hip-to-shoulder separation.
- Spine angle relative to vertical.
- Spine-angle change.
- Head translation.
- Chest rotation.
- Side bend.
- Early extension proxy.

### Arms and wrists

- Lead elbow angle.
- Trail elbow angle.
- Wrist position.
- Hand depth.
- Hand height.
- Arm-to-torso relationship.
- Wrist hinge proxy.
- Release timing proxy.

### Whole movement

- Tempo.
- Backswing duration.
- Downswing duration.
- Backswing-to-downswing ratio.
- Balance at finish.
- Total movement duration.
- Maximum rotation timing.
- Sequencing of pelvis, torso, arms, and wrists.

### Angle calculation

For three landmarks A, B, and C, where B is the joint:

BA = A - B

BC = C - B

θ = arccos((BA · BC) / (|BA| × |BC|))

The implementation must:

- Clamp the cosine input to the range -1 through 1.
- Reject calculations with insufficient landmark confidence.
- Track the camera view because a two-dimensional angle is not necessarily the true three-dimensional joint angle.
- Label measurements as estimated when derived from monocular video.

## 5.4 Swing Phase Detection

The initial phase model should identify:

1. Setup or address.
2. Takeaway.
3. Mid-backswing.
4. Top of backswing.
5. Transition.
6. Mid-downswing.
7. Impact region.
8. Early follow-through.
9. Finish.

Phase detection should use a combination of:

- Wrist velocity.
- Hand direction.
- Shoulder rotation.
- Hip rotation.
- Club proxy if detected.
- Body landmark velocity.
- Temporal rules.
- A trained sequence classifier after sufficient labeled data is available.

Impact detection without visible club or ball data must be reported as an estimated impact frame.

## 5.5 Club Tracking

Club tracking should be implemented separately from human pose tracking.

Potential signals:

- Club grip near the hands.
- Shaft line.
- Club head.
- Motion blur path.
- Hough-line candidates.
- Object-detection model.
- Temporal tracking across frames.

The MVP may use wrist movement as a club-motion proxy. It must not claim that wrist speed equals club-head speed.

## 5.6 Ball Tracking

Ball tracking presents a major technical risk.

A golf ball is small, moves quickly, and may travel farther than the phone camera can resolve. Standard 30 or 60 FPS video may capture few or no usable post-impact ball frames.

The product should divide this capability into levels:

### Level 1: Visual trajectory annotation

- User manually identifies the ball or target line.
- App draws an intended or observed path overlay.
- Suitable for visualization, not measurement.

### Level 2: Short-range automatic detection

- Detect the stationary ball before impact.
- Detect initial movement in the first few frames after impact.
- Estimate an initial image-plane direction.
- Display a confidence score.

### Level 3: Calibrated launch estimation

Requires:

- High frame rate.
- Known camera position.
- Known scale.
- Clear lighting.
- Minimal motion blur.
- Sufficient ball visibility.
- Potentially a second camera.

### Level 4: Launch-monitor integration

Future support may ingest data from compatible external devices for:

- Ball speed.
- Launch angle.
- Carry.
- Spin.
- Club speed.
- Smash factor.

The first release must not promise accurate full ball-flight tracking from an ordinary single phone camera.

## 5.7 Feedback Engine

The feedback engine shall produce:

- Positive observations.
- Priority corrections.
- Supporting measurements.
- Confidence.
- Recommended practice drill.
- Disclaimer where the conclusion is uncertain.

### Feedback hierarchy

1. Recording-quality problems.
2. Major balance or posture issues.
3. Major sequencing issues.
4. Rotation and translation issues.
5. Arm and wrist details.
6. Minor refinements.

### Example rule

**Condition**

- Down-the-line recording.
- Sufficient hip and shoulder confidence.
- Pelvis moves materially closer to the ball line during downswing.
- Spine angle becomes substantially more vertical before estimated impact.

**Possible feedback**

“Your hips moved toward the ball during the downswing, and your upper body became more upright. Practice maintaining space behind your hips through impact.”

### Feedback safeguards

- Do not issue feedback from low-confidence measurements.
- Do not provide more than three major corrections at once.
- Explain why each correction matters.
- Separate observation from recommendation.
- Avoid medical or injury claims.
- Avoid presenting one universal swing model as correct for every golfer.
- Account for handedness, club type, camera angle, mobility, and user goals.

## 5.8 Personalized Training Plans

The training-plan engine should begin as a deterministic recommendation system rather than a generative model.

Inputs:

- Repeated swing issues.
- Trend direction.
- User skill level.
- Club type.
- Available practice time.
- Completed drills.
- User-rated difficulty.
- Measurement confidence.

Outputs:

- One primary objective.
- One secondary objective.
- Two or three drills.
- Suggested repetition count.
- Measurement to monitor.
- Retest instruction.
- Progress checkpoint.

Example:

- Goal: Reduce excessive head movement.
- Drill: Feet-together half swings.
- Repetitions: 3 sets of 8.
- Retest: Record five swings from face-on view.
- Success metric: Reduce horizontal head displacement by 15% relative to baseline.

## 5.9 Professional Swing Comparison

Professional reference swings must be:

- Properly licensed.
- Recorded from documented camera angles.
- Tagged with handedness and club type.
- Processed through the same pose pipeline.
- Accompanied by a warning that professional movement patterns vary.

Comparison should use normalized measurements rather than direct pixel positions.

Normalization may include:

- Body height.
- Shoulder width.
- Hip width.
- Stance width.
- Swing phase.
- Camera view.
- Handedness.
- Club category.

The app must not tell a beginner to reproduce a professional’s exact joint positions without accounting for body proportions and mobility.

## 5.10 Playback

Playback features shall include:

- Play.
- Pause.
- Replay.
- Frame step forward.
- Frame step backward.
- Scrubber.
- 0.25×, 0.5×, 0.75×, and 1× speed.
- Swing-phase markers.
- Skeleton toggle.
- Angle toggle.
- Club-path toggle.
- Ball-path toggle.
- Original versus annotated view.
- Zoom.
- Loop selected phase.
- Export annotated clip.

## 5.11 Local History

Each swing record shall contain:

- Unique ID.
- Date and time.
- Club.
- Handedness.
- Camera view.
- Camera used.
- Frame rate.
- Resolution.
- Video path.
- Thumbnail path.
- Duration.
- Swing phase timestamps.
- Raw landmark-data path.
- Smoothed landmark-data path.
- Metrics.
- Feedback.
- Recording-quality score.
- Model version.
- App version.
- User tags.
- Favorite status.
- Notes.
- Comparison relationships.
- Training-plan relationship.

Users shall be able to:

- Sort.
- Filter.
- Search by tag.
- Favorite.
- Rename.
- Add notes.
- Delete.
- Export.
- Compare.
- View storage usage.

---

# 6. Nonfunctional Requirements

## 6.1 Performance Targets

Initial engineering targets:

- Camera preview: visually smooth at the selected frame rate.
- UI interaction: target 60 FPS on supported devices.
- Pose-preview latency: less than 150 ms on target devices when live overlay is enabled.
- Post-processing: target less than the recorded clip duration on recent flagship devices.
- Screen response: under 200 ms for common local operations.
- Application cold launch: under 3 seconds on target devices.
- Crash-free sessions: at least 99.5% during beta, with a higher target after stabilization.
- No dropped recording because analysis is competing with video encoding.

Recording and pose analysis should use separate pipelines. The app should record the highest-quality source first and reduce live-analysis frequency if thermal or performance limits are reached.

## 6.2 Battery and Thermal Requirements

The application shall:

- Avoid continuous camera operation when not on the recording screen.
- Stop analysis when the screen is closed.
- Process a lower-resolution analysis stream separately from the stored video where supported.
- Reduce pose inference frequency when necessary.
- Monitor thermal state.
- Warn users when the device is overheating.
- Pause optional background processing under serious thermal pressure.
- Avoid unnecessary network activity.
- Avoid indefinite background services.

## 6.3 Reliability

The application shall recover from:

- Camera interruption.
- Incoming phone call.
- App entering background.
- Low storage.
- Incomplete video write.
- Interrupted analysis.
- Corrupted local record.
- Model initialization failure.
- Unsupported device capability.
- Permission denial.
- User deleting a video outside the application where platform access permits it.

## 6.4 Accessibility

Support:

- Dynamic font sizes.
- Screen-reader labels.
- High-contrast controls.
- Text alternatives for color-coded results.
- Captions for voice guidance.
- Large recording controls.
- Haptic recording confirmation.
- Left- and right-handed layouts where useful.
- Reduced-motion settings.

---

# 9. Security and Privacy

## 9.1 Privacy Principle

All swing videos, pose landmarks, metrics, notes, comparisons, and training plans remain on the device by default.

## 9.2 Data Classification

### Sensitive personal data

- Recorded videos.
- Body pose.
- Biometric-like movement patterns.
- User notes.
- Training history.

### Application operational data

- App version.
- Device model.
- Crash stack.
- Feature-use counters.

Operational telemetry must not include:

- Video frames.
- Landmark arrays.
- User notes.
- File names containing personal information.
- Precise location.
- Advertising identifiers.

## 9.3 Encryption

### In transit

Any future network request shall use TLS.

### At rest

- Use iOS file-protection classes for application data.
- Store secrets in Keychain.
- Use Android Keystore-backed key management.
- Encrypt especially sensitive structured data where platform database encryption is available and operationally supportable.
- Exclude swing files from unapproved shared storage.
- Do not save recordings to the public camera roll unless the user explicitly exports them.

## 9.4 Authentication

No account is required for MVP.

Optional application lock:

- Face ID.
- Touch ID.
- Android biometric prompt.
- Device passcode fallback where appropriate.

OAuth2 and JWT are unnecessary for an application without a user backend. They should be introduced only when an authenticated server is actually added.

## 9.5 Permission Handling

Request permissions at the point of use.

Required:

- Camera.

Conditional:

- Microphone, only when recording audio.
- Photo library, only when importing or exporting.
- Bluetooth, only for an added accessory.
- Motion sensors, only if the feature requires them.

Permission descriptions must clearly explain the user benefit. Apple specifically requires clear purpose strings for protected resources such as the camera.

## 9.6 Privacy Notice

The privacy notice shall explain:

- What is recorded.
- Where it is stored.
- Whether data leaves the phone.
- How to delete data.
- What third-party SDKs receive.
- What crash information is collected.
- Whether purchases are processed by the app stores.
- How professional reference data is licensed.
- How optional export works.

Apple requires developers to accurately disclose app and third-party data practices in App Store privacy details and to maintain an appropriate privacy policy.

## 9.7 GDPR and CCPA Design

Even with local-only storage, provide:

- Clear disclosure.
- Data minimization.
- Purpose limitation.
- User-controlled deletion.
- Export.
- Consent where required.
- A contact channel for privacy questions.

Because there is no required account or backend, server-side data-access and deletion workflows may not apply to locally stored swing data. The policy must state this accurately.

## 9.8 Delete Behavior

Deleting a swing shall remove:

- Original video.
- Processed video.
- Thumbnail.
- Pose data.
- Metrics.
- Feedback.
- Comparison references.
- Training-plan references that cannot remain valid.

The app should offer:

- Immediate deletion.
- Optional short undo period before final removal.
- Delete-all-data control.
- Confirmation showing estimated storage to be freed.

---

# 10. UI and UX Specification

## 10.1 Navigation

Recommended bottom navigation:

1. Home.
2. Record.
3. History.
4. Training.
5. Settings.

The record action should be visually prominent and reachable within the thumb zone.

## 10.2 Home Screen

Display:

- Start recording.
- Most recent swing.
- Current practice goal.
- Recent improvement trend.
- Storage warning.
- Continue training plan.

## 10.3 Recording Setup Screen

Display:

- Club selector.
- Camera-view selector.
- Front/rear/dual selector.
- Frame-rate selector.
- Countdown.
- Audio toggle.
- Pose guide.
- Recording tips.

## 10.4 Camera Screen

Display only critical controls:

- Record.
- Countdown.
- Camera toggle.
- Framing outline.
- Full-body visibility indicator.
- Lighting indicator.
- Storage indicator.
- Exit.

Avoid clutter during recording.

## 10.5 Results Screen

Recommended information order:

1. Recording quality.
2. Main positive observation.
3. Highest-priority improvement.
4. Video playback.
5. Swing timeline.
6. Key metrics.
7. Additional corrections.
8. Drill recommendation.
9. Compare or save actions.

## 10.6 Beginner and Advanced Modes

### Beginner mode

- Plain language.
- Two or three metrics.
- Limited technical terminology.
- Visual guidance.
- One primary drill.

### Advanced mode

- Full angle table.
- Phase timing.
- Confidence values.
- Sequencing charts.
- Raw comparison deltas.
- Model and analysis metadata.

## 10.7 Offline UX

The application should be fully usable without internet except for:

- Store purchase validation.
- App updates.
- Optional future reference-content downloads.
- Optional user-initiated support upload.

Show no generic “offline error” during normal recording and analysis.

---

# 14. Observability and Support

## 14.1 Crash Reporting

Use a privacy-reviewed crash-reporting SDK or a native store diagnostic system.

Collect:

- Stack trace.
- App version.
- OS version.
- Device model.
- Feature flag states.
- Nonpersonal error code.
- Model version.

Do not collect:

- Video.
- Frames.
- Pose data.
- Notes.
- User-entered swing names.
- Exact file paths containing personal identifiers.

## 14.2 Local Diagnostic Logs

Keep a short rotating local log containing:

- Camera capability detection.
- Recording state transitions.
- Analysis stage status.
- Model initialization result.
- Database migration result.
- Nonpersonal performance timing.

Allow the user to generate a support package.

The support package must:

- Show exactly what will be included.
- Exclude videos by default.
- Require explicit confirmation before including a selected swing.
- Be shareable through the operating system share sheet.

## 14.3 Operational Metrics

Privacy-preserving metrics may include:

- Recording completion rate.
- Analysis success rate.
- Low-confidence rate.
- Processing duration distribution.
- Crash-free sessions.
- Dual-camera capability availability.
- Export success.
- Device storage failure.
- Model initialization failure.

Use opt-in analytics where required by the product’s privacy position or applicable law.

---

# 15. App Store and Google Play Readiness

## 15.1 Apple Requirements

Prepare:

- Camera purpose string.
- Microphone purpose string if applicable.
- Photo-library strings if applicable.
- Privacy policy.
- App Privacy answers.
- In-app purchase configuration.
- Restore-purchases flow.
- Account-deletion flow only if accounts are later added.
- Review notes explaining on-device analysis.
- Demo instructions.
- Sample recording workflow.
- Permission-denial behavior.
- Data-deletion behavior.

Apple organizes review requirements under safety, performance, business, design, and legal categories, so these areas should be reviewed before every submission.

## 15.2 Google Play Requirements

Prepare:

- Data Safety declaration.
- Camera and microphone declarations.
- Billing implementation.
- Subscription disclosure.
- Privacy policy.
- Content rating.
- Target API compliance.
- Testing-track requirements.
- Reviewer instructions.
- Account deletion if an account system is later introduced.

## 15.3 Review Risks

Potential rejection risks:

- Crashes on unsupported multi-camera devices.
- Misleading ball-flight claims.
- Unclear subscription terms.
- Incomplete privacy disclosures.
- Permission requests without clear purpose.
- Inaccessible purchase restoration.
- Placeholder or unfinished screens.
- Claims that imply medical diagnosis.
- Excessive battery consumption.
- Capturing camera data before permission or user action.
- Exporting data without clear user control.

---

# 21. Initial Product Decisions and Assumptions

The following decisions are currently assumed:

- Sport: golf.
- Primary objective: improve swing technique.
- Secondary objectives:

  - Track swing history.
  - Analyze changes.
  - Verify whether coaching feedback was followed.

- Users: beginners and amateurs.
- Framework: React Native.
- Platforms: iOS and Android.
- Storage: on-device only.
- Account: not required for MVP.
- Primary camera workflow: user selects front or rear camera.
- Dual-camera workflow: supported on compatible devices.
- Feedback:

  - Basic pose corrections.
  - Detailed coaching analysis.
  - Personalized training plans.
  - Professional swing comparison.

- Rear camera is the recommended default.
- Single-camera pose analysis is the MVP priority.
- Ball tracking is not considered fully reliable until validated.

---

# 22. Remaining Product Decisions

These decisions should be finalized during Phase 0:

1. Minimum supported iOS version.
2. Minimum supported Android API level.
3. Exact supported phone list for high-frame-rate modes.
4. Whether audio is recorded by default.
5. Maximum free-tier swing count.
6. Subscription price.
7. Which professional swing footage can be licensed.
8. Which clubs are supported at launch.
9. Whether putting is included.
10. Whether the application supports users under 16.
11. Whether users can import videos from the photo library.
12. Whether users can export raw pose measurements.
13. Exact definition and validation tolerance for every coaching metric.
14. Initial golf instructor or biomechanics reviewer.
15. Whether an optional encrypted backup is planned.
16. Whether professional comparisons ship inside the app or as downloadable packages.
17. Whether training plans are included at launch or released after the core analysis engine.
18. Whether an external launch-monitor integration is part of the long-term roadmap.

---
