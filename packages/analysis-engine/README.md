# analysis-engine

Joint-angle calculations, swing-phase detection, and metric extraction from pose landmarks (PRD sections 5.3, 5.4). Pure TypeScript, testable independent of the RN app.

**Implemented:**
- `calculateJointAngleDegrees` (PRD 5.3's three-point angle formula — confidence-gated, clamped, degrees).
- `compareToProfessionalBenchmark` and published benchmark constants (PRD 5.9 — X-Factor, tempo, clubhead speed, hip/shoulder rotation ranges from CC-BY-licensed golf biomechanics research, not licensed video). See `docs/architecture/professional-swing-benchmarks.md`.

**Not yet implemented:** swing-phase detection (PRD 5.4) and the higher-level metrics built on top of joint angles (PRD 5.3's lower body/torso/arms/whole-movement measurement lists) — both need real pose landmark data, which nothing produces yet. See `docs/adr/0009-defer-pose-inference-library.md` and `docs/adr/0014-pose-inference-shortlist.md` for the pose-inference library status.
