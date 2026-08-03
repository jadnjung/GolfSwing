import { CLUB_TYPES, type ClubType } from "./swing";

// PRD section 4.1 (First Launch): handedness, skill level, primary club
// category, and preferred units, collected once before recording is
// available. PRD section 9.6 (Privacy Notice) requires the user to
// acknowledge local-only storage before that — recorded here as a
// timestamp, not a boolean, so "when" is on record, not just "whether."
export type Handedness = "left" | "right";
export type SkillLevel = "beginner" | "intermediate" | "advanced";
export type Units = "imperial" | "metric";

export interface Profile {
  handedness: Handedness;
  skillLevel: SkillLevel;
  primaryClub: ClubType;
  units: Units;
  privacyAcknowledgedAt: string;
}

const HANDEDNESS_VALUES: readonly Handedness[] = ["left", "right"];
const SKILL_LEVELS: readonly SkillLevel[] = ["beginner", "intermediate", "advanced"];
const UNITS_VALUES: readonly Units[] = ["imperial", "metric"];

export class InvalidProfileError extends Error {
  constructor(reason: string) {
    super(`Invalid profile: ${reason}`);
    this.name = "InvalidProfileError";
  }
}

/**
 * Parses and validates a stored profile.json. Throws InvalidProfileError
 * rather than silently accepting malformed or partial data — a corrupt
 * profile should send the user back through onboarding, not run with
 * made-up defaults for e.g. handedness.
 */
export function parseProfile(raw: unknown): Profile {
  if (typeof raw !== "object" || raw === null) {
    throw new InvalidProfileError("not an object");
  }

  const profile = raw as Record<string, unknown>;

  if (!HANDEDNESS_VALUES.includes(profile.handedness as Handedness)) {
    throw new InvalidProfileError('missing or invalid "handedness"');
  }
  if (!SKILL_LEVELS.includes(profile.skillLevel as SkillLevel)) {
    throw new InvalidProfileError('missing or invalid "skillLevel"');
  }
  if (!CLUB_TYPES.includes(profile.primaryClub as ClubType)) {
    throw new InvalidProfileError('missing or invalid "primaryClub"');
  }
  if (!UNITS_VALUES.includes(profile.units as Units)) {
    throw new InvalidProfileError('missing or invalid "units"');
  }
  if (
    typeof profile.privacyAcknowledgedAt !== "string" ||
    Number.isNaN(Date.parse(profile.privacyAcknowledgedAt))
  ) {
    throw new InvalidProfileError('missing or invalid "privacyAcknowledgedAt"');
  }

  return {
    handedness: profile.handedness as Handedness,
    skillLevel: profile.skillLevel as SkillLevel,
    primaryClub: profile.primaryClub as ClubType,
    units: profile.units as Units,
    privacyAcknowledgedAt: profile.privacyAcknowledgedAt,
  };
}
