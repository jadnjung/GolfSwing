import { InvalidSwingManifestError, parseSwingManifest } from "./swing";

function validManifest() {
  return {
    id: "abc-123",
    createdAt: "2026-08-03T01:55:00.000Z",
    clubType: "driver",
    cameraView: "face-on",
    cameraPosition: "back",
    frameRate: 60,
    durationMs: 4200,
    analysisStatus: "pending",
    handedness: "right",
  };
}

describe("parseSwingManifest", () => {
  it("parses a valid manifest, defaulting tags to an empty array", () => {
    const swing = parseSwingManifest(validManifest());
    expect(swing).toEqual({ ...validManifest(), tags: [] });
  });

  it("parses tags when present", () => {
    const swing = parseSwingManifest({
      ...validManifest(),
      tags: ["favorite", "needs work"],
    });
    expect(swing.tags).toEqual(["favorite", "needs work"]);
  });

  it.each([
    ["not an object", "null", null],
    ["missing id", "id", { ...validManifest(), id: "" }],
    ["invalid createdAt", "createdAt", { ...validManifest(), createdAt: "not-a-date" }],
    ["invalid clubType", "clubType", { ...validManifest(), clubType: "putterrr" }],
    ["invalid cameraView", "cameraView", { ...validManifest(), cameraView: "side-on" }],
    ["invalid cameraPosition", "cameraPosition", { ...validManifest(), cameraPosition: "top" }],
    ["negative frameRate", "frameRate", { ...validManifest(), frameRate: -1 }],
    ["negative durationMs", "durationMs", { ...validManifest(), durationMs: -1 }],
    ["wrong analysisStatus", "analysisStatus", { ...validManifest(), analysisStatus: "done" }],
    ["invalid handedness", "handedness", { ...validManifest(), handedness: "both" }],
    ["non-array tags", "tags", { ...validManifest(), tags: "favorite" }],
    ["tags with a non-string entry", "tags", { ...validManifest(), tags: ["ok", 5] }],
    ["tags with an empty-string entry", "tags", { ...validManifest(), tags: [""] }],
  ])("rejects a manifest with %s", (_description, _field, malformed) => {
    expect(() => parseSwingManifest(malformed)).toThrow(InvalidSwingManifestError);
  });
});
