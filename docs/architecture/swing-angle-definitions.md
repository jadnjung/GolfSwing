# Swing-angle definitions

Phase 0 deliverable (`docs/PRD.md` section 16) and prerequisite for actually implementing PRD section 5.3's measurement list once a pose-inference library is available (`docs/adr/0009-defer-pose-inference-library.md`). This maps every named PRD 5.3 measurement to specific landmarks and a specific formula, so implementing them later is direct engineering, not re-deriving biomechanics on the spot.

## Landmark naming

No pose-inference library is chosen yet (ADR 0009), so this uses a model-independent landmark set rather than one vendor's exact output names — the union of what PRD section 5.2 (POSE-002) requires:

```
nose
leftShoulder, rightShoulder
leftElbow, rightElbow
leftWrist, rightWrist
leftIndex, rightIndex        (fingertip proxy — "where supported", POSE-002)
leftHip, rightHip
leftKnee, rightKnee
leftAnkle, rightAnkle
leftHeel, rightHeel          ("where supported", POSE-002)
leftFootIndex, rightFootIndex ("where supported", POSE-002)
```

This happens to match MediaPipe's BlazePose 33-point topology (PRD 5.2's suggested starting candidate) but isn't tied to it — any candidate library evaluated later just needs to expose (or let us derive) these points.

**Derived points** (not raw landmarks, computed from two landmarks):

- `hipMidpoint` = midpoint(leftHip, rightHip)
- `shoulderMidpoint` = midpoint(leftShoulder, rightShoulder)

## Formula types needed

