# Swing-event detection feasibility report

Assessment for MVP scope item 8 (`Checklist.md`) — "Automatic swing-event detection where reliable" — and PRD section 4.2 steps 7-8 ("Application detects the active swing segment" / "Application trims unnecessary video before and after the swing"). This is a desk-research assessment, not a built-and-measured feature: it has no recorded test footage to validate against, the same limitation `ball-tracking-feasibility.md` documents for its own topic.

## Why this is a separate problem from PRD 5.4's phase detection

It's tempting to treat "detect where the swing starts and ends" as a trivial subset of PRD 5.4's full phase model (address → takeaway → ... → finish), but the PRD itself keeps them apart, and for good reason:

- **Section 4.2** places segment detection and trimming at **steps 7-8**, immediately after recording and _before_ step 9 ("Application processes the swing locally"). Read literally, trimming happens before the heavier processing step — implying it's meant to be cheap enough to run inline, not gated behind whatever pose model Phase 2 eventually ships.
- **Section 5.4**'s phase model explicitly requires wrist velocity, hand direction, shoulder rotation, hip rotation, and a club proxy — i.e. it's built entirely on pose-landmark data. That data doesn't exist yet (blocked on ADR 0014's still-unresolved pose-inference benchmarking) and won't for a while.

So MVP item 8 (trim to the active segment) and MVP item 12 (the full named-phase timeline) have different, non-overlapping technical prerequisites. Item 8 is worth assessing independently rather than leaving it lumped in with "blocked on pose inference," because it may not actually be blocked on that.

## Candidate approaches

### A. Motion-energy / frame-differencing on the video itself

Compute a per-frame motion magnitude (e.g. mean absolute pixel difference between consecutive frames, or a coarser block-based variant) across the recorded clip. A golf swing has a distinctive shape: a long near-static "address" period, a smooth acceleration through backswing/downswing, a sharp motion spike around impact, and a decay through follow-through/finish. Thresholding against the near-static baseline (address, and the stillness before/after the user presses record) should localize "swing starts here" / "motion has settled again" without needing to know _what_ is moving or classify any named phase.

**Feasible in principle, unvalidated in practice.** The technique is well-established (motion energy / optical-flow-magnitude segmentation is standard in action-detection literature) and doesn't require a trained model — just frame decoding and pixel math, which this app already needs for thumbnail generation (ADR 0015) and could reuse similar tooling for. The open risk is entirely about _this specific footage domain_: does the golfer's body motion dominate the frame enough to produce a clean signal, or does background motion (moving grass/trees outdoors, other people walking through frame, camera shake from a handheld phone rather than a tripod) swamp it? That's an empirical question this report can't answer without recorded test clips across the PRD 8.4 variation matrix (indoor/outdoor, handheld/tripod, lighting).

### B. Device motion sensors (accelerometer/gyroscope)

If the phone is handheld during recording, its own accelerometer/gyroscope would show a very distinct signature at the moment of the swing (arm motion) and at impact (a sharp jolt, especially if the ball is struck near the camera). React Native's built-in device-motion APIs could sample this alongside recording at negligible cost.

**Not usable as the primary signal for this app.** PRD 3.1/4.2 already establish the phone is meant to be placed on a stand/tripod and record the golfer from a few feet away (face-on or down-the-line), not held during the swing — the golfer's hands are on a club, not the phone. A tripod-mounted phone experiences no meaningful motion of its own during the swing (unless someone bumps it), so this signal would mostly be silent when it matters, or attribute unrelated bumps to a false event. **Rejected** as a primary approach for this reason, not because the sensor itself is unreliable.

### C. Audio spike detection (impact sound)

Club-ball contact produces a short, sharp, distinctive audio transient. Detecting a volume/spectral spike in the recorded audio track could pinpoint impact specifically (not the full swing window, just one instant).

**Plausible as a secondary refinement, not a standalone solution.** It only localizes impact, not the swing's start — still needs approach A (or similar) to find where trimming should begin. It's also environment-dependent: wind noise, other conversation, or a driving-range's ambient club-strike sounds from _other_ golfers could produce false positives outdoors, which is exactly where this app expects a lot of its real-world use (PRD 2.4's target audience, a home user or driving-range user, not a quiet indoor studio). Worth revisiting as a cheap confidence-boosting signal alongside A once A exists, not as the first thing built.

### D. Wait for Phase 2 pose landmarks, derive from wrist/hand velocity

Once pose inference lands (blocked on ADR 0014), wrist velocity crossing a threshold is a clean, well-understood swing-start/end signal and reuses infrastructure PRD 5.4 needs anyway.

**Correct long-term signal, wrong near-term plan.** This is almost certainly what a mature version of this feature should use — pose-based motion is more robust to background clutter than raw pixel-motion energy (approach A) since it's tracking the golfer specifically, not the whole frame. But treating it as the _only_ plan means MVP item 8 stays blocked on the same native-pose-inference dependency that's already blocking items 9-13, which is exactly the coupling section 4.2's step ordering seems to be trying to avoid.

## Recommendation

- **Build approach A (frame-differencing motion-energy segmentation) as a first proof of concept**, gated the same way `ball-tracking-feasibility.md` gates its own Level 2 recommendation: do not ship it as a trusted, always-on trim before it's been run against real recorded footage across the PRD 8.4 variation matrix (indoor/outdoor, lighting, handheld-vs-tripod camera stability, club type). The algorithm itself (frame decode → per-frame motion magnitude → threshold against a rolling baseline) is straightforward enough to prototype and unit-test against synthetic/staged input without a phone, but its real accuracy is an empirical question this report can't settle.
- **Do not build approach B** (device motion sensors) as anything more than a "camera got bumped" sanity check, if that — it doesn't match this app's tripod-mounted recording model.
- **Treat approach C (audio impact detection) as a future refinement**, layered on top of A once A exists and has a baseline accuracy to improve on.
- **Do not wait for Phase 2 pose data (approach D) to start this.** It's the better long-term signal and should probably _replace_ frame-differencing once pose inference ships, but making item 8 depend on it needlessly couples two independently-shippable features and stalls a user-visible improvement (auto-trimmed comparison videos, the exact thing requested this session) behind a much larger, still-unresolved native-pose decision.
- Until a Level A prototype is validated against real footage, keep the manual recording start/stop as the only trim boundary (already shipped, MVP item 7) — do **not** claim automatic trimming works in-app copy before it's measured, same caution `ball-tracking-feasibility.md` applies to ball-tracking confidence claims.

## What this report cannot establish

No claim above about actual segmentation accuracy, false-positive rate from background motion, or how well approach A holds up outdoors is backed by measurement — this environment has no camera and no recorded golf swings. A proof-of-concept implementation of approach A's algorithm can and should be built and unit-tested against synthetic frame-difference sequences next (verifying the thresholding logic itself is correct), but validating it against real swing footage needs the physical device.
