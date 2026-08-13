# Ball-tracking feasibility report

Phase 0 deliverable (`Roadmap.md` section 16). `Project.md` section 5.6 already lays out the four-level framework this report evaluates against; `Roadmap.md` section 19, Risk 2, already names ball tracking as a major risk with a mitigation plan. This is a desk-research assessment against that framework — it does not (and cannot, in this environment) include actual recorded test footage or a measured detection accuracy, since that needs real cameras, real swings, and likely a labeled evaluation set (`Architecture.md` 8.4).

## Why this is hard, restated concretely

A golf ball is roughly 42.7mm in diameter. At typical recording distances for a face-on or down-the-line swing view (PRD 4.2 — several feet to a few meters from the golfer), the ball occupies a small number of pixels even at 1080p, and post-impact ball speed for an amateur golfer's driver swing is commonly cited in the 100+ mph range. At 30 or 60 FPS, motion blur and inter-frame displacement mean the ball may cross most of the frame between two consecutive frames, or leave the frame entirely within 1-2 frames of impact. This isn't a model-quality problem that a better detector fixes — it's a sampling-rate and optics problem inherent to consumer phone video at consumer frame rates.

## Assessment per PRD 5.6 level

### Level 1: Visual trajectory annotation (manual)

**Feasible now, with existing tools.** This needs no ball detection at all — the user marks the ball or a target line, and the app draws an overlay. This is a straightforward UI feature (an annotation layer over the recorded video, similar in spirit to the skeleton overlay Phase 2 will already need) with no computer-vision risk. Could reasonably ship without any of the harder levels below ever landing.

### Level 2: Short-range automatic detection (pre-impact stationary ball + first few post-impact frames)

**Plausible, but unverified, and the first level with real technical risk.** Detecting a _stationary_ ball before impact is the easier half — classical techniques (Hough circle detection, PRD 5.5 already names Hough-line candidates for club tracking, the same family of technique applies to a round ball) or a small trained object detector should localize a stationary, unoccluded ball reasonably reliably in good lighting. The harder half is the first few post-impact frames: at driver swing speeds, standard 30/60 FPS may capture very few genuinely usable frames before the ball leaves the frame or motion-blurs into an unrecognizable streak. Whether "a few usable frames" is enough to report even just an initial 2D launch direction (not speed, not spin) is an empirical question this report cannot answer without recorded test footage across multiple frame rates, lighting conditions, and club types — exactly the kind of dataset PRD 8.4 already calls for. Feasibility: **conditionally yes, confidence unproven** — a confidence score per PRD 5.6's own spec is not just a nice-to-have here, it's necessary because the underlying detection will be marginal in exactly the conditions (low light, motion blur, higher club speeds) most amateur golfers will actually record in.

### Level 3: Calibrated launch estimation

**Not feasible with the stated MVP hardware assumption (single uncalibrated phone camera).** PRD 5.6 itself lists the requirements this needs — high frame rate, known camera position, known scale, clear lighting, minimal motion blur, sufficient ball visibility, potentially a second camera — and the MVP (PRD 3.1, 3.3) explicitly does not include calibrated capture or a guaranteed second camera. This level requires the product to add camera calibration UX and possibly mandate dual-camera capture (itself gated behind device capability per ADR-003), which is a materially different, larger feature than "add a better ball detector." Out of scope until those prerequisites exist.

### Level 4: Launch-monitor integration

**Feasible as an integration, not a detection problem.** This isn't ball-tracking risk at all — it's ingesting data from an external device that's already done the hard measurement (radar/camera launch monitors). The risk here is integration/partnership and data-format work, not computer vision. Reasonable to treat as a separate, much lower-risk roadmap item whenever there's a business reason to pursue it (PRD 3.2 already lists this as post-MVP).

## Recommendation

- Build **Level 1** as part of the normal Phase 2/3 overlay work — it's low-risk, high-value (users get _something_ immediately), and shares infrastructure with the skeleton/angle overlay already planned.
- Treat **Level 2** as its own proof-of-concept, gated behind having recorded real test footage across the PRD 8.4 variation matrix (lighting, club type, frame rate, camera distance) — do not attempt to build a Level 2 detector "blind" without that footage first, since the whole premise (is there enough non-blurred signal at 30/60 FPS to say anything at all) is an empirical question, not an engineering one.
- **Do not build Level 3** until dual-camera and calibration are separately prioritized product features, per ADR-003 and PRD 3.2/3.3.
- **Do not promise Level 2 accuracy in marketing or in-app copy** beyond what's actually measured — PRD 19 Risk 2's mitigation ("treat it as experimental," "separate detection from full-flight claims") should be read as a hard constraint on UI copy, not just an engineering caveat, given how easy it is for a "confidence: 62%" number to read as more authoritative than it is to a beginner golfer (PRD 2.4's target audience).

## What this report cannot establish

No claim above about actual detection accuracy, frame-availability-in-practice, or false-positive rate is backed by measurement — this environment has no camera, no recorded golf swings, and no labeled evaluation set. PRD 8.4's evaluation methodology (skin tone, clothing, lighting, camera distance, club type variation, etc.) still needs to be run against real footage before Level 2 is greenlit for anything beyond an internal prototype.
