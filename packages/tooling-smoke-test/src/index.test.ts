import { TOOLCHAIN_READY, sumAngleComponents } from "./index";

describe("tooling smoke test", () => {
  it("exposes a truthy readiness flag", () => {
    expect(TOOLCHAIN_READY).toBe(true);
  });

  it("runs real TypeScript through Jest, not a no-op", () => {
    expect(sumAngleComponents(2, 3)).toBe(5);
  });
});
