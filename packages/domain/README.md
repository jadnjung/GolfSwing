# domain

Pure TypeScript business entities and rules — no React Native, no I/O (PRD section 7.1).

Currently implemented: `Swing` (matching what `RecordScreen` writes to `analysis-manifest.json`) and `parseSwingManifest`, a validating parser used by `apps/mobile/src/data/swingRepository.ts` to read swing history back off the filesystem. More entities (`SwingPhase`, `PoseFrame`, `JointAngle`, `SwingMetric`, `FeedbackItem`, `TrainingPlan`, `ReferenceSwing`) get added here as the features that produce them are built — not speculatively ahead of time.