`packages/analysis-engine`'s `calculateJointAngleDegrees(a, b, c)` (PRD 5.3's formula) computes the angle **at a shared vertex B** between rays B→A and B→C. Several PRD 5.3 measurements fit that shape directly. Others don't — they need the angle *between two vectors that don't share a vertex* (e.g. a body segment against a fixed reference direction like vertical, or a landmark line's rotation relative to its own orientation at address). Both variants reduce to the same underlying dot-product formula; `calculateJointAngleDegrees` just isn't the right call shape for the second one.

**Not yet built** (flagged per measurement below):

- **`calculateVectorAngleDegrees(v1, v2)`** — angle between two arbitrary 2D vectors, no shared vertex required. Needed for rotation-relative-to-address and segment-relative-to-vertical measurements.
- A **reference-frame concept** for "rotation since address": several measurements are relative to the golfer's own address posture, not an absolute frame. Computing them needs the address-frame landmark snapshot carried alongside whatever frame is being measured — a small piece of state, not a formula, but real design work belonging to whatever calls into `analysis-engine` once phase detection (PRD 5.4) exists.

## Lower body

| Measurement | Landmarks | Formula | Notes |
| --- | --- | --- | --- |
| Left knee angle | `leftHip`, `leftKnee`, `leftAnkle` | `calculateJointAngleDegrees(leftHip, leftKnee, leftAnkle)` | Direct. |
| Right knee angle | `rightHip`, `rightKnee`, `rightAnkle` | same, mirrored | Direct. |
| Knee flexion change | (above) at two phase timestamps | `angle(t2) - angle(t1)` | Needs phase detection (PRD 5.4) to pick `t1`/`t2` — not just a formula. |
| Hip-line rotation | vector `leftHip → rightHip` at time T vs. at address | `calculateVectorAngleDegrees(hipLine(address), hipLine(T))` | **Not built.** Needs the address reference frame. Face-on view: rotation reads mostly as foreshortening (2D limitation, PRD 5.3 "a two-dimensional angle is not necessarily the true three-dimensional joint angle"). |
| Hip sway | `hipMidpoint.x` at T vs. address, normalized by shoulder width | not an angle — a normalized displacement | Face-on view only; down-the-line view has this axis foreshortened. |
| Pelvis translation | `hipMidpoint` (x, y) at T vs. address | displacement vector, normalized by shoulder width | Broader than sway (both axes, not just lateral). |
| Foot stability | `leftAnkle`/`rightAnkle` position variance across the swing | max displacement from address position | Should be near-zero for a stable base; large values flag instability. |
| Lead heel lift | lead foot's `leftHeel`/`rightHeel`, y-displacement from address | `heel.y(T) - heel.y(address)` | **Needs handedness** to know which foot is "lead" — not currently captured anywhere in the app (see Open gaps below). |
| Trail heel lift | trail foot's heel landmark | same | Same handedness dependency. |
| Approximate stance width | distance(`leftAnkle`, `rightAnkle`) at address, normalized by shoulder width | Euclidean distance, not the angle formula | |
| Approximate weight-shift proxy | `hipMidpoint.x` relative to the `leftAnkle`–`rightAnkle` base of support, over time | normalized position within stance width | PRD 5.3 explicitly calls this a *proxy* — real weight distribution needs force-plate data this app will never have. Must be labeled as estimated wherever it's shown (PRD 5.3, 9.6). |

## Torso

| Measurement | Landmarks | Formula | Notes |
| --- | --- | --- | --- |
| Shoulder-line rotation | `leftShoulder → rightShoulder` at T vs. address | `calculateVectorAngleDegrees` | Same "not built" / address-frame dependency as hip-line rotation. |
| Shoulder tilt | `leftShoulder → rightShoulder` vs. horizontal image axis | `calculateVectorAngleDegrees(shoulderLine, (1, 0))` | Absolute-frame (no address reference needed), meaningful mainly face-on. |
| Hip-to-shoulder separation ("X-factor") | shoulder-line rotation minus hip-line rotation, same T | subtraction of two already-computed rotation values | Standard golf-instruction term for this exact measurement — worth naming explicitly even though PRD doesn't use "X-factor." |
| Spine angle relative to vertical | vector `hipMidpoint → shoulderMidpoint` vs. true vertical | `calculateVectorAngleDegrees(spineVector, (0, -1))` | "Relative to vertical" needs a fixed reference vector, not a landmark — different from the other measurements here. |
| Spine-angle change | spine angle at two phases | `angle(t2) - angle(t1)` | Needs phase detection. |
| Head translation | `nose` position at T vs. address | displacement, normalized by shoulder width | |
| Chest rotation | same signal as shoulder-line rotation | — | PRD 5.3 lists this separately from shoulder-line rotation, but there's no chest-specific landmark in POSE-002's set to derive it independently — treating them as the same 2D proxy unless a future pose model adds a distinct chest/sternum point. Flagging the ambiguity rather than inventing a fake distinction. |
| Side bend | lateral component of the spine vector, face-on view | `calculateVectorAngleDegrees(spineVector, (0, -1))` restricted to face-on recordings | Same underlying vector as spine angle; "side bend" vs. "forward bend" is a matter of which view is recording, not a different formula. |
| Early extension proxy | hip depth/scale change during downswing, or spine-angle change during downswing | **estimate only** | PRD 5.7's example rule ("pelvis moves materially closer to the ball line") is explicitly down-the-line-specific and implies depth, which single-camera 2D landmarks don't reliably provide without a model that outputs a depth channel. Do not present this with unwarranted precision — PRD 5.3: "Label measurements as estimated when derived from monocular video." |

## Arms and wrists

| Measurement | Landmarks | Formula | Notes |
| --- | --- | --- | --- |
| Lead elbow angle | lead `shoulder`, `elbow`, `wrist` | `calculateJointAngleDegrees(shoulder, elbow, wrist)` | Direct. Needs handedness for "lead" vs. "trail." |
| Trail elbow angle | trail `shoulder`, `elbow`, `wrist` | same | Same. |
| Wrist position | `leftWrist`/`rightWrist` raw (x, y) | not an angle — a raw position | |
| Hand depth | — | **blocked** | Needs a z/depth channel from the pose model; 2D-only landmarks can't provide this. Revisit once a pose library is chosen and its output format is known. |
| Hand height | wrist y-coordinate relative to `hipMidpoint` or `shoulderMidpoint` y | signed vertical offset | E.g. "hands above shoulder height at the top of backswing." |
| Arm-to-torso relationship | `elbow`, `shoulder` (shared vertex), `hipMidpoint` | `calculateJointAngleDegrees(elbow, shoulder, hipMidpoint)` | This one *does* share a vertex (the shoulder) between the upper-arm segment and the torso segment, so it's a direct application of the existing formula — no new vector-angle helper needed here. |
| Wrist hinge proxy | `elbow`, `wrist`, `index` (shared vertex: wrist) | `calculateJointAngleDegrees(elbow, wrist, index)` | Also a direct three-point angle. Depends on the pose model actually providing a fingertip/index landmark ("where supported" in POSE-002) — degrades to unavailable if not. |
| Release timing proxy | wrist-hinge-angle signal over time, thresholded | timing derived from the above, not a new formula | Needs phase detection / a time series of the wrist-hinge angle, not a single-frame calculation. |

## Whole movement

Tempo, backswing/downswing duration, their ratio, balance at finish, total movement duration, max-rotation timing, and pelvis/torso/arm/wrist sequencing are all **timing measurements built on top of swing-phase timestamps** (PRD 5.4), not new geometric formulas. None of them are calculable until phase detection exists — which itself depends on the pose-inference library decision (ADR 0009). Nothing further to define here until that's unblocked; the geometric signals they'd operate on (rotation angles, hand height, etc.) are already defined above.

## Open gaps this review surfaced

- **Handedness isn't captured anywhere in the app yet.** `packages/domain`'s `Swing` type (Step 5) has no `handedness` field — it was deliberately scoped to exactly what `RecordScreen` writes today, and `RecordScreen` never collects it. Several measurements above (lead/trail elbow, lead/trail heel) are undefined without it. This traces back to MVP item 1, "Local user profile," which is also unbuilt — there's currently no onboarding flow (PRD 4.1) anywhere in the app to ask the user for handedness, skill level, or club preference. Worth sequencing before or alongside pose inference, not after — a metric that's fundamentally undefined without handedness shouldn't ship partially working.
- **`calculateVectorAngleDegrees`** (two arbitrary vectors, no shared vertex) is needed for every rotation-relative-to-address measurement (hip-line rotation, shoulder-line rotation, spine angle vs. vertical, shoulder tilt). Small addition to `packages/analysis-engine` once there's real landmark data to test it against meaningfully — not added speculatively here, per the same reasoning as ADR 0009 (don't build ahead of data that doesn't exist yet).
- **Address-frame reference state**: several measurements are relative to the golfer's own address posture. That's a small piece of application/analysis state (capture and hold the address-frame landmarks), not a formula — worth designing once phase detection exists and it's clear what calls what.
