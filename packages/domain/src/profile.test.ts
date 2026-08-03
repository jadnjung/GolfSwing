import { InvalidProfileError, parseProfile } from "./profile";

function validProfile() {
  return {
    handedness: "right",
    skillLevel: "beginner",
    primaryClub: "driver",
    units: "imperial",
    privacyAcknowledgedAt: "2026-08-03T00:00:00.000Z",
  };
}

describe("parseProfile", () => {
  it("parses a valid profile", () => {
    expect(parseProfile(validProfile())).toEqual(validProfile());
  });

  it.each([
    ["not an object", "null", null],
    ["invalid handedness", "handedness", { ...validProfile(), handedness: "both" }],
    ["invalid skillLevel", "skillLevel", { ...validProfile(), skillLevel: "pro" }],
    ["invalid primaryClub", "primaryClub", { ...validProfile(), primaryClub: "hybrid" }],
    ["invalid units", "units", { ...validProfile(), units: "furlongs" }],
    [
      "invalid privacyAcknowledgedAt",
      "privacyAcknowledgedAt",
      { ...validProfile(), privacyAcknowledgedAt: "not-a-date" },
    ],
  ])("rejects a profile with %s", (_description, _field, malformed) => {
    expect(() => parseProfile(malformed)).toThrow(InvalidProfileError);
  });
});
