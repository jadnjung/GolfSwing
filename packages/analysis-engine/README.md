# analysis-engine

Joint-angle calculations, swing-phase detection, and metric extraction from pose landmarks (PRD sections 5.3, 5.4). Pure TypeScript, testable independent of the RN app.

**Implemented:** `calculateJointAngleDegrees` (PRD 5.3's three-point angle formula — confidence-gated, clamped, degrees).

**Not yet implemented:** swing-phase detection (PRD 5.4) and the higher-level metrics built on top of joint angles (PRD 5.3's lower body/torso/arms/whole-movement measurement lists) — both need real pose landmark data, which nothing produces yet. See `docs/adr/0009-defer-pose-inference-library.md` for why a pose-inference library hasn't been picked yet.
